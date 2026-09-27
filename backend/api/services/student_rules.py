"""
Validation and transition rules for the student-state tables.

Pure functions. No database, no FastAPI. The routers call these, and the tests
call them directly, so a rule can be wrong in CI without a Postgres.

Why status transitions are a closed set
---------------------------------------
`admitted` and `rejected` are outcomes a counselling authority records, not
moods. Letting a student move an application from `admitted` back to `planned`
would let the tracker rewrite a result. Notes, deadlines and the counselling
round stay editable in every status; only the status edge is restricted.

Same-status updates are allowed. A student fixing a deadline on a `submitted`
application is not a transition.
"""
from __future__ import annotations

from typing import Any, Dict, Mapping

# Mirrors the CHECK constraint on student_profiles.twelfth_stream's comment
# and the category CHECK in migration 0007. Kept here so a bad value is a 422
# with a named list, not a database error the client cannot read.
TWELFTH_STREAMS = frozenset({"science", "commerce", "arts", "vocational", "other"})
CATEGORIES = frozenset(
    {"General", "OPEN", "EWS", "OBC-NCL", "OBC", "SC", "ST", "PwD"}
)
APPLICATION_TIERS = frozenset({"reach", "target", "safety", "hidden_gem", "pruned"})
APPLICATION_STATUSES = frozenset(
    {"planned", "submitted", "shortlisted", "rejected", "admitted", "waitlisted"}
)

# JEE Main rank domain the analyze form already enforces (1..250000).
# expected_rank is wider because NEET and state-CET ranks run past that.
JEE_RANK_MAX = 250_000
EXPECTED_RANK_MAX = 2_000_000
NEET_SCORE_MAX = 720

# Edges only. Terminal statuses have an empty set: there is no legal next
# status, so the only legal write is "leave it where it is".
ALLOWED_STATUS_TRANSITIONS: Dict[str, frozenset] = {
    "planned": frozenset({"submitted"}),
    "submitted": frozenset({"shortlisted", "waitlisted", "rejected", "admitted"}),
    "shortlisted": frozenset({"waitlisted", "rejected", "admitted"}),
    "waitlisted": frozenset({"shortlisted", "rejected", "admitted"}),
    "admitted": frozenset(),
    "rejected": frozenset(),
}


class RuleError(ValueError):
    """A client-supplied value the table would reject, named for the API."""

    def __init__(self, field: str, message: str) -> None:
        self.field = field
        super().__init__(message)


def assert_status_transition(current: str, new: str) -> None:
    """Raise RuleError unless `new` is `current` or a legal next status."""
    if current not in ALLOWED_STATUS_TRANSITIONS:
        raise RuleError("status", f"Stored status {current!r} is not a known application status.")
    if new not in APPLICATION_STATUSES:
        raise RuleError(
            "status",
            "Status must be one of: " + ", ".join(sorted(APPLICATION_STATUSES)) + ".",
        )
    if new == current:
        return
    allowed = ALLOWED_STATUS_TRANSITIONS[current]
    if new not in allowed:
        if not allowed:
            raise RuleError(
                "status",
                f"An application marked {current} cannot change status. "
                "Notes and the deadline can still be updated.",
            )
        raise RuleError(
            "status",
            f"Cannot move an application from {current} to {new}. "
            f"Allowed next statuses: {', '.join(sorted(allowed))}.",
        )


