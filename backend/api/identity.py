"""
Shared user-identity dependency for the four student-state routers
(student_profiles, saved_programs, applications, psychometric_sessions).

Why this module exists
----------------------
Migration 0007 keyed all four tables on `users.id` and gated them with RLS
policies that read a Postgres GUC rather than `auth.uid()`:

    USING (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)

`auth.uid()` is genuinely unusable here — this backend signs its OWN HS256
token (`api/routers/auth.py:create_access_token`, payload key `sub`) and mints
a fresh `users.id` on every backend sign-in, so a Supabase-shaped policy would
evaluate FALSE forever for a genuinely signed-in student. The migration's own
header says this in full; it is repeated here only because this is the module
that has to be correct about it.

The mechanism chosen, and why it is safe under connection pooling
-----------------------------------------------------------------
1. IDENTITY IS NOT REINVENTED. `require_user` composes
   `api.routers.auth.get_current_user` as a FastAPI dependency, so the JWT is
   decoded by the SAME `decode_access_token` the rest of the app uses and the
   profile is read from the SAME `users` table by the SAME code path. There is
   exactly one auth implementation; this module only adds the GUC and the
   transaction scoping around it.

2. THE GUC IS SET WITH `set_config(..., is_local => true)`, which is the
   parameterised form of `SET LOCAL`. This is the only safe primitive here,
   and the reason is worth stating precisely:

     - A session-level `SET app.user_id = ...` (or `set_config(..., false)`)
       OUTLIVES the transaction. The engine hands connections back to a pool
       (`create_async_engine(pool_size=10, max_overflow=20)`), so the next
       request to land on that connection would inherit the previous student's
       identity and read THEIR rows. That is a cross-tenant data leak created
       purely by connection reuse.
     - `is_local => true` ties the setting to the enclosing transaction. COMMIT
       *and* ROLLBACK both reset it, and the reset happens server-side, so no
       error path in the request can leave it set. A crash mid-request leaks
       nothing because the connection's transaction is rolled back on return.
     - An UNSET GUC makes `current_setting('app.user_id', true)` return NULL,
       `NULLIF(NULL, '')` is NULL, and `user_id = NULL` is never true — so the
       failure mode is "zero rows", not "all rows". It fails CLOSED.

3. THE RESET IS ALSO EXPLICIT. `require_user` clears the GUC in a `finally`
   before the transaction commits. This is belt-and-braces over point 2, and it
   is what makes the dependency safe to reuse from a route that opens its own
   transaction later.

4. ONE FOOTGUN IS CALLED OUT BECAUSE IT IS EASY TO FALL INTO. `SET LOCAL` dies
   at COMMIT. A route that calls `await db.commit()` partway through a request
   and then keeps querying one of these four tables will start a NEW transaction
   with NO GUC and see zero rows. So: the routers in this phase rely on
   `get_db`'s single trailing commit and MUST NOT call `session.commit()`
   themselves. This is documented at each call site.

5. DEFENCE IN DEPTH, NOT INSTEAD OF. The backend connects as `postgres`, which
   BYPASSES RLS entirely, so the GUC is currently belt-and-braces. Every query
   in these routers therefore ALSO carries an explicit `AND user_id = :user_id`
   predicate. The GUC is what makes the policies correct if the connection role
   ever changes; the explicit predicate is what enforces ownership today. Either
   one alone would be a weaker control than having both.

Optional auth
-------------
`get_current_user_optional` exists for exactly one route: the psychometric
endpoints, which are public by design (`/start` takes no credentials and the
test is free). It decodes with the same `decode_access_token` and reads the
same `users` row; the ONLY difference is that it returns None instead of
raising 401 when no valid token is present. Anonymous is a legitimate state for
that one table and for no other.
"""
from __future__ import annotations

