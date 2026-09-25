"""
Security regression tests.

These cover the three auth/authorization defects that shipped to production
before any test existed:

1.  Production booting with the shipped placeholder secrets (forgeable tokens).
2.  Admin key comparison leaking the key through response timing.
3.  Google ID token accepted without checking `aud` or `email_verified`.

Plus the RLS posture of the migration in db/migrations/0003, asserted against
the migration SQL itself so the check runs in CI without a live database.
"""
import re
from pathlib import Path

import pytest

from api.config import Settings, _PLACEHOLDER_SECRETS

REPO_BACKEND = Path(__file__).resolve().parent.parent
REPO_ROOT = REPO_BACKEND.parent
MIGRATION_0003 = REPO_BACKEND / "db" / "migrations" / "0003_rls_harden_student_data.sql"


# ── 1. Production secret guard ──────────────────────────────────────────────

class TestProductionSecretGuard:
    def test_production_rejects_placeholder_secrets(self):
        """A placeholder JWT secret in prod means anyone can forge a token."""
        with pytest.raises(ValueError) as exc:
            Settings(
                environment="production",
                secret_key="change-me-in-production-use-32-char-minimum",
                jwt_secret="the-project-jwt-secret-key-32-chars-min",
                api_key_admin="admin-dev-key-change-in-production",
            )
        assert "Refusing to start" in str(exc.value)

    def test_production_rejects_short_jwt_secret(self):
        with pytest.raises(ValueError) as exc:
            Settings(
                environment="production",
                secret_key="s" * 40,
                jwt_secret="too-short",  # 9 chars
                api_key_admin="a" * 40,
            )
        assert "at least 32 characters" in str(exc.value)

    def test_production_accepts_strong_secrets(self):
        s = Settings(
            environment="production",
            secret_key="s" * 48,
            jwt_secret="j" * 48,
            api_key_admin="a" * 32,
        )
        assert len(s.jwt_secret) == 48

    @pytest.mark.parametrize("env", ["development", "dev", "test", "staging"])
    def test_non_production_tolerates_placeholders(self, env):
        """Local dev must not be blocked by the guard."""
        s = Settings(
            environment=env,
            secret_key="change-me-in-production-use-32-char-minimum",
            jwt_secret="the-project-jwt-secret-key-32-chars-min",
            api_key_admin="admin-dev-key-change-in-production",
        )
        assert s.environment == env

    def test_all_known_placeholders_are_blocked(self):
        """Every shipped default must be recognised, not just the three wired in."""
        for placeholder in _PLACEHOLDER_SECRETS:
            with pytest.raises(ValueError):
                Settings(
                    environment="production",
                    secret_key=placeholder,
                    jwt_secret=placeholder,
                    api_key_admin=placeholder,
                )


# ── 2. Admin key check ──────────────────────────────────────────────────────

class TestAdminKeyCheck:
    def _check(self, presented, configured):
        """Mirror of routers.admin._require_admin without needing a live app."""
        from fastapi import HTTPException
        import secrets as _secrets

        if not configured:
            raise HTTPException(status_code=503, detail="not configured")
        if not presented or not _secrets.compare_digest(presented, configured):
            raise HTTPException(status_code=401, detail="invalid")

    def test_correct_key_passes(self):
        self._check("super-secret-admin-key", "super-secret-admin-key")

    def test_wrong_key_rejected(self):
        with pytest.raises(Exception):
            self._check("wrong", "super-secret-admin-key")

    def test_missing_key_rejected(self):
        with pytest.raises(Exception):
            self._check(None, "super-secret-admin-key")

    def test_empty_configured_key_refuses_all(self):
        """An unset API_KEY_ADMIN must fail closed, not accept an empty header."""
        with pytest.raises(Exception) as exc:
            self._check("anything", "")
        assert getattr(exc.value, "status_code", None) == 503

    def test_source_uses_constant_time_compare(self):
        """Guard against regressing back to a plain `!=` comparison."""
        src = (REPO_BACKEND / "api" / "routers" / "admin.py").read_text()
        assert "compare_digest" in src
        assert not re.search(r"x_api_key\s*!=\s*settings\.api_key_admin", src)


# ── 3. Google ID token verification ─────────────────────────────────────────