def validate_profile_fields(fields: Mapping[str, Any]) -> None:
    """
    Validate a partial profile write. Only keys the client actually sent are
    checked; an omitted key is "leave the stored value alone", not "set null".

    `category_verified` is not a client field. A student asserting that their
    own reservation category has been sighted is the same shape of bug as
    self-granting premium: the flag means a certificate was seen, and only a
    later review path may set it.
    """
    if "category_verified" in fields:
        raise RuleError(
            "category_verified",
            "Category verification is recorded by review, not by the student.",
        )

    stream = fields.get("twelfth_stream")
    if stream is not None and stream not in TWELFTH_STREAMS:
        raise RuleError(
            "twelfth_stream",
            "twelfth_stream must be one of: " + ", ".join(sorted(TWELFTH_STREAMS)) + ".",
        )

    category = fields.get("category")
    if category is not None and category not in CATEGORIES:
        raise RuleError(
            "category",
            "category must be one of: " + ", ".join(sorted(CATEGORIES)) + ".",
        )

    _range("tenth_pct", fields.get("tenth_pct"), 0, 100)
    _range("twelfth_pct", fields.get("twelfth_pct"), 0, 100)
    _range("jee_main_percentile", fields.get("jee_main_percentile"), 0, 100)

    backlog = fields.get("backlog_count")
    if backlog is not None and (not isinstance(backlog, int) or isinstance(backlog, bool) or backlog < 0 or backlog > 40):
        raise RuleError("backlog_count", "backlog_count must be a whole number from 0 to 40.")

    jee = fields.get("jee_rank")
    if jee is not None and (not _positive_int(jee) or jee > JEE_RANK_MAX):
        raise RuleError("jee_rank", f"jee_rank must be a whole number from 1 to {JEE_RANK_MAX}.")

    expected = fields.get("expected_rank")
    if expected is not None and (not _positive_int(expected) or expected > EXPECTED_RANK_MAX):
        raise RuleError(
            "expected_rank",
            f"expected_rank must be a whole number from 1 to {EXPECTED_RANK_MAX}.",
        )

    neet = fields.get("neet_score")
    if neet is not None and (not isinstance(neet, int) or isinstance(neet, bool) or neet < 0 or neet > NEET_SCORE_MAX):
        raise RuleError("neet_score", f"neet_score must be a whole number from 0 to {NEET_SCORE_MAX}.")

    budget = fields.get("max_budget_inr")
    if budget is not None and (not _positive_int(budget)):
        raise RuleError("max_budget_inr", "max_budget_inr must be a positive whole number of rupees.")

    loan = fields.get("loan_amount_inr")
    if loan is not None and (not isinstance(loan, int) or isinstance(loan, bool) or loan < 0):
        raise RuleError("loan_amount_inr", "loan_amount_inr must be zero or a positive whole number.")

    home = fields.get("home_state")
    if home is not None and (not isinstance(home, str) or not home.strip() or len(home) > 64):
        raise RuleError("home_state", "home_state must be a non-empty name of at most 64 characters.")

    exam = fields.get("exam_name")
    if exam is not None and (not isinstance(exam, str) or not exam.strip() or len(exam) > 64):
        raise RuleError("exam_name", "exam_name must be a non-empty name of at most 64 characters.")


def validate_shortlist_fields(priority: Any, note: Any) -> None:
    if priority is not None and (not isinstance(priority, int) or isinstance(priority, bool) or priority < 1 or priority > 3):
        raise RuleError("priority", "priority must be 1, 2 or 3.")
    if note is not None and (not isinstance(note, str) or len(note) > 2000):
        raise RuleError("note", "note must be text of at most 2000 characters.")


def validate_application_create(tier: Any, status: str) -> None:
    if tier is not None and tier not in APPLICATION_TIERS:
        raise RuleError(
            "tier",
            "tier must be one of: " + ", ".join(sorted(APPLICATION_TIERS)) + ".",
        )
    if status not in ("planned", "submitted"):
        raise RuleError(
            "status",
            "A new application starts as planned or submitted. "
            "Later statuses are recorded as the application moves.",
        )


def _positive_int(value: Any) -> bool:
    return isinstance(value, int) and not isinstance(value, bool) and value > 0


def _range(field: str, value: Any, low: float, high: float) -> None:
    if value is None:
        return
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise RuleError(field, f"{field} must be a number from {low} to {high}.")
    if value < low or value > high:
        raise RuleError(field, f"{field} must be between {low} and {high}.")
