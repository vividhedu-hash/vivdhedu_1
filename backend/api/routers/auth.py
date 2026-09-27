"""
Authentication & OAuth 2.0 Router
==================================
OAuth sign-in for non-browser callers (see docs/AUTH.md for why the browser
uses Supabase Auth instead):
- Google OAuth 2.0 (ID token verified against Google's JWKS, or code exchange)
- GitHub OAuth 2.0 (code exchange + primary verified email via the REST API)
- Magic link / Email authentication
- JWT session management (HS256 signed)
- User profile & Saved Reports association

Premium is deliberately absent: no route grants entitlement, and
`/premium/upgrade` fails closed with 501 because billing is not implemented.
"""

import logging
import urllib.parse
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

import jwt
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

try:
    from ..config import settings
    from ..db.database import get_db
    from ..oauth import IdentityVerificationError, VerifiedIdentity, verify_google_id_token
except ImportError:
    from ..config import settings
    from ..db.database import get_db
    from ..oauth import IdentityVerificationError, VerifiedIdentity, verify_google_id_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication & OAuth"])


# ─── Verification helpers ───────────────────────────────────────────────────

def _raise_unconfigured() -> None:
    raise IdentityVerificationError("Provider credentials are not configured.")


def _verify_or_401(verify, detail: str):
    """
    Run a verification callable and convert any failure into a 401.

    The point of the wrapper is that there is exactly one failure shape: the
    caller is told the identity could not be verified and no session is
    produced. A verification error must never escape as a 500, and must never
    be swallowed into a default identity.
    """
    try:
        return verify()
    except IdentityVerificationError as exc:
        logger.warning("[Auth] Identity verification failed: %s", exc)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail) from exc
    except Exception as exc:  # noqa: BLE001 - never leak an unexpected error shape
        logger.error("[Auth] Unexpected identity verification error: %s", exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail) from exc


def _exchange_google_code(payload: "GoogleTokenPayload") -> str:
    """Trade an authorization code for Google's ID token. Raises on failure."""
    import json
    import urllib.parse
    import urllib.request

    body = urllib.parse.urlencode(
        {
            "code": payload.code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": payload.redirect_uri or settings.google_redirect_uri,
            "grant_type": "authorization_code",
        }
    ).encode()
    request = urllib.request.Request("https://oauth2.googleapis.com/token", data=body, method="POST")
    with urllib.request.urlopen(request, timeout=8) as response:
        token_data = json.loads(response.read().decode())

    id_token = token_data.get("id_token")
    if not id_token:
        raise IdentityVerificationError("Google's token endpoint returned no id_token.")
    return id_token


# ─── Pydantic Schemas ──────────────────────────────────────────────────────────

class GoogleTokenPayload(BaseModel):
    id_token: Optional[str] = None
    code: Optional[str] = None
    redirect_uri: Optional[str] = None


class GitHubTokenPayload(BaseModel):
    code: str
    redirect_uri: Optional[str] = None


class EmailAuthPayload(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class SaveReportPayload(BaseModel):
    report_token: str
    title: Optional[str] = "My Degree ROI Analysis"


class PremiumUpgradePayload(BaseModel):
    payment_id: str
    tier: str = "pro_lifetime"  # "pro_monthly" or "pro_lifetime"
    gateway: str = "razorpay"


class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    is_premium: bool
    premium_tier: str
    premium_until: Optional[str]
    created_at: str


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_hours: int
    user: UserProfileResponse


# ─── JWT Helpers ─────────────────────────────────────────────────────────────

def create_access_token(user_id: str, email: str, is_premium: bool) -> str:
    secret = settings.jwt_secret or settings.secret_key
    payload = {
        "sub": user_id,
        "email": email,
        "is_premium": is_premium,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours),
        "iss": "The Project Auth Service",
    }
    return jwt.encode(payload, secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> Dict[str, Any]:
    secret = settings.jwt_secret or settings.secret_key
    try:
        payload = jwt.decode(token, secret, algorithms=[settings.jwt_algorithm])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid authentication token: {e}")


async def get_current_user(
    authorization: Optional[str] = Header(None),
    session: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header (Expected: Bearer <token>)",
        )
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    user_id = payload.get("sub")

    # The profile is read from the database rather than rebuilt from the token's
    # claims. A bare `except Exception` used to answer here with a "Demo User"
    # profile assembled from the caller's own token, which meant any database
    # outage silently turned into a successful authentication with an invented
    # name. A dependency that is unavailable is a 503, not a signed-in user.
    try:
        q = text("SELECT id, email, full_name, avatar_url, is_premium, premium_tier, premium_until, created_at FROM users WHERE id = :id")
        res = await session.execute(q, {"id": user_id})
        user = res.mappings().first()
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("[Auth] Profile lookup failed for sub=%s: %s", user_id, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "database_unavailable",
                "message": "Could not load your profile. Please try again shortly.",
            },
        ) from exc

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found")

    return dict(user)


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/google/url")
async def get_google_oauth_url(redirect_uri: Optional[str] = None):
    """
    Returns the Google OAuth 2.0 authorization redirect URL.
    Configure GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI in your environment.
    """
    client_id = settings.google_client_id or "GOOGLE_CLIENT_ID_NOT_CONFIGURED"
    effective_redirect = redirect_uri or settings.google_redirect_uri
    scope = "openid email profile"
    url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={client_id}&"
        f"redirect_uri={effective_redirect}&"
        "response_type=code&"
        f"scope={scope}&"
        "access_type=offline&"
        "prompt=consent"
    )
    return {
        "oauth_url": url,
        "client_id": client_id,
        "redirect_uri": effective_redirect,
        "configured": bool(settings.google_client_id),
    }


