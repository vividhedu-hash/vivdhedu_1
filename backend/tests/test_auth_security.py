"""
Authentication security tests.

There were no auth tests in this repo before, which is the direct reason the
defects below shipped. They are written against real signed JWTs rather than
against a stand-in for the verifier, because the thing that was broken was the
verifier itself: the previous implementation asked Google's unauthenticated
`/tokeninfo` endpoint what a token contained and believed the answer. A mock of
that would have passed while the real path stayed broken.

The signature tests here are hermetic — a locally generated RSA key stands in
for Google's, and the JWKS is injected — so they run in CI with no network and
no credential.
"""

import base64
import datetime as dt
import json
from pathlib import Path

import pytest

from api.oauth import (
    GOOGLE_ISSUERS,
    IdentityVerificationError,
    assert_google_claims,
    verify_google_id_token,
)

REPO_BACKEND = Path(__file__).resolve().parent.parent
REPO_ROOT = REPO_BACKEND.parent
AUTH_ROUTER = REPO_BACKEND / "api" / "routers" / "auth.py"
AUTH_CONTEXT = REPO_ROOT / "indialens" / "src" / "lib" / "auth-context.tsx"
AUTH_MODAL = REPO_ROOT / "indialens" / "src" / "components" / "AuthModal.tsx"

CLIENT_ID = "test-client-id.apps.googleusercontent.com"


# ─── Helpers: real RS256 tokens, signed by a locally generated key ──────────

def _b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _rsa_key():
    """Generate a throwaway RSA key. `cryptography` ships with google-auth."""
    from cryptography.hazmat.primitives.asymmetric import rsa

    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


def _sign(token: str, key) -> bytes:
    """Produce a compact JWS with RS256 over `token`."""
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import padding

    header = _b64url(json.dumps({"alg": "RS256", "typ": "JWT", "kid": TEST_KID}).encode())
    signing_input = f"{header}.{token}".encode()
    signature = key.sign(signing_input, padding.PKCS1v15(), hashes.SHA256())
    return f"{header}.{token}.{_b64url(signature)}".encode()


TEST_KID = "test-key-1"
_TEST_KEY = None
_TEST_CERTS = {}


def _test_key():
    """The single RSA key this module signs with. Generated once, reused."""
    global _TEST_KEY
    if _TEST_KEY is None:
        _TEST_KEY = _rsa_key()
    return _TEST_KEY


def _certs_for(kid: str) -> dict:
    """PEM public certificate for the test key, in Google's JWKS shape."""
    from cryptography import x509
    from cryptography.hazmat.primitives import hashes, serialization

    key = _test_key()
    name = x509.Name([x509.NameAttribute(x509.OID_COMMON_NAME, kid)])
    now = dt.datetime.now(dt.timezone.utc)
    cert = (
        x509.CertificateBuilder()
        .subject_name(name)
        .issuer_name(name)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - dt.timedelta(minutes=5))
        .not_valid_after(now + dt.timedelta(days=1))
        .sign(key, hashes.SHA256())
    )
    return {kid: cert.public_bytes(serialization.Encoding.PEM).decode("ascii")}


def _google_token(claims: dict, key=None) -> str:
    """Build a signed RS256 JWT with the given claims."""
    key = key or _test_key()
    now = int(dt.datetime.now(dt.timezone.utc).timestamp())
    header_payload = {
        "iss": "https://accounts.google.com",
        "aud": CLIENT_ID,
        "exp": now + 3600,
        "iat": now,
        "sub": "google-user-123",
        "email": "student@example.com",
        "email_verified": True,
        "name": "Test Student",
        "picture": "https://example.com/a.png",
    }
    header_payload.update(claims)
    return _sign(_b64url(json.dumps(header_payload).encode()), key).decode()


