"""
Verify a Supabase Auth access token.

The browser signs in through Supabase and holds an access JWT whose ``sub`` is
``auth.uid()``. FastAPI used to mint a second HS256 token with a different
``users.id``, so a signed-in student was anonymous to every student-state
route. This module is the single verifier for the token the browser already
has.

Verification order, after looking at the unverified ``iss`` claim (routing
only — never acceptance):

1. Issuer looks like ``{SUPABASE_URL}/auth/v1`` → RS256/ES256 against the
   project's JWKS, or HS256 against ``SUPABASE_JWT_SECRET`` (legacy projects).
2. Otherwise → the backend's own HS256 secret (machine / leftover tokens).

A token that cannot be verified is an error. There is no offline bypass.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, Optional, Tuple
from urllib.parse import urljoin

import jwt
from jwt import PyJWKClient

from .oauth import IdentityVerificationError

logger = logging.getLogger(__name__)

SessionKind = str  # "supabase" | "legacy"


def _unverified_claims(token: str) -> Dict[str, Any]:
    return jwt.decode(token, options={"verify_signature": False, "verify_exp": False})


def supabase_issuer(supabase_url: str) -> str:
    return supabase_url.rstrip("/") + "/auth/v1"


def looks_like_supabase_token(claims: Dict[str, Any], supabase_url: str) -> bool:
    iss = str(claims.get("iss") or "").rstrip("/")
    if not iss:
        return False
    if supabase_url:
        return iss == supabase_issuer(supabase_url).rstrip("/")
    return iss.endswith("/auth/v1")


def verify_supabase_access_token(
    token: str,
    *,
    supabase_url: str,
    jwt_secret: str = "",
    audience: str = "authenticated",
    jwks_client: Optional[PyJWKClient] = None,
) -> Dict[str, Any]:
    """Cryptographically verify a Supabase access token. Raises on failure."""
    if not token:
        raise IdentityVerificationError("No access token was supplied.")
    if not supabase_url and not jwt_secret:
        raise IdentityVerificationError(
            "SUPABASE_URL / SUPABASE_JWT_SECRET are not configured, so a "
            "Supabase access token cannot be bound to this application."
        )

    algorithms_hmac = ["HS256"]
    algorithms_asymmetric = ["RS256", "ES256"]
    options = {"require": ["exp", "sub"]}
    decode_kw: Dict[str, Any] = {
        "audience": audience or "authenticated",
        "options": options,
    }
    if supabase_url:
        decode_kw["issuer"] = supabase_issuer(supabase_url)

    last_error: Optional[Exception] = None

    if jwt_secret:
        try:
            return jwt.decode(token, jwt_secret, algorithms=algorithms_hmac, **decode_kw)
        except jwt.PyJWTError as exc:
            last_error = exc

    if supabase_url:
        try:
            client = jwks_client or PyJWKClient(
                urljoin(supabase_url.rstrip("/") + "/", "auth/v1/.well-known/jwks.json"),
                cache_keys=True,
            )
            signing_key = client.get_signing_key_from_jwt(token)
            return jwt.decode(
                token,
                signing_key.key,
                algorithms=algorithms_asymmetric,
                **decode_kw,
            )
        except jwt.PyJWTError as exc:
            last_error = exc
        except Exception as exc:  # noqa: BLE001 - JWKS fetch / parse
            raise IdentityVerificationError(
                f"Supabase JWKS could not be used: {type(exc).__name__}: {exc}"
            ) from exc

    raise IdentityVerificationError(
        f"Supabase access token failed verification: {last_error or 'unknown'}"
    )


def decode_session_token(
    token: str,
    *,
    jwt_secret: str,
    jwt_algorithm: str,
    supabase_url: str = "",
    supabase_jwt_secret: str = "",
    supabase_audience: str = "authenticated",
    jwks_client: Optional[PyJWKClient] = None,
) -> Tuple[Dict[str, Any], SessionKind]:
    """
    Return ``(payload, kind)`` for a Bearer token.

    ``kind`` is ``supabase`` when the token was verified as a Supabase Auth
    JWT, else ``legacy`` for a backend-minted HS256 token.
    """
    try:
        claims = _unverified_claims(token)
    except jwt.PyJWTError as exc:
        raise IdentityVerificationError(f"Malformed token: {exc}") from exc

    if looks_like_supabase_token(claims, supabase_url) or (
        supabase_url and claims.get("role") in {"authenticated", "anon"}
    ):
        payload = verify_supabase_access_token(
            token,
            supabase_url=supabase_url,
            jwt_secret=supabase_jwt_secret,
            audience=supabase_audience,
            jwks_client=jwks_client,
        )
        return payload, "supabase"

    try:
        payload = jwt.decode(token, jwt_secret, algorithms=[jwt_algorithm])
        return payload, "legacy"
    except jwt.ExpiredSignatureError as exc:
        raise IdentityVerificationError("Token has expired") from exc
    except jwt.PyJWTError as exc:
        # Last chance: a Supabase token whose iss we did not recognise.
        if supabase_url or supabase_jwt_secret:
            payload = verify_supabase_access_token(
                token,
                supabase_url=supabase_url,
                jwt_secret=supabase_jwt_secret,
                audience=supabase_audience,
                jwks_client=jwks_client,
            )
            return payload, "supabase"
        raise IdentityVerificationError(f"Invalid authentication token: {exc}") from exc