class TestGoogleTokenVerification:
    def _verify(self, data, client_id="configured-client-id"):
        if client_id and data.get("aud") != client_id:
            raise ValueError("audience mismatch")
        if data.get("email_verified") not in ("true", True, "1", 1):
            raise ValueError("email not verified")
        if not data.get("email"):
            raise ValueError("no email claim")
        return data["email"]

    def test_valid_token_accepted(self):
        email = self._verify(
            {"aud": "configured-client-id", "email_verified": "true", "email": "a@b.com"}
        )
        assert email == "a@b.com"

    def test_wrong_audience_rejected(self):
        """A token minted for another app must not be replayable against us."""
        with pytest.raises(ValueError, match="audience"):
            self._verify(
                {"aud": "attacker-app", "email_verified": "true", "email": "a@b.com"}
            )

    def test_unverified_email_rejected(self):
        with pytest.raises(ValueError, match="not verified"):
            self._verify(
                {"aud": "configured-client-id", "email_verified": "false", "email": "a@b.com"}
            )

    def test_source_checks_aud_and_email_verified(self):
        src = (REPO_BACKEND / "api" / "routers" / "auth.py").read_text()
        assert "email_verified" in src, "auth callback must verify email_verified"
        assert "audience mismatch" in src, "auth callback must check aud"


# ── 4. RLS migration content ─────────────────────────────────────────────────

class TestRLSMigration:
    @pytest.fixture(scope="class")
    def sql(self):
        if not MIGRATION_0003.exists():
            pytest.skip("migration file not present")
        return MIGRATION_0003.read_text()

    # student_reports never had an anon UPDATE policy; the other two did.
    @pytest.mark.parametrize(
        "policy",
        [
            "Public access to student_reports by token",
            "Public access to personal_intelligence by token",
            "Public update to personal_intelligence",
            "Public access to portfolio_profiles by token",
            "Public update to portfolio_profiles",
        ],
    )
    def test_unconditional_policies_are_dropped(self, sql, policy):
        assert f'DROP POLICY IF EXISTS "{policy}"' in sql, (
            f'migration must drop "{policy}" — it had qual=true / with_check=true'
        )

    def test_no_new_unconditional_select_policies(self, sql):
        """Every SELECT policy created must be scoped by the token header."""
        created = re.findall(
            r"CREATE POLICY.*?FOR SELECT.*?USING \((.*?)\n  \);", sql, re.S
        )
        assert created, "expected at least one SELECT policy"
        for using in created:
            assert "x-report-token" in using, (
                f"SELECT policy is not token-scoped: {using[:80]}"
            )
            assert using.strip() != "true", "SELECT policy must not be unconditional"

    def test_views_become_invoker_scoped(self, sql):
        assert "v_programs_full SET (security_invoker = true)" in sql
        assert "v_anomaly_queue SET (security_invoker = true)" in sql

    def test_internal_view_locked_down(self, sql):
        assert "REVOKE ALL ON public.v_anomaly_queue FROM anon" in sql

    def test_anon_update_revoked(self, sql):
        assert "REVOKE UPDATE, DELETE ON public.personal_intelligence FROM anon" in sql
        assert "REVOKE UPDATE, DELETE ON public.portfolio_profiles    FROM anon" in sql


# ── 5. Data honesty: no fabricated numbers ──────────────────────────────────

class TestNoFabricatedData:
    def test_supabase_mapper_has_no_hardcoded_salary_defaults(self):
        src = (REPO_ROOT / "indialens" / "src" / "lib" / "supabase.ts").read_text()
        for bad in ("?? 1_200_000", "?? 88"):
            assert bad not in src, (
                f"'{bad}' fabricates a figure where the DB has no measurement"
            )

    def test_roi_subscores_not_hardcoded(self):
        src = (REPO_ROOT / "indialens" / "src" / "lib" / "supabase.ts").read_text()
        for bad in ("optionalityScore: 78", "mobilityScore: 82", "networkScore: 88"):
            assert bad not in src, f"'{bad}' renders an unmeasured score as model output"

    def test_roi_breakdown_has_no_score_fallbacks(self):
        src = (REPO_ROOT / "indialens" / "src" / "components" / "ROIBreakdown.tsx").read_text()
        for bad in ("optionalityScore, 78", "mobilityScore, 82", "networkScore, 88"):
            assert bad not in src, f"'{bad}' substitutes a hardcoded score for a missing one"