@pytest.fixture
def stub_jwks(monkeypatch):
    """Point the module-level cert transport at the generated test key."""
    from api import oauth

    certs = _certs_for(TEST_KID)
    monkeypatch.setattr(oauth._GOOGLE_TRANSPORT, "_fetch", lambda url: certs)
    # Bypass the cache so each test sees the key it generated.
    monkeypatch.setattr(oauth._GOOGLE_TRANSPORT, "_cache", certs)
    monkeypatch.setattr(oauth._GOOGLE_TRANSPORT, "_fetched_at", 1e18)
    return certs


# ─── 1. Signature verification ──────────────────────────────────────────────

class TestGoogleSignatureVerification:
    def test_valid_signed_token_is_accepted(self, stub_jwks):
        identity = verify_google_id_token(_google_token({}), CLIENT_ID)
        assert identity.email == "student@example.com"
        assert identity.email_verified is True
        assert identity.provider_user_id == "google-user-123"

    def test_token_signed_by_another_key_is_rejected(self, stub_jwks):
        """A structurally valid token with a signature we cannot verify is the
        exact shape an attacker would send. It must not become a session."""
        attacker_key = _rsa_key()
        forged = _google_token({"email": "attacker@evil.example"}, key=attacker_key)

        with pytest.raises(IdentityVerificationError):
            verify_google_id_token(forged, CLIENT_ID)

    def test_unsigned_alg_none_token_is_rejected(self, stub_jwks):
        """The classic `alg: none` downgrade. The verifier pins RS256."""
        header = _b64url(json.dumps({"alg": "none", "typ": "JWT"}).encode())
        payload = _b64url(
            json.dumps(
                {
                    "iss": "https://accounts.google.com",
                    "aud": CLIENT_ID,
                    "exp": int((dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=1)).timestamp()),
                    "sub": "attacker",
                    "email": "attacker@evil.example",
                    "email_verified": True,
                }
            ).encode()
        )
        with pytest.raises(IdentityVerificationError):
            verify_google_id_token(f"{header}.{payload}.", CLIENT_ID)

    def test_expired_token_is_rejected(self, stub_jwks):
        expired = _google_token(
            {"exp": int((dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=1)).timestamp())}
        )
        with pytest.raises(IdentityVerificationError):
            verify_google_id_token(expired, CLIENT_ID)

    def test_missing_token_is_rejected(self, stub_jwks):
        with pytest.raises(IdentityVerificationError):
            verify_google_id_token(None, CLIENT_ID)

    def test_unconfigured_client_id_is_rejected(self, stub_jwks):
        """With no registered client there is nothing to bind `aud` to, so a
        token minted for another app would otherwise be replayable here."""
        with pytest.raises(IdentityVerificationError):
            verify_google_id_token(_google_token({}), "")

    def test_unreachable_jwks_fails_closed(self, monkeypatch):
        """Verification that cannot fetch keys must error, never succeed."""
        from api import oauth

        def _boom(url):
            raise OSError("network down")

        monkeypatch.setattr(oauth._GOOGLE_TRANSPORT, "_fetch", _boom)
        monkeypatch.setattr(oauth._GOOGLE_TRANSPORT, "_cache", {})
        monkeypatch.setattr(oauth._GOOGLE_TRANSPORT, "_fetched_at", 0.0)

        with pytest.raises(IdentityVerificationError):
            verify_google_id_token(_google_token({}), CLIENT_ID)


# ─── 2. Claim policy ────────────────────────────────────────────────────────

