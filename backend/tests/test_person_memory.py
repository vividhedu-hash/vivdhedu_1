"""Person-memory ranking, without a database."""

from services.person_memory import (
    apply_batch,
    apply_event,
    compile_llm_context,
    empty_state,
    rank_candidates,
    seed_from_profile,
    upsert_fact,
)


def test_asks_raise_affinity_for_extracted_topics():
    state = empty_state("u1")
    state = apply_event(state, {
        "signal": "ask",
        "text": "Should I sit JEE or go abroad for CSE at LSE?",
        "path": "/workspace",
    })
    keys = state["affinities"].keys()
    assert any(k.endswith(":jee") for k in keys)
    assert any("engineering-cs" in k or "study-abroad" in k for k in keys)
    assert state["stats"]["ask_count"] == 1
    assert state["episodes"][-1]["kind"] == "ask"


def test_hide_demotes_and_blocks_ranking():
    state = empty_state("u1")
    state = apply_event(state, {
        "signal": "click",
        "entities": [{"kind": "college", "entity_id": "bits", "label": "BITS"}],
    })
    state = apply_event(state, {
        "signal": "hide",
        "entities": [{"kind": "college", "entity_id": "bits", "label": "BITS"}],
    })
    ranked = rank_candidates(state, [
        {"kind": "college", "entity_id": "bits", "label": "BITS"},
        {"kind": "college", "entity_id": "nit-t", "label": "NIT Trichy"},
    ])
    bits = next(item for item in ranked if item["entity_id"] == "bits")
    assert bits["score"] < 0
    assert "college:bits" in state["hidden"]


def test_weaker_fact_cannot_overwrite_stronger():
    state = empty_state("u1")
    state = upsert_fact(state, {"key": "target_field", "value": "medicine", "confidence": 0.95, "source": "profile"})
    state = upsert_fact(state, {"key": "target_field", "value": "design", "confidence": 0.4, "source": "guess"})
    assert state["facts"]["target_field"]["value"] == "medicine"


def test_seeded_profile_beats_unrelated_candidate():
    state = seed_from_profile(empty_state("u1"), {
        "full_name": "Asha",
        "target_field": "engineering-cs",
        "goals": ["ai research"],
        "geography": ["Bengaluru"],
        "exam": "JEE Main",
    })
    ranked = rank_candidates(state, [
        {"kind": "topic", "entity_id": "engineering-cs", "tags": ["engineering-cs"]},
        {"kind": "topic", "entity_id": "law", "tags": ["law"]},
    ])
    assert ranked[0]["entity_id"] == "engineering-cs"
    packet = compile_llm_context(state)
    assert "Asha" in packet["prompt_block"]
    assert "engineering-cs" in packet["prompt_block"]
    assert "never invent" in packet["prompt_block"].lower()


def test_batch_orders_by_time():
    state = apply_batch(empty_state("u1"), events=[
        {"signal": "skip", "text": "neet", "occurred_at": "2026-01-02T00:00:00Z"},
        {"signal": "save", "text": "neet mbbs", "occurred_at": "2026-01-01T00:00:00Z"},
    ])
    # save first, then skip — net should still leave a medicine affinity, not empty
    assert state["stats"]["event_count"] == 2
    assert any("medicine" in k or "neet" in k for k in state["affinities"])