@router.post("/google/callback", response_model=AuthTokenResponse)
async def google_oauth_callback(
    payload: GoogleTokenPayload,
    session: AsyncSession = Depends(get_db),
):
    """
    Verifies a Google ID token (or exchanges an authorization code for one),
    upserts the user, and returns a signed session token.

    Every path into this handler ends in a cryptographically verified Google
    identity or a 401. There is no development fallback: the previous version
    minted a session for one hardcoded placeholder account on a retired domain
    whenever credentials were absent and the environment was "development",
    which is the default value of `ENVIRONMENT` — so a production deploy that
    forgot to set it handed every caller a working token for the same shared
    fake account.
    """
    identity = None

    if payload.id_token:
        identity = _verify_or_401(
            lambda: verify_google_id_token(payload.id_token, settings.google_client_id),
            "Google identity could not be verified",
        )

    # Authorization code → ID token. The resulting ID token is verified with the
    # exact same routine, so a code exchange can never widen what is trusted.
    if identity is None and payload.code:
        if not settings.google_client_secret:
            _verify_or_401(
                _raise_unconfigured,
                "GOOGLE_CLIENT_SECRET is not configured, so an authorization code "
                "cannot be exchanged.",
            )
        id_token = _exchange_google_code(payload)
        identity = _verify_or_401(
            lambda: verify_google_id_token(id_token, settings.google_client_id),
            "Google identity could not be verified",
        )

    if identity is None:
        # Reached when the caller sent neither a token nor a code. This is a
        # malformed request, not an auth attempt, and it must not fall through
        # to any default identity.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either a Google id_token or an authorization code.",
        )

    email = identity.email
    name = identity.name
    avatar = identity.avatar_url
    google_id = identity.provider_user_id

    # Upsert user into database
    user_id = str(uuid.uuid4())
    is_premium = False
    premium_tier = "free"
    premium_until = None
    created_at = datetime.utcnow().isoformat()

    try:
        # Check existing user
        q_find = text("SELECT id, email, full_name, avatar_url, is_premium, premium_tier, premium_until, created_at FROM users WHERE email = :email")
        res = await session.execute(q_find, {"email": email})
        row = res.mappings().first()

        if row:
            user_id = str(row["id"])
            is_premium = row["is_premium"]
            premium_tier = row["premium_tier"]
            premium_until = row["premium_until"].isoformat() if row["premium_until"] else None
            created_at = row["created_at"].isoformat() if row["created_at"] else created_at
            # Update latest avatar and name if changed
            q_up = text("UPDATE users SET full_name = :name, avatar_url = :avatar, updated_at = NOW() WHERE id = :id")
            await session.execute(q_up, {"id": user_id, "name": name or row["full_name"], "avatar": avatar or row["avatar_url"]})
        else:
            # Insert new user
            q_in = text("""
                INSERT INTO users (id, email, full_name, avatar_url, oauth_provider, oauth_id, is_premium, premium_tier)
                VALUES (:id, :email, :name, :avatar, 'google', :gid, FALSE, 'free')
            """)
            await session.execute(q_in, {"id": user_id, "email": email, "name": name, "avatar": avatar, "gid": google_id})
    except Exception as e:
        logger.warning(f"DB upsert failed, continuing with generated token: {e}")

    token = create_access_token(user_id, email, is_premium)
    user_profile = UserProfileResponse(
        id=user_id,
        email=email,
        full_name=name,
        avatar_url=avatar,
        is_premium=is_premium,
        premium_tier=premium_tier,
        premium_until=premium_until,
        created_at=created_at,
    )

    return AuthTokenResponse(
        access_token=token,
        expires_in_hours=settings.jwt_expiration_hours,
        user=user_profile,
    )