class TestGoogleClaimPolicy:
    def test_wrong_audience_rejected(self):
        with pytest.raises(IdentityVerificationError, match="audience"):
            assert_google_claims(
                issuer="https://accounts.google.com",
                audience="attacker-app.apps.googleusercontent.com",
                client_id=CLIENT_ID,
                email_verified=True,
            )

    def test_foreign_issuer_rejected(self):
        with pytest.raises(IdentityVerificationError, match="issuer"):
            assert_google_claims(
                issuer="https://evil.example",
                audience=CLIENT_ID,
                client_id=CLIENT_ID,
                email_verified=True,
            )

    @pytest.mark.parametrize("issuer", sorted(GOOGLE_ISSUERS))
    def test_both_google_issuers_accepted(self, issuer):
        assert_google_claims(
            issuer=issuer, audience=CLIENT_ID, client_id=CLIENT_ID, email_verified=True
        )

    @pytest.mark.parametrize("value", [False, None, "false", "0", ""])
    def test_unverified_email_rejected(self, value):
        with pytest.raises(IdentityVerificationError, match="not marked verified"):
            assert_google_claims(
                issuer="https://accounts.google.com",
                audience=CLIENT_ID,
                client_id=CLIENT_ID,
                email_verified=value,
            )

    def test_missing_email_verified_claim_rejected(self):
        with pytest.raises(IdentityVerificationError):
            assert_google_claims(
                issuer="https://accounts.google.com",
                audience=CLIENT_ID,
                client_id=CLIENT_ID,
                email_verified=None,
            )


# ─── 3. Fail-closed endpoints ───────────────────────────────────────────────

class TestEndpointsFailClosed:
    def test_premium_upgrade_fails_closed(self):
        """The endpoint must not grant entitlement for a client-supplied
        `payment_id`, and must not return a premium-minted token."""
        from fastapi.testclient import TestClient

        from api.main import app

        client = TestClient(app)
        response = client.post(
            "/api/v1/auth/premium/upgrade",
            json={"payment_id": "anything", "tier": "pro_lifetime"},
        )
        # 401 when unauthenticated, 501 when authenticated but billing is off.
        # Either way: never a 2xx, and never an entitlement.
        assert response.status_code in (401, 501), response.text
        if response.status_code == 501:
            body = response.json()["detail"]
            assert body["error"] == "billing_not_enabled"
            assert "new_token" not in response.json()
            assert response.json().get("is_premium") is None

    def test_magic_link_does_not_issue_a_session(self):
        """Accepting a bare address with no proof of mailbox control was an
        account-takeover primitive. It must not return a token."""
        from fastapi.testclient import TestClient

        from api.main import app

        client = TestClient(app)
        response = client.post(
            "/api/v1/auth/magic-link", json={"email": "victim@example.com"}
        )
        assert response.status_code in (400, 501, 503), response.text
        assert "access_token" not in response.json()

    def test_google_callback_rejects_an_unsigned_token(self):
        """End-to-end: a forged Google ID token must not produce a session."""
        from fastapi.testclient import TestClient

        from api.main import app

        client = TestClient(app)
        header = _b64url(json.dumps({"alg": "none", "typ": "JWT"}).encode())
        payload = _b64url(
            json.dumps(
                {
                    "iss": "https://accounts.google.com",
                    "aud": CLIENT_ID,
                    "exp": int((dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=1)).timestamp()),
                    "sub": "attacker",
                    "email": "attacker@evil.example",
                    "email_verified": True,
                }
            ).encode()
        )
        response = client.post(
            "/api/v1/auth/google/callback", json={"id_token": f"{header}.{payload}."}
        )
        assert response.status_code in (400, 401), response.text
        assert "access_token" not in response.json()

    def test_google_callback_without_credentials_or_token_rejected(self):
        from fastapi.testclient import TestClient

        from api.main import app

        client = TestClient(app)
        response = client.post("/api/v1/auth/google/callback", json={})
        assert response.status_code in (400, 401), response.text
        assert "access_token" not in response.json()

    def test_github_routes_fail_closed_without_credentials(self):
        """The UI advertises GitHub, so the backend must either work or say it
        is not configured — never invent a session."""
        from fastapi.testclient import TestClient

        from api.config import settings
        from api.main import app

        if settings.github_client_id and settings.github_client_secret:
            pytest.skip("GitHub OAuth is configured in this environment")

        client = TestClient(app)
        url_response = client.get("/api/v1/auth/github/url")
        assert url_response.status_code == 503
        assert url_response.json()["detail"]["error"] == "integration_unavailable"

        callback = client.post("/api/v1/auth/github/callback", json={"code": "x"})
        assert callback.status_code == 503
        assert "access_token" not in callback.json()

    def test_auth_me_requires_a_token(self):
        from fastapi.testclient import TestClient

        from api.main import app

        client = TestClient(app)
        assert client.get("/api/v1/auth/me").status_code == 401
        assert client.get("/api/v1/auth/me", headers={"Authorization": "Bearer nonsense"}).status_code == 401


