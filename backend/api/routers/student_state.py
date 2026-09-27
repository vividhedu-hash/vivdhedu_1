"""
/api/v2/me — the durable student record.

Four tables from migration 0007, one identity. `require_user` is the only way
in: it verifies the existing backend JWT and sets `app.user_id` with SET LOCAL
for the request transaction. Every statement below ALSO filters on
`user_id = :user_id`. The backend connects as a role that bypasses RLS, so the
GUC alone would not enforce ownership today; the predicate is what does.

These handlers do not call `session.commit()`. `get_db` commits once, at the
end of the request. An earlier commit would end the transaction and drop the
SET LOCAL, and the next statement would see zero rows.

`category` and `home_state` are returned to the owner, because they are the
owner's answers. They are never logged. `category_verified` cannot be set
from this API — see `student_rules.validate_profile_fields`.
"""
from __future__ import annotations

import logging
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import bindparam, text
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.database import get_db
from ..identity import UserIdentity, require_user
from ..services.student_rules import (
    RuleError,
    assert_status_transition,
    validate_application_create,
    validate_profile_fields,
    validate_shortlist_fields,
)
from .colleges import PROGRAM_SELECT, _build_program_item

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/me", tags=["Student state"])

# Columns a student may write. `category_verified` is absent on purpose.
_PROFILE_COLUMNS = (
    "twelfth_stream",
    "tenth_pct",
    "twelfth_pct",
    "backlog_count",
    "exam_name",
    "expected_rank",
    "jee_rank",
    "jee_main_percentile",
    "neet_score",
    "category",
    "home_state",
    "max_budget_inr",
    "loan_willingness",
    "loan_amount_inr",
    "family_income_band",
    "relocation_india",
    "return_home",
)

_PROFILE_READ = """
    SELECT id, user_id, twelfth_stream, tenth_pct, twelfth_pct, backlog_count,
           exam_name, exam, expected_rank, jee_rank, jee_main_percentile, neet_score,
           category, home_state, category_verified, max_budget_inr, loan_willingness,
           loan_amount_inr, family_income_band, relocation_india, return_home,
           created_at, updated_at
    FROM student_profiles
    WHERE user_id = :user_id
"""


class ProfileWrite(BaseModel):
    twelfth_stream: Optional[str] = None
    tenth_pct: Optional[float] = None
    twelfth_pct: Optional[float] = None
    backlog_count: Optional[int] = None
    exam_name: Optional[str] = None
    expected_rank: Optional[int] = None
    jee_rank: Optional[int] = None
    jee_main_percentile: Optional[float] = None
    neet_score: Optional[int] = None
    category: Optional[str] = None
    home_state: Optional[str] = None
    max_budget_inr: Optional[int] = None
    loan_willingness: Optional[str] = Field(None, max_length=32)
    loan_amount_inr: Optional[int] = None
    family_income_band: Optional[str] = Field(None, max_length=32)
    relocation_india: Optional[str] = Field(None, max_length=16)
    return_home: Optional[str] = Field(None, max_length=16)

    model_config = {"extra": "forbid"}


class ShortlistWrite(BaseModel):
    program_id: str
    note: Optional[str] = None
    priority: Optional[int] = None
    program_label: Optional[str] = Field(None, max_length=256)

    model_config = {"extra": "forbid"}


class ApplicationCreate(BaseModel):
    program_id: str
    college_name: Optional[str] = Field(None, max_length=128)
    program_name: Optional[str] = Field(None, max_length=128)
    tier: Optional[str] = None
    status: str = "planned"
    application_deadline: Optional[date] = None
    counselling_round: Optional[str] = Field(None, max_length=64)
    notes: Optional[str] = None

    model_config = {"extra": "forbid"}


class ApplicationPatch(BaseModel):
    tier: Optional[str] = None
    status: Optional[str] = None
    application_deadline: Optional[date] = None
    counselling_round: Optional[str] = Field(None, max_length=64)
    notes: Optional[str] = None
    college_name: Optional[str] = Field(None, max_length=128)
    program_name: Optional[str] = Field(None, max_length=128)

    model_config = {"extra": "forbid"}


