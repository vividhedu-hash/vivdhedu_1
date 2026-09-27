"""
Shared reads over the four student-state tables (migration 0007).

Plain async functions taking an `AsyncSession`. No FastAPI imports and no
dependency wiring, because this module is consumed from two places with very
different shapes:

  * the routers in `api/routers/`, which receive a session from `get_db`, and
  * `services/personal_intelligence.py`, which receives one as a plain argument
    and must stay importable by the analysis flow.

Why the profile read is here at all
-----------------------------------
`personal_intelligence.py:128-131` reads four keys off a merged profile dict:

    student_rank = merged_profile.get("expected_rank") or merged_profile.get("jee_rank") or 12000.0
    exam_name    = merged_profile.get("exam") or "JEE Main"
    category     = merged_profile.get("category") or "General"
    home_state   = merged_profile.get("home_state") or "Maharashtra"

Until now nothing ever wrote `category` or `home_state` into that dict, so the
engine silently evaluated every student as General + Maharashtra — the
migration's own header calls this out. The defaults are not neutral: they are a
specific, and for a non-General non-Maharashtra student an optimistic, answer.

This module is what actually connects the stored profile to those reads, via
`load_engine_profile`. The report token is the join key because
`user_saved_reports` (populated by `POST /api/v1/auth/save-report`) already
maps a report to its owner, so the analysis flow can resolve a stored profile
WITHOUT gaining a new auth requirement and without any caller having to change
its request shape.

SELECTION SENSITIVITY
---------------------
`category` and `home_state` are returned by this module to the services that
genuinely need them (the admissions engine's reservation multipliers) and are
NOT returned by any analytics or logging path. `describe_profile_for_analytics`
exists precisely so that there is a function whose job is to produce a
loggable shape with those fields removed, rather than every call site
remembering to strip them.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# Columns selected for the engine. `exam` is the migration's GENERATED ALWAYS
# alias of `exam_name`; selecting it under its own name is what lets this dict
# drop straight into the existing `merged_profile.get("exam")` read with no
# change to services/personal_intelligence.py.
_PROFILE_ENGINE_COLUMNS = """
    exam, exam_name, expected_rank, jee_rank, neet_score,
    twelfth_stream, home_state, category, category_verified,
    max_budget_inr
