"""Hermetic tests for Supabase access-token verification."""

import datetime as dt
import uuid

import jwt
import pytest

from api.oauth import IdentityVerificationError
from api.supabase_jwt import (
    decode_session_token,
    looks_like_supabase_token,
    supabase_issuer,
    verify_supabase_access_token,
)

SUPABASE_URL = "https://example.supabase.co"
SECRET = "supabase-test-secret-32-chars-min-xx"
AUDIENCE = "authenticated"
LEGACY_SECRET = "backend-hs256-secret-32-chars-min"


def _token(claims: dict, secret: str = SECRET, headers: dict | None = None) -> str:
    now = int(dt.datetime.now(dt.timezone.utc).timestamp())
    payload = {
        "iss": supabase_issuer(SUPABASE_URL),
        "aud": AUDIENCE,
        "role": "authenticated",
        "exp": now + 3600,
        "iat": now,
        "sub": str(uuid.uuid4()),
        "email": "student@example.com",
    }
    payload.update(claims)
    return jwt.encode(payload, secret, algorithm="HS256", headers=headers or {"alg": "HS256"})


def test_happy_path_hs256():
    sub = str(uuid.uuid4())
    token = _token({"sub": sub})
    payload = verify_supabase_access_token(
        token,
        supabase_url=SUPABASE_URL,
        jwt_secret=SECRET,
        audience=AUDIENCE,
    )
    assert payload["sub"] == sub
    assert payload["email"] == "student@example.com"


def test_wrong_secret_rejected():
    token = _token({})
    with pytest.raises(IdentityVerificationError):
        verify_supabase_access_token(
            token,
            supabase_url=SUPABASE_URL,
            jwt_secret="other-secret-32-characters-long",
            audience=AUDIENCE,
        )


def test_expired_rejected():
    token = _token({"exp": 1, "iat": 1})
    with pytest.raises(IdentityVerificationError):
        verify_supabase_access_token(
            token,
            supabase_url=SUPABASE_URL,
            jwt_secret=SECRET,
            audience=AUDIENCE,
        )


def test_wrong_audience_rejected():
    token = _token({"aud": "anon"})
    with pytest.raises(IdentityVerificationError):
        verify_supabase_access_token(
            token,
            supabase_url=SUPABASE_URL,
            jwt_secret=SECRET,
            audience=AUDIENCE,
        )


def test_wrong_issuer_rejected():
    token = _token({"iss": "https://evil.example/auth/v1"})
    with pytest.raises(IdentityVerificationError):
        verify_supabase_access_token(
            token,
            supabase_url=SUPABASE_URL,
            jwt_secret=SECRET,
            audience=AUDIENCE,
        )


def test_unconfigured_fails_closed():
    token = _token({})
    with pytest.raises(IdentityVerificationError, match="not configured"):
        verify_supabase_access_token(token, supabase_url="", jwt_secret="")


def test_decode_session_routes_supabase_vs_legacy():
    sub = str(uuid.uuid4())
    supabase_tok = _token({"sub": sub})
    payload, kind = decode_session_token(
        supabase_tok,
        jwt_secret=LEGACY_SECRET,
        jwt_algorithm="HS256",
        supabase_url=SUPABASE_URL,
        supabase_jwt_secret=SECRET,
        supabase_audience=AUDIENCE,
    )
    assert kind == "supabase"
    assert payload["sub"] == sub

    now = int(dt.datetime.now(dt.timezone.utc).timestamp())
    legacy = jwt.encode(
        {"sub": str(uuid.uuid4()), "email": "bot@example.com", "exp": now + 3600, "iss": "The Project Auth Service"},
        LEGACY_SECRET,
        algorithm="HS256",
    )
    payload, kind = decode_session_token(
        legacy,
        jwt_secret=LEGACY_SECRET,
        jwt_algorithm="HS256",
        supabase_url=SUPABASE_URL,
        supabase_jwt_secret=SECRET,
        supabase_audience=AUDIENCE,
    )
    assert kind == "legacy"


def test_looks_like_supabase_token():
    assert looks_like_supabase_token(
        {"iss": supabase_issuer(SUPABASE_URL)}, SUPABASE_URL
    )
    assert not looks_like_supabase_token({"iss": "The Project Auth Service"}, SUPABASE_URL)