def _rule_error(exc: RuleError) -> HTTPException:
    return HTTPException(status_code=422, detail={"field": exc.field, "message": str(exc)})


def _uuid(value: str, field: str) -> str:
    try:
        return str(uuid.UUID(str(value)))
    except (ValueError, AttributeError, TypeError):
        raise HTTPException(status_code=422, detail={"field": field, "message": f"{field} must be a UUID."})


def _jsonable(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, uuid.UUID):
        return str(value)
    return value


def _row(mapping: Any) -> Dict[str, Any]:
    return {key: _jsonable(val) for key, val in dict(mapping).items()}


def _db_unavailable(exc: Exception) -> HTTPException:
    logger.error("[StudentState] Database error: %s", type(exc).__name__, exc_info=True)
    return HTTPException(
        status_code=503,
        detail={
            "error": "database_unavailable",
            "message": "Your record could not be saved. Nothing was invented in its place.",
        },
    )


# ── Profile ─────────────────────────────────────────────────────────────────

@router.get("/profile")
async def get_profile(
    identity: UserIdentity = Depends(require_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    try:
        result = await db.execute(text(_PROFILE_READ), {"user_id": identity.user_id})
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_unavailable(exc) from exc
    row = result.mappings().first()
    if row is None:
        return {
            "profile": None,
            "message": "No profile stored yet. Admissions odds will not use a category or home state until you save one.",
        }
    return {"profile": _row(row)}


@router.put("/profile")
async def upsert_profile(
    body: ProfileWrite,
    identity: UserIdentity = Depends(require_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    fields = body.model_dump(exclude_unset=True)
    if not fields:
        raise HTTPException(status_code=422, detail={"message": "Send at least one profile field."})
    try:
        validate_profile_fields(fields)
    except RuleError as exc:
        raise _rule_error(exc) from exc

    columns = [name for name in _PROFILE_COLUMNS if name in fields]
    insert_cols = ", ".join(["user_id", *columns])
    insert_vals = ", ".join([":user_id", *[f":{name}" for name in columns]])
    updates = ", ".join(f"{name} = EXCLUDED.{name}" for name in columns)
    params: Dict[str, Any] = {"user_id": identity.user_id}
    for name in columns:
        params[name] = fields[name]

    # user_id is logged. category and home_state are not, even on failure.
    logger.info("[StudentState] Profile upsert for %s (%d fields)", identity, len(columns))
    try:
        await db.execute(
            text(
                f"INSERT INTO student_profiles ({insert_cols}) VALUES ({insert_vals}) "
                f"ON CONFLICT (user_id) DO UPDATE SET {updates}"
            ),
            params,
        )
        result = await db.execute(text(_PROFILE_READ), {"user_id": identity.user_id})
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_unavailable(exc) from exc
    row = result.mappings().first()
    return {"profile": _row(row) if row else None}


# ── Shortlist ───────────────────────────────────────────────────────────────

@router.get("/saved-programs")
async def list_saved_programs(
    identity: UserIdentity = Depends(require_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    One response, catalogue-shaped. The UI should not need a second fetch to
    draw the card: each item is `_build_program_item` (the /colleges shape)
    plus the shortlist's own note and priority.
    """
    try:
        saved = await db.execute(
            text(
                """
                SELECT id, program_id, program_label, note, priority, created_at
                FROM saved_programs
                WHERE user_id = :user_id
                ORDER BY priority NULLS LAST, created_at DESC
                """
            ),
            {"user_id": identity.user_id},
        )
        saved_rows = [_row(r) for r in saved.mappings()]
        if not saved_rows:
            return {"data": [], "total": 0}

        programs = await db.execute(
            text(f"{PROGRAM_SELECT} WHERE p.id IN :ids").bindparams(
                bindparam("ids", expanding=True)
            ),
            {"ids": [row["program_id"] for row in saved_rows]},
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_unavailable(exc) from exc

    by_program = {}
    for mapping in programs.mappings():
        raw = dict(mapping)
        try:
            card = _build_program_item(raw)
        except Exception as exc:  # noqa: BLE001 - one bad row must not blank the list
            logger.warning("[StudentState] Could not shape program %s: %s", raw.get("program_id"), type(exc).__name__)
            card = {
                "id": str(raw.get("program_id") or ""),
                "college": {"name": raw.get("college_full_name")},
                "degree": {"name": raw.get("degree_full_name"), "field": raw.get("degree_field")},
            }
        by_program[str(raw.get("program_id"))] = card

    data: List[Dict[str, Any]] = []
    for saved_row in saved_rows:
        card = by_program.get(str(saved_row["program_id"]))
        data.append({
            "saved_id": saved_row["id"],
            "program_id": saved_row["program_id"],
            "program_label": saved_row["program_label"],
            "note": saved_row["note"],
            "priority": saved_row["priority"],
            "saved_at": saved_row["created_at"],
            "program": card,
            "program_missing": card is None,
        })
    return {"data": data, "total": len(data)}


@router.put("/saved-programs")
async def save_program(
    body: ShortlistWrite,
    identity: UserIdentity = Depends(require_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    program_id = _uuid(body.program_id, "program_id")
    try:
        validate_shortlist_fields(body.priority, body.note)
    except RuleError as exc:
        raise _rule_error(exc) from exc
    try:
        exists = await db.execute(
            text("SELECT 1 FROM programs WHERE id = :id"),
            {"id": program_id},
        )
        if exists.first() is None:
            raise HTTPException(status_code=404, detail={"field": "program_id", "message": "No program with that id."})
        await db.execute(
            text(
                """
                INSERT INTO saved_programs (user_id, program_id, program_label, note, priority)
                VALUES (:user_id, :program_id, :program_label, :note, :priority)
                ON CONFLICT (user_id, program_id) DO UPDATE SET
                    program_label = COALESCE(EXCLUDED.program_label, saved_programs.program_label),
                    note = COALESCE(EXCLUDED.note, saved_programs.note),
                    priority = COALESCE(EXCLUDED.priority, saved_programs.priority)
                """
            ),
            {
                "user_id": identity.user_id,
                "program_id": program_id,
                "program_label": body.program_label,
                "note": body.note,
                "priority": body.priority,
            },
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_unavailable(exc) from exc
    return {"saved": True, "program_id": program_id}


@router.delete("/saved-programs/{program_id}")
async def unsave_program(
    program_id: str,
    identity: UserIdentity = Depends(require_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    program_id = _uuid(program_id, "program_id")
    try:
        result = await db.execute(
            text(
                "DELETE FROM saved_programs WHERE user_id = :user_id AND program_id = :program_id"
            ),
            {"user_id": identity.user_id, "program_id": program_id},
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_unavailable(exc) from exc
    return {"removed": (result.rowcount or 0) > 0, "program_id": program_id}


# ── Applications ────────────────────────────────────────────────────────────

_APPLICATION_READ = """
    SELECT id, program_id, college_name, program_name, tier, status,
           application_deadline, submitted_at, counselling_round, notes,
           created_at, updated_at
    FROM applications
    WHERE user_id = :user_id
"""


@router.get("/applications/upcoming")
async def upcoming_deadlines(
    identity: UserIdentity = Depends(require_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Deadlines inside the next 60 days that are still actionable.

    Counselling windows in India are short. This is the query a later
    notification surface should call. Admitted and rejected rows are excluded:
    the date on those is history, not a reminder.
    """
    try:
        result = await db.execute(
            text(
                _APPLICATION_READ
                + """
                  AND application_deadline IS NOT NULL
                  AND application_deadline >= CURRENT_DATE
                  AND application_deadline <= CURRENT_DATE + INTERVAL '60 days'
                  AND status IN ('planned', 'submitted', 'shortlisted', 'waitlisted')
                  ORDER BY application_deadline ASC
                """
            ),
            {"user_id": identity.user_id},
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_unavailable(exc) from exc
    rows = [_row(r) for r in result.mappings()]
    return {"data": rows, "total": len(rows), "window_days": 60}


@router.get("/applications")
async def list_applications(
    identity: UserIdentity = Depends(require_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    try:
        result = await db.execute(
            text(_APPLICATION_READ + " ORDER BY application_deadline NULLS LAST, created_at DESC"),
            {"user_id": identity.user_id},
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_unavailable(exc) from exc
    rows = [_row(r) for r in result.mappings()]
    return {"data": rows, "total": len(rows)}


@router.post("/applications", status_code=201)
async def create_application(
    body: ApplicationCreate,
    identity: UserIdentity = Depends(require_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    program_id = _uuid(body.program_id, "program_id")
    try:
        validate_application_create(body.tier, body.status)
    except RuleError as exc:
        raise _rule_error(exc) from exc
    try:
        exists = await db.execute(text("SELECT 1 FROM programs WHERE id = :id"), {"id": program_id})
        if exists.first() is None:
            raise HTTPException(status_code=404, detail={"field": "program_id", "message": "No program with that id."})
        inserted = await db.execute(
            text(
                """
                INSERT INTO applications (
                    user_id, program_id, college_name, program_name, tier, status,
                    application_deadline, counselling_round, notes, submitted_at
                ) VALUES (
                    :user_id, :program_id, :college_name, :program_name, :tier, :status,
                    :application_deadline, :counselling_round, :notes,
                    CASE WHEN :status = 'submitted' THEN NOW() ELSE NULL END
                )
                ON CONFLICT (user_id, program_id) DO NOTHING
                RETURNING id
                """
            ),
            {
                "user_id": identity.user_id,
                "program_id": program_id,
                "college_name": body.college_name,
                "program_name": body.program_name,
                "tier": body.tier,
                "status": body.status,
                "application_deadline": body.application_deadline,
                "counselling_round": body.counselling_round,
                "notes": body.notes,
            },
        )
        created = inserted.first()
        if created is None:
            raise HTTPException(
                status_code=409,
                detail={"message": "You already have an application for this program. Update that row instead of creating a second one."},
            )
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_unavailable(exc) from exc
    return {"id": str(created[0]), "program_id": program_id, "status": body.status}


@router.patch("/applications/{application_id}")
async def update_application(
    application_id: str,
    body: ApplicationPatch,
    identity: UserIdentity = Depends(require_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    application_id = _uuid(application_id, "application_id")
    fields = body.model_dump(exclude_unset=True)
    if not fields:
        raise HTTPException(status_code=422, detail={"message": "Send at least one field to update."})
    if body.tier is not None:
        try:
            validate_application_create(body.tier, "planned")
        except RuleError as exc:
            if exc.field == "tier":
                raise _rule_error(exc) from exc
    try:
        current = await db.execute(
            text(
                "SELECT status FROM applications WHERE id = :id AND user_id = :user_id"
            ),
            {"id": application_id, "user_id": identity.user_id},
        )
        row = current.mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail={"message": "No application with that id on your account."})
        if "status" in fields:
            try:
                assert_status_transition(row["status"], fields["status"])
            except RuleError as exc:
                raise _rule_error(exc) from exc

        assignments = []
        params: Dict[str, Any] = {"id": application_id, "user_id": identity.user_id}
        for key, value in fields.items():
            assignments.append(f"{key} = :{key}")
            params[key] = value
        if fields.get("status") == "submitted":
            assignments.append("submitted_at = COALESCE(submitted_at, NOW())")
        await db.execute(
            text(
                "UPDATE applications SET "
                + ", ".join(assignments)
                + " WHERE id = :id AND user_id = :user_id"
            ),
            params,
        )
        refreshed = await db.execute(
            text(_APPLICATION_READ + " AND id = :id"),
            {"user_id": identity.user_id, "id": application_id},
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_unavailable(exc) from exc
    updated = refreshed.mappings().first()
    return {"application": _row(updated) if updated else None}
