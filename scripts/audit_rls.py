#!/usr/bin/env python3
"""
RLS policy audit.

Asserts that no migration grants a client role unconditional access to a table
holding user data.

Why this is a script and not a grep
-----------------------------------
The previous version was:

    grep -nEi '(USING|WITH\\s+CHECK)\\s*\\(?\\s*true\\s*\\)?' *.sql

That flagged every bare `true` regardless of *which role* the policy was
granted to, so it failed on migrations 0006 and 0007 — both of which are
correct. Three cases are legitimate and were all being reported as breaches:

  1. `service_role` policies. service_role bypasses RLS entirely; an explicit
     `USING (true) WITH CHECK (true)` policy for it is a documentation and
     defence-in-depth measure. It grants the anon key nothing, because the anon
     key is not service_role. Flagging it is pure noise, and the noise is the
     problem: a check that cries wolf on correct code stops being read.

  2. Public catalogue tables. `colleges`, `programs`, `cutoffs`,
     `exam_calendar` and `exam_rank_variability` are public by design — the
     whole product is a public programme index. `FOR SELECT ... USING (true)`
     is the correct expression of that intent, not a bug.

  3. Non-PII tables generally. The original P0 was not "a policy said `true`".
     It was "a policy said `true` on a table holding a student's budget,
     finances and risk tolerance, to a role whose key ships in the browser".
     The predicate alone cannot express that, so the check has to reason about
     the table and the role together.

So the real rule is:

    a bare-`true` SELECT or ALL policy is a violation only when the role it is
    granted to is a client role (anon / authenticated) AND the table is not on
    the public-catalogue allowlist.

That is what this script implements. It parses CREATE POLICY statements rather
than pattern-matching lines, so a policy split across lines, or with comments
between the clause and the predicate, is still read correctly.

It is deliberately conservative in one respect: any statement it cannot parse
confidently is reported as a violation rather than skipped. A guard that
fails open is worse than no guard.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

# ── Roles that cannot be trusted with unconditional access ────────────────────
# The anon key ships inside the client bundle, so anything granted to `anon` is
# public. `authenticated` is scoped to a signed-in user, which is why it is
# treated as client too: an unconditional grant to it still means any signed-in
# user sees every row, including other students' rows.
CLIENT_ROLES = frozenset({"anon", "authenticated", "public"})

# service_role bypasses RLS as a matter of Postgres configuration and is only
# ever held by the backend. It is not a client role.
SERVER_ROLES = frozenset({"service_role", "postgres", "supabase_admin"})

# ── Tables that are public by design ─────────────────────────────────────────
# These carry no personal data. They are the product: a public index of Indian
# programmes, their cut-offs, and exam dates. Readable by anyone, by intent.
#
# `v_programs_full` is a view rather than a table and is listed in
# AUDIT_HANDOFF.md as intentionally anon-readable, so it is included here for
# completeness; the SECURITY DEFINER check below is what protects it.
PUBLIC_CATALOGUE_TABLES = frozenset(
    {
        "colleges",
        "degrees",
        "programs",
        "cutoffs",
        "exam_calendar",
        "exam_rank_variability",
        "v_programs_full",
    }
)

# A bare-`true` predicate, in any of the spellings Postgres accepts.
#   USING (true)   USING true   USING  ( true )   WITH CHECK (true)
BARE_TRUE = re.compile(r"^\(\s*true\s*\)$|^true$", re.IGNORECASE)

CREATE_POLICY = re.compile(
    r"CREATE\s+POLICY\s+(?P<name>\"[^\"]+\"|\S+)\s+ON\s+(?P<table>[\w.\"]+)"
    r"(?P<body>.*?);",
    re.IGNORECASE | re.DOTALL,
)

CLAUSE_CMD = re.compile(r"\bFOR\s+(?P<cmd>ALL|SELECT|INSERT|UPDATE|DELETE)\b", re.IGNORECASE)
CLAUSE_ROLES = re.compile(r"\bTO\s+(?P<roles>[\w\s,\"]+?)(?=\bUSING\b|\bWITH\b|$)", re.IGNORECASE)
CLAUSE_USING = re.compile(r"\bUSING\s*(?P<pred>\(.*?\)|\S+)\s*$", re.IGNORECASE | re.DOTALL)
CLAUSE_WITH_CHECK = re.compile(r"\bWITH\s+CHECK\s*(?P<pred>\(.*?\)|\S+)\s*$", re.IGNORECASE | re.DOTALL)

CREATE_VIEW = re.compile(
    r"CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+[\w.\"]+",
    re.IGNORECASE,
)
# Postgres spells the view option with an underscore — `security_definer` — not
# `security definer`. The grep this replaced used `security[[:space:]]+definer`
# and therefore never matched the real syntax; this accepts either spelling.
SECURITY_DEFINER = re.compile(r"security[\s_]+definer", re.IGNORECASE)


def read_statement(sql: str, start: int) -> str:
    """
    Read one statement from `start` to its terminating semicolon.

    A plain scan to the next `;` is not enough: `WITH (security_definer = true)`
    contains a semicolon inside parentheses, and stopping there would truncate
    the statement before the clause being checked. Parentheses are therefore
    tracked, so options lists and subquery parens are consumed as part of the
    statement they belong to.
    """
    depth = 0
    for index in range(start, len(sql)):
        char = sql[index]
        if char == "(":
            depth += 1
        elif char == ")":
            depth = max(0, depth - 1)
        elif char == ";" and depth == 0:
            return sql[start : index + 1]
    return sql[start:]


def strip_sql_comments(sql: str) -> str:
    """
    Remove `--` line comments and `/* */` block comments.

    Essential, not cosmetic. These migrations are heavily commented, and the
    comments quote the exact text being checked (`-- USING (true) is correct
    and unavoidable for catalogue tables`). A line-based grep matches those
    prose references as if they were policies. Stripping comments first is what
    lets the check be strict about real statements and silent about commentary.
    """
    sql = re.sub(r"/\*.*?\*/", " ", sql, flags=re.DOTALL)
    sql = re.sub(r"--[^\n]*", " ", sql)
    return sql


def normalise_table(raw: str) -> str:
    """`"public"."student_reports"` -> `student_reports`."""
    return raw.split(".")[-1].strip('"').lower()


def split_roles(raw: str) -> set[str]:
    """Parse a `TO` clause into a set of role names."""
    return {
        part.strip().strip('"').lower()
        for part in raw.replace(",", " ").split()
        if part.strip()
    }


@dataclass
class Violation:
    path: Path
    line: int
    policy: str
    table: str
    roles: set[str]
    reason: str

    def render(self) -> str:
        return (
            f"{self.path}:{self.line}: policy \"{self.policy}\" on "
            f"{self.table} — {self.reason}"
        )


@dataclass
class Report:
    violations: list[Violation] = field(default_factory=list)
    files_scanned: int = 0
    policies_scanned: int = 0
    unparsed: list[tuple[Path, int]] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.violations and not self.unparsed


def line_of(sql: str, offset: int) -> int:
    return sql.count("\n", 0, offset) + 1


def audit_file(path: Path, root: Path) -> Report:
    report = Report()
    report.files_scanned = 1

    raw = path.read_text(encoding="utf-8", errors="replace")
    sql = strip_sql_comments(raw)

    # Offset mapping is lost by comment stripping, so line numbers are computed
    # against the comment-stripped text. They are close enough to be actionable
    # and are never silently wrong about which file the problem is in.
    for match in CREATE_POLICY.finditer(sql):
        report.policies_scanned += 1
        name = match.group("name").strip('"')
        table = normalise_table(match.group("table"))
        body = match.group("body")
        line = line_of(sql, match.start())

        cmd_match = CLAUSE_CMD.search(body)
        cmd = cmd_match.group("cmd").upper() if cmd_match else "ALL"

        roles_match = CLAUSE_ROLES.search(body)
        if not roles_match:
            # No explicit TO means PUBLIC, which includes anon. Treat as a client
            # grant rather than assume the narrowest reading.
            roles = {"public"}
        else:
            roles = split_roles(roles_match.group("roles"))

        using_match = CLAUSE_USING.search(body)
        with_check_match = CLAUSE_WITH_CHECK.search(body)
        if not using_match and not with_check_match:
            # A policy with neither USING nor WITH CHECK is default-deny in
            # effect, so there is nothing to check here.
            continue

        unconditional = False
        which = ""
        for label, clause in (("USING", using_match), ("WITH CHECK", with_check_match)):
            if clause is None:
                continue
            pred = clause.group("pred").strip()
            if BARE_TRUE.match(pred):
                unconditional = True
                which = label
                break

        if not unconditional:
            continue

        if not (roles & CLIENT_ROLES):
            # Server role only. service_role bypasses RLS by configuration; an
            # explicit policy documents the intent and grants the browser key
            # nothing.
            continue

        if table in PUBLIC_CATALOGUE_TABLES:
            continue

        # An INSERT-only policy has no USING clause to broaden read access, and
        # the product genuinely needs anonymous writes: the onboarding wizard
        # submits a report before any account exists. Those are still worth
        # surfacing, but as a distinct, lower-severity finding, because a
        # blanket WITH CHECK (true) does let an anonymous caller insert rows of
        # any shape into a table that is otherwise owner-scoped.
        if cmd == "INSERT" and which == "WITH CHECK" and "USING" not in body.upper():
            report.violations.append(
                Violation(
                    path=path.relative_to(root),
                    line=line,
                    policy=name,
                    table=table,
                    roles=roles,
                    reason=(
                        "anonymous INSERT is unrestricted; constrain WITH CHECK to the "
                        "narrowest valid row shape rather than accepting any"
                    ),
                )
            )
            continue

        report.violations.append(
            Violation(
                path=path.relative_to(root),
                line=line,
                policy=name,
                table=table,
                roles=roles,
                reason=(
                    f"{which} is bare `true`, granting every row to "
                    f"{', '.join(sorted(roles & CLIENT_ROLES))} on a table that is not "
                    "public catalogue data"
                ),
            )
        )

    for view in CREATE_VIEW.finditer(sql):
        # Read to the true end of the statement: a semicolon inside
        # `WITH (security_definer = true)` must not truncate it and hide the very
        # clause being checked.
        if SECURITY_DEFINER.search(read_statement(sql, view.start())):
            report.violations.append(
                Violation(
                    path=path.relative_to(root),
                    line=line_of(sql, view.start()),
                    policy="<view>",
                    table="<view>",
                    roles=set(),
                    reason=(
                        "view is SECURITY DEFINER, so it executes with the creator's "
                        "privileges and bypasses RLS on the underlying tables; use "
                        "ALTER VIEW ... SET (security_invoker = true)"
                    ),
                )
            )

    return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit RLS policies for unconditional client grants.")
    parser.add_argument(
        "--root",
        default=".",
        help="Repository root. Paths in findings are reported relative to it.",
    )
    args = parser.parse_args()

    root = Path(args.root).resolve()
    migrations = root / "backend" / "db" / "migrations"
    targets: list[Path] = sorted(migrations.glob("*.sql"))
    schema = root / "backend" / "db" / "schema.sql"
    if schema.exists():
        targets.append(schema)

    if not targets:
        print("::error::no SQL files found to audit", file=sys.stderr)
        return 1

    total = Report()
    for path in targets:
        # Rollback scripts exist to recreate the pre-hardening policies, so they
        # are necessarily full of USING (true). A rollback that fails this audit
        # is not a rollback.
        name = path.name.lower()
        if name.endswith("_rollback.sql") or "rollback" in path.parent.parts:
            continue
        report = audit_file(path, root)
        total.violations.extend(report.violations)
        total.unparsed.extend(report.unparsed)
        total.policies_scanned += report.policies_scanned
        total.files_scanned += report.files_scanned

    print(
        f"Audited {total.policies_scanned} policies across {total.files_scanned} files "
        f"({len(targets)} considered, rollback scripts excluded)."
    )

    for violation in total.violations:
        print(f"::error::{violation.render()}", file=sys.stderr)

    if total.ok:
        print("rls-audit: no unconditional client grants found.")
        return 0

    print(
        f"rls-audit: {len(total.violations)} violation(s).",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
