"""
API Router — POST /api/waitlist

Launch conversion endpoint. One row per email address, upserted.

Privacy notes (these are load-bearing, not decoration):
  * No address is ever written to the log. `_email_for_log` reduces an address
    to its domain, so a support engineer reading logs cannot reconstruct a
    lead list from them.
  * The table is RLS-enabled with no anon/authenticated policies (migration
    0003), so the anon key that ships in the client bundle cannot read it.
"""
import json
import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from ..db.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(tags=["waitlist"])

# Tracks offered on the waitlist form. Kept as a closed set so the column stays
# as clean as the API contract — the DB column is untyped TEXT so that adding a
# track later does not need a migration.
VALID_INTERESTS = {"student", "parent", "counsellor", "institution"}


class WaitlistRequest(BaseModel):
    email: EmailStr
    full_name: Optional[str] = Field(default=None, max_length=200)
    interest: Optional[str] = Field(default=None, max_length=32)
    referral_source: Optional[str] = Field(default=None, max_length=200)
    # Free-form context: which page the form was submitted from.
    payload: Optional[Dict[str, Any]] = Field(default=None)
    utm: Optional[Dict[str, str]] = Field(default=None)

    @field_validator("full_name", "referral_source")
    @classmethod
    def _strip(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        return v or None

    @field_validator("interest")
    @classmethod
    def _validate_interest(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip().lower()
        if not v:
            return None
        if v not in VALID_INTERESTS:
            raise ValueError(f"interest must be one of: {', '.join(sorted(VALID_INTERESTS))}")
        return v


def _email_for_log(email: str) -> str:
    """Domain-only, so logs never contain a reconstructable address."""
    return email.rsplit("@", 1)[-1][:60]


def _rate_limit(request: Request) -> None:
    """
    Consume one hit of the shared slowapi budget.

    slowapi's decorator form needs a `request` argument on the route and
    resolves the limiter off the app state, but the limiter itself is built in
    main.py — importing it at module scope would be circular (main.py imports
    this router). The limiter is therefore read off the live app state at call
    time, which is the same instance main.py already put there and already
    registered an exception handler for.

    Storage is in-memory by default, which is per-process: with multiple
    uvicorn workers the budget is per worker. That is acceptable for an abuse
    backstop on a lead endpoint and is not treated as a security control.
    """
    limiter = getattr(request.app.state, "limiter", None)
    if limiter is None:
        # App booted without the limiter (e.g. mounted standalone). Fail open
        # rather than 500 every signup.
        return
    try:
        limiter._check_request_limit(request, request.endpoint or "waitlist", False)
    except Exception as e:  # RateLimitExceeded and anything storage-related
        from slowapi.errors import RateLimitExceeded

        if isinstance(e, RateLimitExceeded):
            raise HTTPException(
                status_code=429,
                detail={"error": "rate_limited", "reason": "Too many signups from this address. Try again shortly."},
            )
        logger.warning("[waitlist] rate limiter unavailable: %s", e)


_UPSERT = text("""
    INSERT INTO waitlist_signups (email, full_name, interest, referral_source, payload, utm)
    VALUES (:email, :full_name, :interest, :referral_source, CAST(:payload AS JSONB), CAST(:utm AS JSONB))
    ON CONFLICT (LOWER(email)) DO UPDATE SET
      full_name       = COALESCE(EXCLUDED.full_name, waitlist_signups.full_name),
      interest        = COALESCE(EXCLUDED.interest, waitlist_signups.interest),
      referral_source = COALESCE(EXCLUDED.referral_source, waitlist_signups.referral_source),
      payload         = COALESCE(EXCLUDED.payload, waitlist_signups.payload),
      utm             = COALESCE(EXCLUDED.utm, waitlist_signups.utm),
      updated_at      = NOW()
    RETURNING id, email, full_name, interest, created_at
""")


@router.post("/api/waitlist")
async def join_waitlist(
    request: Request,
    body: WaitlistRequest,
    session: Any = Depends(get_db),
):
    """
    Join the launch waitlist. Idempotent: submitting the same address twice
    updates the existing row rather than erroring.

    ON CONFLICT targets `LOWER(email) = LOWER(EXCLUDED.email)` because the
    unique index from migration 0003 is on that expression, not on the bare
    column. Writing `ON CONFLICT (email)` instead raises 42P10 on every
    signup. COALESCE keeps an existing value when a resubmission omits it, so
    re-entering only an email from a different page does not erase the
    interest captured on the first visit.
    """
    _rate_limit(request)

    email = body.email.lower().strip()

    try:
        result = await session.execute(
            _UPSERT,
            {
                "email": email,
                "full_name": body.full_name,
                "interest": body.interest,
                "referral_source": body.referral_source,
                "payload": json.dumps(body.payload) if body.payload else None,
                "utm": json.dumps(body.utm) if body.utm else None,
            },
        )
        row = result.mappings().one()
    except IntegrityError:
        # Lost a race against a concurrent insert for the same address. The
        # other request won, which is the desired end state, so treat it as
        # success rather than surfacing a 500 to someone who just signed up.
        await session.rollback()
        logger.info("[waitlist] concurrent insert for domain=%s — treating as success", _email_for_log(email))
        return {"status": "ok", "duplicate": True, "email": email}
    except SQLAlchemyError as e:
        logger.error("[waitlist] signup failed for domain=%s: %s", _email_for_log(email), e)
        raise HTTPException(
            status_code=503,
            detail={"error": "waitlist_unavailable", "reason": "Could not record the signup."},
        )

    # Logged without the address on purpose — see the module docstring.
    logger.info("[waitlist] signup ok for domain=%s interest=%s", _email_for_log(email), body.interest or "-")

    return {
        "status": "ok",
        # The address is echoed back because the submitter typed it, not because
        # the client is privileged. The UI uses it to render a masked
        # confirmation line.
        "email": row["email"],
        "full_name": row["full_name"],
        "interest": row["interest"],
        "created_at": row["created_at"].isoformat() if row["created_at"] else None,
    }
