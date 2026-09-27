"""
Serialise a psychometric session to and from migration 0007's row shape.

The engine stays synchronous and in-process. Durability lives here, because
the database session is async and the engine's public methods are not. A
resumed session is a `PsychometricSession` rebuilt from the columns the
adaptive selector actually reads — phase, gateway index, cluster queue,
answered ids, responses, traits, standard errors, archetype posterior — so
the next item is the item a continuous session would have served.

`cluster_queue` is mutated by item selection (it pops). Callers must persist
AFTER `get_next_item`, not only after `record_response`, or a resume would
re-serve an item the queue already handed out.
"""
from __future__ import annotations

import json
from typing import Any, Dict, Optional

from services.psychometric_engine import TRAITS, PsychometricSession


def _loads(value: Any, default: Any) -> Any:
    if value is None:
        return default
    if isinstance(value, str):
        parsed = json.loads(value)
        return default if parsed is None else parsed
    return value


def session_to_row(
    session: PsychometricSession,
    *,
    user_id: Optional[str],
    status: str,
) -> Dict[str, Any]:
    """The column map an UPSERT binds. JSON columns are strings; the SQL casts them."""
    items_completed = len(session.answered_ids)
    potentially_invalid = (
        session.validity_flags >= 3
        and session.acquiescence_count / max(1, items_completed) > 0.85
    )
    archetype_key = None
    if session.archetype_posterior:
        archetype_key = max(session.archetype_posterior, key=lambda k: session.archetype_posterior[k])
    percentiles = {
        trait: round((session.traits.get(trait, 0.0) + 3.0) / 6.0 * 100)
        for trait in TRAITS
    }
    return {
        "session_id": session.session_id,
        "user_id": user_id,
        "stream": session.stream or "",
        "budget": int(session.budget or 15),
        "phase": session.phase,
        "gateway_index": int(session.gateway_index),
        "cluster_queue": json.dumps(list(session.cluster_queue)),
        "answered_item_ids": json.dumps(list(session.answered_ids)),
        "responses": json.dumps(list(session.responses)),
        "traits": json.dumps(dict(session.traits)),
        "trait_se": json.dumps(dict(session.trait_se)),
        "items_completed": items_completed,
        "archetype_posterior": json.dumps(dict(session.archetype_posterior)),
        "archetype_key": archetype_key,
        "trait_percentiles": json.dumps(percentiles),
        "validity_flags": int(session.validity_flags),
        "acquiescence_count": int(session.acquiescence_count),
        "potentially_invalid": potentially_invalid,
        "status": status,
    }


def row_to_session(row: Dict[str, Any]) -> PsychometricSession:
    """
    Rebuild the in-memory object the selector expects.

    Missing trait keys are filled from the engine's own priors (0.0 / SE 1.2)
    so a row written by an older shape still selects items, rather than
    raising KeyError halfway through a test.
    """
    session = PsychometricSession(
        session_id=str(row["session_id"]),
        stream=row.get("stream") or "",
        budget=int(row.get("budget") or 15),
    )
    phase = row.get("phase") or "gateway"
    if phase not in ("gateway", "cluster", "converged"):
        phase = "gateway"
    session.phase = phase
    session.gateway_index = int(row.get("gateway_index") or 0)
    session.cluster_queue = [str(item) for item in _loads(row.get("cluster_queue"), [])]
    session.answered_ids = [str(item) for item in _loads(row.get("answered_item_ids"), [])]
    session.responses = list(_loads(row.get("responses"), []))

    traits = _loads(row.get("traits"), {})
    trait_se = _loads(row.get("trait_se"), {})
    session.traits = {trait: float(traits.get(trait, 0.0)) for trait in TRAITS}
    session.trait_se = {trait: float(trait_se.get(trait, 1.2)) for trait in TRAITS}

    posterior = _loads(row.get("archetype_posterior"), None)
    if isinstance(posterior, dict) and posterior:
        session.archetype_posterior = {str(k): float(v) for k, v in posterior.items()}

    session.validity_flags = int(row.get("validity_flags") or 0)
    session.acquiescence_count = int(row.get("acquiescence_count") or 0)
    return session


UPSERT_SQL = """
INSERT INTO psychometric_sessions (
    session_id, user_id, stream, budget, phase, gateway_index,
    cluster_queue, answered_item_ids, responses, traits, trait_se,
    items_completed, archetype_posterior, archetype_key, trait_percentiles,
    validity_flags, acquiescence_count, potentially_invalid, status, completed_at
) VALUES (
    :session_id, :user_id, :stream, :budget, :phase, :gateway_index,
    CAST(:cluster_queue AS jsonb),
    ARRAY(SELECT jsonb_array_elements_text(CAST(:answered_item_ids AS jsonb))),
    CAST(:responses AS jsonb),
    CAST(:traits AS jsonb),
    CAST(:trait_se AS jsonb),
    :items_completed,
    CAST(:archetype_posterior AS jsonb),
    :archetype_key,
    CAST(:trait_percentiles AS jsonb),
    :validity_flags, :acquiescence_count, :potentially_invalid, :status,
    CASE WHEN :status = 'completed' THEN NOW() ELSE NULL END
)
ON CONFLICT (session_id) DO UPDATE SET
    user_id = COALESCE(EXCLUDED.user_id, psychometric_sessions.user_id),
    stream = EXCLUDED.stream,
    budget = EXCLUDED.budget,
    phase = EXCLUDED.phase,
    gateway_index = EXCLUDED.gateway_index,
    cluster_queue = EXCLUDED.cluster_queue,
    answered_item_ids = EXCLUDED.answered_item_ids,
    responses = EXCLUDED.responses,
    traits = EXCLUDED.traits,
    trait_se = EXCLUDED.trait_se,
    items_completed = EXCLUDED.items_completed,
    archetype_posterior = EXCLUDED.archetype_posterior,
    archetype_key = EXCLUDED.archetype_key,
    trait_percentiles = EXCLUDED.trait_percentiles,
    validity_flags = EXCLUDED.validity_flags,
    acquiescence_count = EXCLUDED.acquiescence_count,
    potentially_invalid = EXCLUDED.potentially_invalid,
    status = EXCLUDED.status,
    completed_at = CASE
        WHEN EXCLUDED.status = 'completed' AND psychometric_sessions.completed_at IS NULL
        THEN NOW() ELSE psychometric_sessions.completed_at END
"""


LOAD_SQL = """
SELECT session_id, user_id, stream, budget, phase, gateway_index,
       cluster_queue, answered_item_ids, responses, traits, trait_se,
       archetype_posterior, validity_flags, acquiescence_count, status
FROM psychometric_sessions
WHERE session_id = :session_id
"""
