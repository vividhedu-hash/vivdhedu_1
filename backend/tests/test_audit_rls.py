"""
Regression tests for scripts/audit_rls.py.

The audit replaced a grep in CI that had started reporting correct migrations
(0006, 0007) as breaches. Replacing a security check is exactly the kind of
change that can quietly remove the check rather than refine it, so the P0 it is
supposed to catch is pinned here. If someone later loosens the audit, these
fail.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "scripts"))

import audit_rls  # noqa: E402


def _write_migrations(tmp_path: Path, *sql_files: str) -> Path:
    """Lay out a fake repo the way the audit expects to find one."""
    migrations = tmp_path / "backend" / "db" / "migrations"
    migrations.mkdir(parents=True)
    for name, body in sql_files:
        (migrations / name).write_text(body, encoding="utf-8")
    return tmp_path


def _run(root: Path):
    targets = sorted((root / "backend" / "db" / "migrations").glob("*.sql"))
    report = audit_rls.Report()
    for path in targets:
        if path.name.lower().endswith("_rollback.sql"):
            continue
        found = audit_rls.audit_file(path, root)
        report.violations.extend(found.violations)
        report.policies_scanned += found.policies_scanned
    return report


# ── The P0 must still fail ───────────────────────────────────────────────────

P0_SELECT = """
CREATE POLICY "Public access to student_reports by token"
  ON public.student_reports
  FOR SELECT TO anon, authenticated
  USING (true);
"""

P0_UPDATE = """
CREATE POLICY "Public update to personal_intelligence"
  ON public.personal_intelligence
  FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);
"""


def test_bare_true_select_on_student_pii_is_a_violation(tmp_path):
    """The original P0: every student report readable by anyone."""
    root = _write_migrations(tmp_path, ("p0.sql", P0_SELECT))
    assert _run(root).violations, "anon SELECT ... USING (true) on PII must fail the audit"


def test_bare_true_update_on_student_pii_is_a_violation(tmp_path):
    """The original P0's second half: anyone could overwrite the record."""
    root = _write_migrations(tmp_path, ("p0.sql", P0_UPDATE))
    assert _run(root).violations, "anon UPDATE ... WITH CHECK (true) on PII must fail the audit"


def test_unqualified_policy_is_treated_as_public(tmp_path):
    """No `TO` clause means PUBLIC, which includes anon."""
    root = _write_migrations(
        tmp_path,
        ("p0.sql", 'CREATE POLICY "open" ON public.portfolio_profiles FOR SELECT USING (true);'),
    )
    assert _run(root).violations, "a policy with no TO clause is PUBLIC and must not pass"


# ── Correct code must pass ───────────────────────────────────────────────────

TOKEN_SCOPED = """
CREATE POLICY "Token scoped read on student_reports"
  ON public.student_reports FOR SELECT TO anon, authenticated
  USING ((current_setting('request.headers', true)::jsonb ->> 'x-report-token') = token);
"""

SERVICE_ROLE = """
CREATE POLICY "Service role full access on cutoffs"
  ON public.cutoffs FOR ALL TO service_role
  USING (true) WITH CHECK (true);
"""

PUBLIC_CATALOGUE = """
CREATE POLICY "Public read on programs"
  ON public.programs FOR SELECT TO anon, authenticated
  USING (true);
"""


def test_token_scoped_policy_passes(tmp_path):
    """The shipped fix for P0-2 must not be flagged by its own guard."""
    root = _write_migrations(tmp_path, ("good.sql", TOKEN_SCOPED))
    assert not _run(root).violations


def test_service_role_policy_passes(tmp_path):
    """service_role bypasses RLS; the explicit policy documents that.

    Flagging it is what made the old grep unreadable — it reported migrations
    0006 and 0007 as breaches when both were correct.
    """
    root = _write_migrations(tmp_path, ("good.sql", SERVICE_ROLE))
    assert not _run(root).violations


def test_public_catalogue_select_passes(tmp_path):
    """A public index is public on purpose. The whole product depends on it."""
    root = _write_migrations(tmp_path, ("good.sql", PUBLIC_CATALOGUE))
    assert not _run(root).violations


# ── The audit must not be fooled by prose ────────────────────────────────────

def test_comments_mentioning_true_are_not_policies(tmp_path):
    """These migrations document `USING (true)` in prose.

    A line-based grep matched those comments as if they were policies, which is
    how the check ended up flagging correct files.
    """
    root = _write_migrations(
        tmp_path,
        (
            "good.sql",
            """
-- `USING (true)` is correct for catalogue tables: the table is public by
-- design. USING (true) WITH CHECK (true) is likewise expected here.
/* A block comment containing USING (true) should also be ignored. */
CREATE POLICY "Token scoped" ON public.student_reports FOR SELECT TO anon,
  authenticated USING ((current_setting('request.headers', true)::jsonb
  ->> 'x-report-token') = token);
""",
        ),
    )
    report = _run(root)
    assert not report.violations, f"comment text must not be parsed as a policy: {report.violations}"


def test_multiline_policy_is_parsed(tmp_path):
    """A policy split across lines must still be read correctly."""
    root = _write_migrations(
        tmp_path,
        (
            "p0.sql",
            """
CREATE POLICY "wrapped"
  ON public.personal_intelligence
  FOR SELECT
  TO anon,
  authenticated
  USING (true);
""",
        ),
    )
    assert _run(root).violations, "a multi-line USING (true) must still fail"


def test_security_definer_view_is_a_violation(tmp_path):
    """SECURITY DEFINER views bypass RLS on the underlying tables."""
    root = _write_migrations(
        tmp_path,
        (
            "view.sql",
            """
CREATE OR REPLACE VIEW public.v_anomaly_queue
  WITH (security_definer = true)
  AS SELECT * FROM public.anomalies;
""",
        ),
    )
    report = _run(root)
    assert any("SECURITY DEFINER" in v.reason for v in report.violations)


def test_security_invoker_view_passes(tmp_path):
    root = _write_migrations(
        tmp_path,
        (
            "view.sql",
            """
CREATE OR REPLACE VIEW public.v_programs_full
  WITH (security_invoker = true)
  AS SELECT * FROM public.programs;
""",
        ),
    )
    report = _run(root)
    assert not any("SECURITY DEFINER" in v.reason for v in report.violations)


# ── The real repository must be clean ───────────────────────────────────────

def test_repository_migrations_pass_the_audit():
    """Guard against the check being committed in a state that fails."""
    migrations = REPO_ROOT / "backend" / "db" / "migrations"
    files = [p for p in sorted(migrations.glob("*.sql")) if not p.name.lower().endswith("_rollback.sql")]
    assert files, "expected migrations to audit"

    report = audit_rls.Report()
    for path in files:
        found = audit_rls.audit_file(path, REPO_ROOT)
        report.violations.extend(found.violations)
        report.policies_scanned += found.policies_scanned

    assert report.policies_scanned > 0, "audit parsed no policies at all"
    rendered = "\n".join(v.render() for v in report.violations)
    assert not report.violations, f"repository has RLS violations:\n{rendered}"
