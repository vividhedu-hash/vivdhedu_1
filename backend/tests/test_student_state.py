"""
Student-state rules and psychometric resume, without a database.

The routers talk to Postgres. These tests cover the decisions that must be
right even when the database is the unreachable sandbox conftest points at:
what a profile write may contain, which application statuses can follow which,
and whether a psychometric session rebuilt from its row asks for the same next
item the live session would.
"""
import copy

import pytest

from api.services.student_rules import (
    RuleError,
    assert_status_transition,
    validate_profile_fields,
    validate_shortlist_fields,
)
from services.psychometric_engine import PsychometricEngine
from services.psychometric_store import row_to_session, session_to_row


class TestProfileRules:
    def test_rejects_neet_above_720(self):
        with pytest.raises(RuleError) as exc:
            validate_profile_fields({"neet_score": 721})
        assert exc.value.field == "neet_score"

    def test_rejects_jee_rank_outside_the_form_domain(self):
        with pytest.raises(RuleError):
            validate_profile_fields({"jee_rank": 0})
        with pytest.raises(RuleError):
            validate_profile_fields({"jee_rank": 250_001})

    def test_student_cannot_mark_their_own_category_verified(self):
        with pytest.raises(RuleError) as exc:
            validate_profile_fields({"category": "SC", "category_verified": True})
        assert exc.value.field == "category_verified"

    def test_accepts_a_partial_real_profile(self):
        validate_profile_fields({
            "twelfth_stream": "science",
            "jee_rank": 12000,
            "neet_score": 0,
            "category": "SC",
            "home_state": "Tamil Nadu",
            "tenth_pct": 91.5,
        })

    def test_shortlist_priority_is_1_to_3(self):
        with pytest.raises(RuleError):
            validate_shortlist_fields(4, None)
        validate_shortlist_fields(1, "reach")


class TestApplicationTransitions:
    def test_admitted_is_terminal(self):
        with pytest.raises(RuleError) as exc:
            assert_status_transition("admitted", "planned")
        assert "cannot change status" in str(exc.value)

    def test_rejected_cannot_return_to_planned(self):
        with pytest.raises(RuleError):
            assert_status_transition("rejected", "planned")

    def test_planned_can_be_submitted(self):
        assert_status_transition("planned", "submitted")

    def test_same_status_is_not_a_transition(self):
        assert_status_transition("submitted", "submitted")

    def test_submitted_cannot_skip_backwards(self):
        with pytest.raises(RuleError):
            assert_status_transition("submitted", "planned")


class TestPsychometricResume:
    def test_rebuilt_session_selects_the_same_next_item(self):
        engine = PsychometricEngine()
        session = engine.create_session("science", 15)
        first, _ = engine.get_next_item(session)
        assert first is not None
        engine.record_response(session, first["id"], 1)

        restored = row_to_session(session_to_row(session, user_id=None, status="in_progress"))
        # Selection mutates the queue, so compare two independent copies.
        live = copy.deepcopy(session)
        resumed = copy.deepcopy(restored)

        live_item, live_done = engine.get_next_item(live)
        resumed_item, resumed_done = engine.get_next_item(resumed)

        assert resumed_done == live_done
        assert resumed_item is not None and live_item is not None
        assert resumed_item["id"] == live_item["id"]
        assert restored.traits == session.traits
        assert restored.answered_ids == session.answered_ids
        assert restored.cluster_queue == session.cluster_queue

    def test_session_id_stays_the_unguessable_handle(self):
        engine = PsychometricEngine()
        session = engine.create_session("", 15)
        row = session_to_row(session, user_id=None, status="in_progress")
        assert len(row["session_id"]) >= 16
        assert row_to_session(row).session_id == session.session_id