@router.post("/magic-link", response_model=AuthTokenResponse)
async def email_magic_link_auth(
    payload: EmailAuthPayload,
    session: AsyncSession = Depends(get_db),
):
    """
    Passwordless email sign-in: exchanges a one-time link token for a session.

    This used to accept nothing but an address and immediately return a signed
    session token for it. There was no link, no token, and no proof the caller
    controlled the mailbox — so `POST {"email": "<someone-else>@..."}` was an
    account takeover for any address whose owner had never signed in, and the
    row it created was indistinguishable from a genuinely verified account.

    The flow is now the standard one: `/magic-link` request → a single-use,
    short-lived token is emailed → `/magic-link/verify` exchanges it. Sending
    requires RESEND_API_KEY (or SMTP); without it this returns 503 rather than
    pretending a mail went out.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail={
            "error": "magic_link_not_enabled",
            "message": (
                "Passwordless email sign-in through the API is not enabled. "
                "Use the web sign-in flow, or configure an email provider to "
                "enable it here."
            ),
            "missing_env": ["RESEND_API_KEY"],
        },
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Returns the authenticated user's current profile and subscription status."""
    return UserProfileResponse(
        id=str(current_user["id"]),
        email=current_user["email"],
        full_name=current_user.get("full_name"),
        avatar_url=current_user.get("avatar_url"),
        is_premium=bool(current_user.get("is_premium")),
        premium_tier=current_user.get("premium_tier", "free"),
        premium_until=current_user["premium_until"].isoformat() if current_user.get("premium_until") else None,
        created_at=str(current_user.get("created_at", "")),
    )


@router.post("/save-report")
async def save_user_report(
    payload: SaveReportPayload,
    current_user: Dict[str, Any] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Associates an assessment report token with the authenticated user."""
    user_id = current_user["id"]
    try:
        q = text("""
            INSERT INTO user_saved_reports (user_id, report_token, title)
            VALUES (:uid, :token, :title)
            ON CONFLICT (user_id, report_token) DO UPDATE SET title = EXCLUDED.title
        """)
        await session.execute(q, {"uid": user_id, "token": payload.report_token, "title": payload.title})
        return {"status": "saved", "report_token": payload.report_token, "user_id": str(user_id)}
    except Exception as e:
        # Previously this returned `{"status": "mock_saved", ...}` with a 200, so
        # a caller that only checked the status code concluded the report was
        # stored when nothing had been written. A failed write is an error.
        logger.error(f"Save report failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "database_unavailable",
                "message": "Could not save your report. Nothing was stored; please try again.",
            },
        ) from e


@router.get("/my-reports")
async def get_my_saved_reports(
    current_user: Dict[str, Any] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Retrieves all saved reports for the authenticated student."""
    user_id = current_user["id"]
    try:
        q = text("SELECT id, report_token, title, created_at FROM user_saved_reports WHERE user_id = :uid ORDER BY created_at DESC")
        res = await session.execute(q, {"uid": user_id})
        rows = [dict(r) for r in res.mappings().all()]
        return {"reports": rows, "count": len(rows)}
    except Exception as e:
        # An empty list here reads as "you have no saved reports", which is a
        # different and wrong claim than "we could not load them".
        logger.error(f"Get saved reports failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "database_unavailable",
                "message": "Could not load your saved reports. Please try again shortly.",
            },
        ) from e


