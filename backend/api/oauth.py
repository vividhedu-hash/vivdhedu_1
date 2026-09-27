"""
OAuth identity verification for the browser-facing auth routes.

The previous Google sign-in implementation called Google's unauthenticated
``/tokeninfo`` endpoint and read the claims off the returned JSON. That endpoint
describes a token, it does not prove the token is authentic, and the caller
wrapped the whole thing in a bare ``except`` that logged a warning and then fell
through to a hardcoded demo identity. Two separate defects: no signature
verification, and a failure path that manufactured a session.

This module is the single place where an external identity token becomes a
trusted local one. Its contract is deliberately narrow:

  * the token's RS256 signature is checked against Google's published JWKS, and
  * ``aud`` equals the client id we registered, and
  * ``iss`` is one of Google's issuers, and
  * the email is provider-verified.

If any of those cannot be completed the result is an error. There is no
offline branch and no dev default here, deliberately: an unverifiable token
must never become a session.
"""

import json
import logging
import threading
import time
import urllib.request
from typing import Any, Dict, List, NamedTuple, Optional

logger = logging.getLogger(__name__)

# Google's OIDC issuer strings, as published in its discovery document. Pinned
# here rather than fetched so verification never depends on a document an
# attacker could influence.
GOOGLE_ISSUERS = frozenset({"accounts.google.com", "https://accounts.google.com"})

# Google's own certificate endpoints. The v3 endpoint is authoritative and the
# v1 endpoint is retained as a fallback; both serve the same key set.
GOOGLE_CERTS_URLS = (
    "https://www.googleapis.com/oauth2/v3/certs",
    "https://www.googleapis.com/oauth2/v1/certs",
)

# JWKS fetch timeout. A verification that cannot reach the keys must fail
# closed, but it must also fail promptly rather than hanging a login.
_CERTS_TIMEOUT_SECONDS = 5

# Google's signing keys rotate on the order of a day. A short cache keeps login
# fast without letting a retired key stay trusted for long.
_CERTS_CACHE_SECONDS = 3600


class VerifiedIdentity(NamedTuple):
    """A provider identity whose claims were cryptographically checked."""

    email: str
    name: Optional[str]
    avatar_url: Optional[str]
    provider_user_id: str
    email_verified: bool


class IdentityVerificationError(Exception):
    """Raised when an identity token cannot be trusted.

    Callers must surface this as a 401. It must never be caught and converted
    into a default or placeholder identity.
    """


# ─── Google JWKS transport ───────────────────────────────────────────────────

class _CachingCertsTransport:
    """A ``google.auth.transport.Request`` that caches Google's certs.

    google-auth requires a transport object with a ``__call__(url, method,
    body, headers, timeout)`` method. Implementing it here means verification
    works with the ``urllib`` standard library, so a Google sign-in does not
    require adding ``requests`` as a dependency of the auth path.
    """

    def __init__(self, timeout: int = _CERTS_TIMEOUT_SECONDS) -> None:
        self._timeout = timeout
        self._cache: Dict[str, str] = {}
        self._fetched_at: float = 0.0
        self._lock = threading.Lock()

    def _fetch(self, url: str) -> Dict[str, str]:
        request = urllib.request.Request(url, headers={"User-Agent": "VividhEdu-Backend"})
        with urllib.request.urlopen(request, timeout=self._timeout) as response:
            payload = json.loads(response.read().decode("utf-8"))

        # Google's endpoints return {"kid": "<PEM certificate>"}. A JWKS
        # document ({"keys": [...]}) is also accepted so the same transport
        # works if the endpoint is ever migrated.
        if isinstance(payload, dict) and isinstance(payload.get("keys"), list):
            return {key["kid"]: key for key in payload["keys"] if isinstance(key, dict) and "kid" in key}
        if not isinstance(payload, dict):
            raise IdentityVerificationError("Google certificate endpoint returned an unexpected document.")
        return {str(kid): cert for kid, cert in payload.items()}

    def _load(self) -> Dict[str, str]:
        now = time.monotonic()
        if self._cache and (now - self._fetched_at) < _CERTS_CACHE_SECONDS:
            return self._cache

        with self._lock:
            # Re-check: another thread may have refreshed while we waited.
            now = time.monotonic()
            if self._cache and (now - self._fetched_at) < _CERTS_CACHE_SECONDS:
                return self._cache

            errors: List[str] = []
            for url in GOOGLE_CERTS_URLS:
                try:
                    certs = self._fetch(url)
                except Exception as exc:  # noqa: BLE001 - collected and reported
                    errors.append(f"{url}: {type(exc).__name__}")
                    continue
                if certs:
                    self._cache = certs
                    self._fetched_at = time.monotonic()
                    return certs
                errors.append(f"{url}: empty certificate set")

            raise IdentityVerificationError(
                "Google signing certificates could not be retrieved, so the ID token "
                f"signature cannot be verified. Attempts: {', '.join(errors)}"
            )

    def __call__(self, url: str, method: str = "GET", body: Any = None,
                 headers: Any = None, timeout: Any = None, **kwargs: Any) -> Any:
        return _TransportResponse(self._load())

    def clear_cache(self) -> None:
        with self._lock:
            self._cache = {}
            self._fetched_at = 0.0


