"""
Postgres persistence for person memory.

The algorithm lives in `services.person_memory`. This module only reads and
writes the caller's own row. Every query filters `user_id = :user_id`.
Callers must not `commit()` — `get_db` does that once per request.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from services.person_memory import apply_batch, compile_llm_context, empty_state, seed_from_profile

logger = logging.getLogger(__name__)


def _parse_json(value: Any, fallback: Any) -> Any:
    if value is None:
        return fallback
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return fallback
    return value


async def load_state(db: AsyncSession, user_id: str) -> Dict[str, Any]:
    if not db or not user_id:
        return empty_state(user_id or "anonymous")
    try:
        result = await db.execute(
            text(
                "SELECT snapshot FROM person_memory "
                "WHERE user_id = :user_id LIMIT 1"
            ),
            {"user_id": str(user_id)},
        )
        row = result.mappings().first()
        if not row:
            return empty_state(user_id)
        snapshot = _parse_json(row.get("snapshot"), None)
        if not isinstance(snapshot, dict):
            return empty_state(user_id)
        snapshot["owner_id"] = user_id
        return snapshot
    except Exception as exc:  # noqa: BLE001 — missing table must not 500 the advisor
        logger.warning("[PersonMemory] load skipped: %s", exc)
        return empty_state(user_id)


async def save_state(db: AsyncSession, user_id: str, state: Dict[str, Any]) -> bool:
    if not db or not user_id:
        return False
    payload = dict(state)
    payload["owner_id"] = user_id
    try:
        await db.execute(
            text(
                """
                INSERT INTO person_memory (user_id, snapshot, updated_at)
                VALUES (:user_id, CAST(:snapshot AS jsonb), NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    snapshot = EXCLUDED.snapshot,
                    updated_at = NOW()
                """
            ),
            {"user_id": str(user_id), "snapshot": json.dumps(payload, default=str)},
        )
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning("[PersonMemory] save skipped: %s", exc)
        return False


async def append_events(
    db: AsyncSession,
    user_id: str,
    events: List[Dict[str, Any]],
    facts: Optional[List[Dict[str, Any]]] = None,
    profile: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    state = await load_state(db, user_id)
    state = apply_batch(state, events, facts=facts, profile=profile)
    persisted = await save_state(db, user_id, state)
    state["persisted"] = persisted
    return state


async def reset_state(db: AsyncSession, user_id: str) -> bool:
    if not db or not user_id:
        return False
    try:
        await db.execute(
            text("DELETE FROM person_memory WHERE user_id = :user_id"),
            {"user_id": str(user_id)},
        )
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning("[PersonMemory] reset skipped: %s", exc)
        return False


async def memory_payload(db: AsyncSession, user_id: str, include_sensitive: bool = True) -> Dict[str, Any]:
    state = await load_state(db, user_id)
    packet = compile_llm_context(state, include_sensitive=include_sensitive)
    packet["state"] = {
        "affinities": state.get("affinities") or {},
        "facts": state.get("facts") or {},
        "episodes": state.get("episodes") or [],
        "hidden": state.get("hidden") or [],
        "stats": state.get("stats") or {},
        "updated_at": state.get("updated_at"),
        "persisted": True,
    }
    return packet


def seed_if_empty(state: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, Any]:
    if state.get("facts") or (state.get("stats") or {}).get("event_count"):
        return state
    return seed_from_profile(state, profile)