import json
import logging
import uuid as uuid_lib
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import Any, AsyncIterator, Dict, Mapping, Optional

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# api/ is package depth 1, so a SINGLE dot is the most these may use. `..` here
# would raise ImportError under `uvicorn api.main:app` — the exact class of
# bug the CI `import-depth-guard` job exists to block.
from .db.database import get_db
from .routers.auth import decode_access_token, get_current_user

logger = logging.getLogger(__name__)

# The GUC name must match migration 0007's policies character for character.
APP_USER_ID_GUC = "app.user_id"

# The header migration 0007's anonymous psychometric policy reads out of
# `current_setting('request.headers')`. PostgREST sets that GUC itself; a
# direct asyncpg connection does not, so this module sets it explicitly when a
# caller presents the handle.
PSYCHOMETRIC_TOKEN_HEADER = "x-psychometric-token"

__all__ = [
    "APP_USER_ID_GUC",
    "PSYCHOMETRIC_TOKEN_HEADER",
    "UserIdentity",
    "get_current_user_optional",
    "require_user",
    "resolve_optional_user",
    "set_request_headers_guc",
    "user_guc_scope",
]


# ─── Identity object ────────────────────────────────────────────────────────

@dataclass(frozen=True)
class UserIdentity:
    """
    The single source of truth for "who is calling" across the student-state
    routers. Frozen so a handler cannot mutate the identity mid-request.

    Only fields that are safe to log live here. `category` and `home_state` are
    deliberately NOT carried: they are individually sensitive (combined with a
    rank they are effectively re-identifying) and they are fetched from
    `student_profiles` at the point of use, never logged, never echoed into
    analytics.
    """

    user_id: str
    email: str
    full_name: Optional[str]
    is_premium: bool

    def __str__(self) -> str:  # pragma: no cover - logging convenience
        # Deliberately returns the id only. A __repr__ that dumped the whole
        # dataclass would put the email in logs on an accidental interpolation.
        return f"UserIdentity({self.user_id})"


# ─── Helpers ────────────────────────────────────────────────────────────────

def _is_uuid(value: Any) -> bool:
    try:
        uuid_lib.UUID(str(value))
    except (ValueError, AttributeError, TypeError):
        return False
    return True


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


async def _load_user_row(session: AsyncSession, user_id: Any) -> Optional[Dict[str, Any]]:
    """
    Read one row from `users`. Same projection `auth.get_current_user` uses, so
    an optional caller and a required caller cannot disagree about who a user
    is.
    """
    result = await session.execute(
        text(
            "SELECT id, email, full_name, avatar_url, is_premium, premium_tier, "
            "premium_until, created_at FROM users WHERE id = :id"
        ),
        {"id": str(user_id)},
    )
    row = result.mappings().first()
    return dict(row) if row else None


# ─── The GUC scope ──────────────────────────────────────────────────────────

@asynccontextmanager
async def user_guc_scope(
    session: AsyncSession,
    user_id: Optional[str],
) -> AsyncIterator[None]:
    """
    Bind `app.user_id` for the duration of one transaction.

    See the module docstring for why `is_local => true` is the only acceptable
    primitive here. The explicit reset in `finally` is deliberately redundant:
    COMMIT already discards a local setting, but clearing it means that even a
    caller who commits early inside this block cannot leave a stale identity
    behind for the rest of the transaction.
    """
    if user_id is not None and not _is_uuid(user_id):
        # A non-UUID `sub` would make the policy's `::uuid` cast raise, turning
        # a bad token into a 500. Fail closed as an auth failure instead.
        raise _unauthorized("Token subject is not a valid user id.")

    await session.execute(
        text("SELECT set_config('app.user_id', :uid, true)"),
        {"uid": str(user_id) if user_id is not None else ""},
    )
    try:
        yield
    finally:
        await session.execute(
            text("SELECT set_config('app.user_id', '', true)")
        )