# ─── 4. No fabrication path remains in source ───────────────────────────────

def _executable_lines(path: Path):
    """
    Yield the lines of a source file with comments and docstrings removed.

    The fixes in this pass *document* the identifiers they removed — the string
    `fallbackDevLogin` appears in a comment explaining that it is gone, and
    `demo.student@theproject.edu.in` appears in a docstring explaining why the
    development fallback was deleted. Grepping raw text would therefore fail on
    a correct implementation, so the scan looks at what the code does rather
    than at what it says about itself.
    """
    source = path.read_text()

    if path.suffix == ".py":
        import ast
        import io
        import tokenize

        # Docstring lines come from the AST: a module/class/function docstring
        # is the first statement's string literal. Doing it structurally is
        # exact, where a token-walk would have to guess at statement boundaries.
        skip: set[int] = set()
        try:
            tree = ast.parse(source)
        except SyntaxError:  # pragma: no cover - the file must import to be tested
            return
        for node in ast.walk(tree):
            if not isinstance(node, (ast.Module, ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            body = getattr(node, "body", [])
            if not body:
                continue
            first = body[0]
            if isinstance(first, ast.Expr) and isinstance(first.value, ast.Constant) and isinstance(first.value.value, str):
                skip.update(range(first.lineno, (first.end_lineno or first.lineno) + 1))

        # Comments come from the tokenizer.
        try:
            for tok in tokenize.generate_tokens(io.StringIO(source).readline):
                if tok.type == tokenize.COMMENT:
                    skip.add(tok.start[0])
        except tokenize.TokenError:  # pragma: no cover - malformed file
            pass

        for number, line in enumerate(source.splitlines(), start=1):
            if number not in skip:
                yield line
        return

    # TypeScript / TSX: strip block and line comments.
    import re

    without_block = re.sub(r"/\*.*?\*/", "", source, flags=re.DOTALL)
    for line in without_block.splitlines():
        cleaned = re.sub(r"//.*$", "", line)
        if cleaned.strip():
            yield cleaned


class TestNoFabricationInSource:
    """The original defect was a dev fallback that minted a session on error.
    Assert the identifiers are gone from executable code, not just from
    behaviour — a regression that reintroduces them should fail here even if the
    route happens not to be covered."""

    @pytest.mark.parametrize(
        "needle",
        ["fallbackDevLogin", "jwt_tok_demo", "theproject.edu.in", "Demo User", "mock_saved"],
    )
    def test_forbidden_identifier_absent(self, needle):
        for path in (AUTH_ROUTER, AUTH_CONTEXT, AUTH_MODAL):
            if not path.exists():
                continue
            hits = [line for line in _executable_lines(path) if needle in line]
            assert not hits, f"{needle!r} still present in {path}: {hits[:2]}"

    def test_frontend_does_not_read_premium_from_user_metadata(self):
        """`user_metadata` is writable by the account holder, so a PRO badge
        read from it is self-assigned."""
        hits = [
            line for line in _executable_lines(AUTH_CONTEXT) if "is_premium" in line
        ]
        assert not hits, f"premium read from client metadata: {hits[:2]}"

    def test_premium_endpoint_does_not_write_entitlement(self):
        body = AUTH_ROUTER.read_text().split('@router.post("/premium/upgrade")')[-1]
        assert "is_premium = TRUE" not in body
        # No `UPDATE users ... SET is_premium` anywhere in the handler.
        assert "SET is_premium" not in body

    def test_google_router_no_longer_uses_tokeninfo(self):
        """`/tokeninfo` describes a token without proving it is authentic."""
        hits = [line for line in _executable_lines(AUTH_ROUTER) if "tokeninfo" in line]
        assert not hits, f"tokeninfo still used: {hits[:2]}"