"""

# Fields that must never be logged, echoed into analytics, or included in an
# error message. Individually sensitive: combined with a rank, category and home
# state are effectively re-identifying, and the reservation multiplier turns
# them into a material admissions claim.
SENSITIVE_PROFILE_FIELDS = frozenset({"category", "home_state"})


async def load_stored_profile(
    db: AsyncSession,
    user_id: str,
) -> Optional[Dict[str, Any]]:
    """
    Read one student's stored profile. Returns None when they have not created
    one yet — which is a normal, non-exceptional state, not a failure.
    """
    if not db or not user_id:
        return None
    result = await db.execute(
        text(
            f"SELECT {_PROFILE_ENGINE_COLUMNS} "
            "FROM student_profiles WHERE user_id = :user_id"
        ),
        {"user_id": str(user_id)},
    )
    row = result.mappings().first()
    return dict(row) if row else None


async def resolve_user_id_for_token(
    db: AsyncSession,
    token: str,
) -> Optional[str]:
    """
    Map a report token to the account that saved it.

    `user_saved_reports` is the existing link between the two id spaces: the
    report lives in the token world (`student_reports.token`) and the durable
    profile lives in the account world (`users.id`). Returns None for a token
    nobody has saved, or for a database that is unreachable — in both cases the
    caller simply proceeds with no stored profile rather than failing.
    """
    if not db or not token:
        return None
    try:
        result = await db.execute(
            text("SELECT user_id FROM user_saved_reports WHERE report_token = :token"),
            {"token": str(token)},
        )
        row = result.mappings().first()
        return str(row["user_id"]) if row else None
    except Exception as exc:  # noqa: BLE001 - a lookup miss must not 500
        logger.warning("[StudentState] Report-to-user lookup failed: %s", exc)
        return None


async def load_engine_profile(
    db: Optional[AsyncSession],
    token: Optional[str],
) -> Dict[str, Any]:
    """
    The durable profile, shaped for the admissions/analysis engine.

    Returns {} when there is no token, no saved report, or no stored profile.
    Callers merge this UNDER their own inputs, so an explicit value for this
    request always wins.
    """
    user_id = await resolve_user_id_for_token(db, token) if db else None
    if not user_id:
        return {}
    profile = await load_stored_profile(db, user_id)
    return _to_engine_shape(profile) if profile else {}


def _to_engine_shape(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map a `student_profiles` row onto the keys the existing services read.

    Only the keys that actually have a consumer are emitted. The 0-valued
    defaults from the migration are translated to None where the consumer
    treats None as "not answered" — `expected_rank or jee_rank or 12000.0` would
    otherwise never fall through to the JEE rank for a NEET-only student whose
    expected_rank was never set, because a default 0 is falsy but so is the
    missing value, and the chain has to be read in the right order to be right.
    """
    shape: Dict[str, Any] = {}

    expected_rank = row.get("expected_rank")
    jee_rank = row.get("jee_rank")

    # The engine reads `expected_rank or jee_rank`. Coalesce here so the value
    # that will actually drive the calculation is the one stored, whichever
    # column the student filled in. Never emit 0: `0 or jee_rank` silently
    # picks the other column and hides a data-entry mistake.
    if expected_rank is not None:
        shape["expected_rank"] = expected_rank
    elif jee_rank is not None:
        shape["expected_rank"] = jee_rank

    if jee_rank is not None:
        shape["jee_rank"] = jee_rank

    exam_name = row.get("exam") or row.get("exam_name")
    if exam_name:
        # The column is a NOT NULL DEFAULT 'JEE Main', so this is nearly always
        # present. It is emitted under BOTH keys because
        # personal_intelligence.py reads `exam` and gemini_advisor.py reads
        # `exam`; the second is belt-and-braces for a caller that reads
        # `exam_name` directly.
        shape["exam"] = exam_name
        shape["exam_name"] = exam_name

    if row.get("neet_score") is not None:
        shape["neet_score"] = row["neet_score"]
    if row.get("twelfth_stream"):
        shape["twelfth_stream"] = row["twelfth_stream"]

    # Category and home state. `category_verified` rides along NOT as a claim
    # the engine should honour but as provenance: the caller can tell the user
    # that these odds assume a claim nobody has sighted a certificate for.
    if row.get("category"):
        shape["category"] = row["category"]
    if row.get("home_state"):
        shape["home_state"] = row["home_state"]
    if row.get("category") or row.get("home_state"):
        shape["category_verified"] = bool(row.get("category_verified"))

    if row.get("max_budget_inr") is not None:
        # Named `max_budget_inr` on the table and `budget_inr` in the engine's
        # echoed `student_profile` block; both spellings are emitted so no
        # consumer has to know which table it came from.
        shape["max_budget_inr"] = row["max_budget_inr"]
        shape["budget_inr"] = row["max_budget_inr"]

    return shape


def describe_profile_for_analytics(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Strip a profile down to what may safely be logged or sent to an analytics
    sink. Category and home state are removed entirely — not hashed, not
    generalised. There is no honest way to make them safe to emit, and a
    "coarsened" version would still narrow a Class 10-12 cohort to a handful of
    people, so they do not go.

    `has_category` / `has_home_state` booleans are kept because a count of how
    many students have supplied a category is not sensitive and is the only
    useful aggregate.
    """
    safe = {
        key: value
        for key, value in (row or {}).items()
        if key not in SENSITIVE_PROFILE_FIELDS
    }
    safe["has_category"] = bool((row or {}).get("category"))
    safe["has_home_state"] = bool((row or {}).get("home_state"))
    return safe