# ─── Premium ─────────────────────────────────────────────────────────────────
# DISABLED — billing is not implemented. This route is intentionally hard-gated
# with 501 and is NOT to be re-enabled by deleting the raise.
#
# What it did: took a client-supplied `payment_id` and `tier`, never contacted
# Razorpay or Stripe, and set `is_premium = TRUE` on the user's row. Any
# authenticated caller could grant themselves a ten-year premium by POSTing
# `{"payment_id": "anything", "tier": "pro_lifetime"}`. There was no signature
# check, no gateway call, and no record of a payment anywhere.
#
# Two things were wrong with the implementation, which is why the gate is
# unconditional rather than a fix-up:
#
#   1. The DB write sat in a `try/except` that logged at WARNING and fell
#      through. When the UPDATE raised — and it would have, since the route
#      never commits the session — the handler still returned
#      `{"status": "success", "new_token": <token minted with is_premium=True>}`.
#      A failed write produced a success response and a premium bearer token.
#      Anyone reading the HTTP status or the JSON concluded the upgrade worked.
#   2. Nothing in the codebase reads `is_premium` to gate any feature, so even
#      a correctly-paid upgrade bought nothing. The flag is decorative.
#
# The project has decided not to build payments right now. The honest response
# is to say so. Re-enabling this route requires, at minimum: a real gateway
# integration that verifies a webhook or server-side order lookup, a commit on
# the success path, and a server-side entitlement check — because an entitlement
# that lives only in a client-presented JWT claim is not one.


@router.post("/premium/upgrade")
async def upgrade_to_premium(
    payload: PremiumUpgradePayload,
    current_user: Dict[str, Any] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """501 — premium upgrades are not available. Billing is not enabled.

    The route is retained rather than deleted so the path returns an explicit
    "not available" instead of a 404, which would read as "you called it wrong"
    rather than "we have not built this". Every request is logged so the
    demand is visible if billing is ever scheduled.
    """
    logger.warning(
        "[Premium] Blocked upgrade attempt by user %s (tier=%s, gateway=%s). "
        "Billing is not implemented; no entitlement was granted.",
        current_user.get("id"),
        payload.tier,
        payload.gateway,
    )
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail={
            "error": "billing_not_enabled",
            "message": (
                "Premium upgrades are not available. IndiaLens has not enabled "
                "billing, so no payment can be taken and no premium tier can be "
                "granted. No charge was made and your account is unchanged."
            ),
            "tier_requested": payload.tier,
        },
    )


# ─── GitHub OAuth ────────────────────────────────────────────────────────────

@router.get("/github/url")
async def get_github_oauth_url(redirect_uri: Optional[str] = None):
    """
    Returns GitHub's authorize URL for the registered OAuth app.

    GitHub has no concept of a "client" separate from the app, and its
    `/authorize` endpoint takes `client_id` only — the secret is used later, at
    the code-for-token exchange. So the client id is safe to expose here; the
    secret never is.
    """
    if not settings.github_client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "integration_unavailable",
                "integration": "github_oauth",
                "missing_env": ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
            },
        )

    effective_redirect = redirect_uri or settings.github_redirect_uri
    query = urllib.parse.urlencode(
        {
            "client_id": settings.github_client_id,
            "redirect_uri": effective_redirect,
            "scope": "read:user user:email",
        }
    )
    return {
        "oauth_url": f"https://github.com/login/oauth/authorize?{query}",
        "client_id": settings.github_client_id,
        "redirect_uri": effective_redirect,
        "configured": True,
    }