class _TransportResponse:
    """Minimal response object matching what google-auth reads off a transport."""

    def __init__(self, certs: Dict[str, str]) -> None:
        self._body = json.dumps(certs).encode("utf-8")

    @property
    def data(self) -> bytes:
        return self._body

    @property
    def status(self) -> int:
        return 200

    def json(self) -> Dict[str, str]:
        return json.loads(self._body.decode("utf-8"))

    @property
    def headers(self) -> Dict[str, str]:
        return {"content-type": "application/json"}


# Module-level transport so the cert cache is shared across requests.
_GOOGLE_TRANSPORT = _CachingCertsTransport()


# ─── Google ID token verification ────────────────────────────────────────────

def _decode_google_id_token(id_token: str, client_id: str) -> Dict[str, Any]:
    """
    Verify a Google ID token's signature and registered claims.

    Uses google-auth, which validates the RS256 signature against Google's
    certificates and checks ``exp``, ``iat`` and ``aud``. ``iss`` is checked
    below because that is policy rather than signature.
    """
    from google.oauth2 import id_token as google_id_token

    try:
        return dict(google_id_token.verify_oauth2_token(id_token, _GOOGLE_TRANSPORT, client_id))
    except IdentityVerificationError:
        raise
    except Exception as exc:  # noqa: BLE001 - normalized into one error type
        raise IdentityVerificationError(
            f"Google ID token failed verification: {type(exc).__name__}: {exc}"
        ) from exc


def verify_google_id_token(id_token: Optional[str], client_id: str) -> VerifiedIdentity:
    """
    Verify a Google ID token and return the identity it attests to.

    ``client_id`` is the expected ``aud`` and is required. Without a registered
    client there is nothing to bind the token to, and a token minted for any
    other application would otherwise be replayable against us.
    """
    if not id_token:
        raise IdentityVerificationError("No Google ID token was supplied.")
    if not client_id:
        raise IdentityVerificationError(
            "GOOGLE_CLIENT_ID is not configured, so a Google ID token cannot be bound "
            "to this application and must not be accepted."
        )

    claims = _decode_google_id_token(id_token, client_id)

    assert_google_claims(
        issuer=claims.get("iss"),
        audience=claims.get("aud"),
        client_id=client_id,
        email_verified=claims.get("email_verified"),
    )

    email = (claims.get("email") or "").strip().lower()
    subject = str(claims.get("sub") or "").strip()
    if not email or not subject:
        raise IdentityVerificationError("Verified Google token is missing a usable email or subject claim.")

    return VerifiedIdentity(
        email=email,
        name=claims.get("name") or None,
        avatar_url=claims.get("picture") or None,
        provider_user_id=subject,
        email_verified=True,
    )


def assert_google_claims(
    *,
    issuer: Optional[str],
    audience: Any,
    client_id: str,
    email_verified: Any,
) -> None:
    """
    The claim policy applied to a Google token, split out so it is testable
    without standing up a JWKS or an HTTP stub.
    """
    if audience != client_id:
        raise IdentityVerificationError("ID token audience does not match the configured client id.")
    if issuer not in GOOGLE_ISSUERS:
        raise IdentityVerificationError(f"Untrusted Google token issuer: {issuer!r}")
    # google-auth returns this claim as a string for some issuers and a bool
    # for others; only a positive assertion counts. A missing claim fails.
    if email_verified not in (True, "true", "True", "1", 1):
        raise IdentityVerificationError("Google account email is not marked verified; refusing to create a session.")


__all__ = [
    "GOOGLE_CERTS_URLS",
    "GOOGLE_ISSUERS",
    "IdentityVerificationError",
    "VerifiedIdentity",
    "assert_google_claims",
    "verify_google_id_token",
]