async def set_request_headers_guc(
    session: AsyncSession,
    headers: Mapping[str, str],
) -> None:
    """
    Publish the caller's headers into the `request.headers` GUC.

    Migration 0007's anonymous-psychometric policy compares
    `current_setting('request.headers')::jsonb ->> 'x-psychometric-token'` with
    the row's `session_id`. Under PostgREST that GUC exists; over a direct
    asyncpg connection nothing populates it, so the policy's expression is
    NULL and the row is correctly invisible. This function is what makes the
    intended token-scoped read actually reachable — and reachable ONLY for a
    handle the caller genuinely presented.

    Lower-cased keys: Postgres jsonb `->>` is case-sensitive and HTTP header
    names are case-insensitive, so a mismatch here would silently deny access
    rather than leak it. Denying is the safe direction to fail in, but a
    legitimate caller being denied is still a bug worth not having.
    """
    payload = json.dumps({str(k).lower(): str(v) for k, v in headers.items()})
    await session.execute(
        text("SELECT set_config('request.headers', :headers, true)"),
        {"headers": payload},
    )


# ─── Required identity ──────────────────────────────────────────────────────

async def require_user(
    current_user: Dict[str, Any] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> AsyncIterator[UserIdentity]:
    """
    The single required-identity dependency. Used by student_profiles,
    saved_programs and applications.

    Fails closed in three ways, all inherited from `get_current_user` rather
    than reimplemented: no/!Bearer header -> 401; bad or expired signature ->
    401; valid signature but the user row is gone -> 404; database unreachable
    -> 503 (never a synthesised identity).
    """
    user_id = str(current_user["id"])
    async with user_guc_scope(session, user_id):
        yield UserIdentity(
            user_id=user_id,
            email=current_user.get("email") or "",
            full_name=current_user.get("full_name"),
            is_premium=bool(current_user.get("is_premium")),
        )


# ─── Optional identity ──────────────────────────────────────────────────────

async def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    session: AsyncSession = Depends(get_db),
) -> Optional[Dict[str, Any]]:
    """
    Same verification as `auth.get_current_user`, but absence of a token is a
    legitimate `None` rather than a 401.

    This exists for the psychometric routes alone. It is a wrapper, not a
    second auth path: it calls the same `decode_access_token` against the same
    configured secret and algorithm, and reads the same `users` row. The only
    behavioural difference is that "not signed in" is not an error, because
    `/api/v2/psychometric/start` is public by design and the migration makes
    `psychometric_sessions.user_id` nullable for exactly that reason.

    A token that is PRESENT but invalid is still a 401. Silently downgrading a
    bad credential to "anonymous" would let a caller who believes they are
    signed in read and mutate a row under the anonymous token path.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        return None

    # Raises HTTPException(401) on a bad signature or an expired token.
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise _unauthorized("Token has no subject.")
    if not _is_uuid(user_id):
        raise _unauthorized("Token subject is not a valid user id.")

    try:
        row = await _load_user_row(session, user_id)
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001 - never leak an unexpected shape
        logger.error(
            "[Identity] Optional profile lookup failed for sub=%s: %s",
            user_id,
            exc,
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "database_unavailable",
                "message": "Could not load your profile. Please try again shortly.",
            },
        ) from exc

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User account not found"
        )
    return row


async def resolve_optional_user(
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
    session: AsyncSession = Depends(get_db),
) -> AsyncIterator[Optional[UserIdentity]]:
    """
    Optional counterpart to `require_user`.

    Sets the GUC when there IS a user and deliberately clears it when there is
    not. Clearing is the important half: an anonymous psychometric session is
    selected by `user_id IS NULL`, and a leftover GUC from a pooled connection
    would be a variable the anonymous path did not ask for. Expressed as a
    dependency rather than a helper so the GUC is always scoped to the request.
    """
    async with user_guc_scope(session, str(current_user["id"]) if current_user else None):
        if current_user is None:
            yield None
            return
        yield UserIdentity(
            user_id=str(current_user["id"]),
            email=current_user.get("email") or "",
            full_name=current_user.get("full_name"),
            is_premium=bool(current_user.get("is_premium")),
        )