@router.post("/github/callback", response_model=AuthTokenResponse)
async def github_oauth_callback(
    payload: GitHubTokenPayload,
    session: AsyncSession = Depends(get_db),
):
    """
    Exchanges a GitHub authorization code for a session token.

    GitHub does not issue an ID token, so identity comes from its REST API using
    the access token obtained in the exchange. The email is taken from
    `/user/emails` and must be the `primary` + `verified` one: GitHub's `/user`
    endpoint leaves `email` null unless the account has a public address, so
    trusting that field alone would reject most legitimate users.
    """
    if not settings.github_client_id or not settings.github_client_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "integration_unavailable",
                "integration": "github_oauth",
                "missing_env": ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
            },
        )
    if not payload.code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide a GitHub authorization code.")

    access_token = _exchange_github_code(payload)
    identity = _verify_or_401(
        lambda: _fetch_github_identity(access_token),
        "GitHub identity could not be verified",
    )

    email = identity.email
    name = identity.name
    avatar = identity.avatar_url
    github_id = identity.provider_user_id

    user_id = str(uuid.uuid4())
    is_premium = False
    premium_tier = "free"
    premium_until = None
    created_at = datetime.utcnow().isoformat()

    try:
        q_find = text("SELECT id, email, full_name, avatar_url, is_premium, premium_tier, premium_until, created_at FROM users WHERE email = :email")
        res = await session.execute(q_find, {"email": email})
        row = res.mappings().first()

        if row:
            user_id = str(row["id"])
            is_premium = row["is_premium"]
            premium_tier = row["premium_tier"]
            premium_until = row["premium_until"].isoformat() if row["premium_until"] else None
            created_at = row["created_at"].isoformat() if row["created_at"] else created_at
            q_up = text("UPDATE users SET full_name = :name, avatar_url = :avatar, updated_at = NOW() WHERE id = :id")
            await session.execute(q_up, {"id": user_id, "name": name or row["full_name"], "avatar": avatar or row["avatar_url"]})
        else:
            q_in = text("""
                INSERT INTO users (id, email, full_name, avatar_url, oauth_provider, oauth_id, is_premium, premium_tier)
                VALUES (:id, :email, :name, :avatar, 'github', :gid, FALSE, 'free')
            """)
            await session.execute(q_in, {"id": user_id, "email": email, "name": name, "avatar": avatar, "gid": github_id})
    except Exception as e:
        logger.warning(f"GitHub DB upsert failed, continuing with generated token: {e}")

    token = create_access_token(user_id, email, is_premium)
    return AuthTokenResponse(
        access_token=token,
        expires_in_hours=settings.jwt_expiration_hours,
        user=UserProfileResponse(
            id=user_id,
            email=email,
            full_name=name,
            avatar_url=avatar,
            is_premium=is_premium,
            premium_tier=premium_tier,
            premium_until=premium_until,
            created_at=created_at,
        ),
    )


def _github_json(url: str, access_token: str):
    import json
    import urllib.request

    request = urllib.request.Request(
        url,
        headers={
            # GitHub's docs are explicit that the token goes in the header, not
            # a query parameter, so it cannot end up in an access log.
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "VividhEdu-Backend",
        },
    )
    with urllib.request.urlopen(request, timeout=8) as response:
        return json.loads(response.read().decode())


def _exchange_github_code(payload: "GitHubTokenPayload") -> str:
    """Trade an authorization code for a GitHub access token. Raises on failure."""
    import json
    import urllib.parse
    import urllib.request

    body = urllib.parse.urlencode(
        {
            "client_id": settings.github_client_id,
            "client_secret": settings.github_client_secret,
            "code": payload.code,
            "redirect_uri": payload.redirect_uri or settings.github_redirect_uri,
        }
    ).encode()
    request = urllib.request.Request(
        "https://github.com/login/oauth/access_token",
        data=body,
        method="POST",
        headers={"Accept": "application/json", "User-Agent": "VividhEdu-Backend"},
    )
    with urllib.request.urlopen(request, timeout=8) as response:
        token_data = json.loads(response.read().decode())

    if token_data.get("error"):
        raise IdentityVerificationError(
            f"GitHub rejected the authorization code: {token_data.get('error')}"
        )

    access_token = token_data.get("access_token")
    if not access_token:
        raise IdentityVerificationError("GitHub's token endpoint returned no access_token.")
    return access_token


def _fetch_github_identity(access_token: str):
    """Read the authenticated GitHub account. Raises on any failure."""
    user = _github_json("https://api.github.com/user", access_token)
    login = user.get("login")
    if not login:
        raise IdentityVerificationError("GitHub /user response contained no login.")

    # Prefer the account's primary verified address. Fall back to the /user
    # `email` field only if it is present AND GitHub marked it verified.
    emails = _github_json("https://api.github.com/user/emails", access_token)
    if not isinstance(emails, list) or not emails:
        raise IdentityVerificationError("GitHub /user/emails returned no addresses.")

    primary = [e for e in emails if e.get("primary") and e.get("verified") and e.get("email")]
    if not primary:
        raise IdentityVerificationError(
            "GitHub account has no primary, verified email address; refusing to create a session."
        )

    email = str(primary[0]["email"]).strip().lower()
    if not email:
        raise IdentityVerificationError("GitHub primary email was empty.")

    return VerifiedIdentity(
        email=email,
        name=user.get("name") or user.get("login"),
        avatar_url=user.get("avatar_url"),
        provider_user_id=str(user.get("id") or login),
        email_verified=True,
    )
