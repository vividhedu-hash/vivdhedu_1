"""
API Router — /api/v2/psychometric
Free adaptive psychometric test engine.

Sessions are written to `psychometric_sessions` when that table is reachable,
and rebuilt from it when this process has never seen the id — that is what
makes a test survive a restart and a second worker. The engine itself stays
the source of the next item. If the table is missing or the database is down,
the test still runs in memory and the response says `durable: false`. It does
not invent a saved session.
"""
import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from api.db.database import AsyncSessionLocal, engine
from services.psychometric_engine import psychometric_engine
from services.psychometric_store import LOAD_SQL, UPSERT_SQL, row_to_session, session_to_row

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v2/psychometric", tags=["psychometric"])


async def _optional_db():
    """A session when a database is configured, otherwise None.

    `get_db` turns a missing DATABASE_URL into a 503 before the route runs.
    This test is public and used to work with no database at all, so a missing
    engine degrades to an explicitly non-durable session instead of refusing
    to start the test.
    """
    if engine is None:
        yield None
        return
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def _persist(db: Optional[AsyncSession], session, user_id: Optional[str], status: str) -> Dict[str, Any]:
    if db is None:
        return {"durable": False, "durability": "memory_only", "durability_reason": "database_not_configured"}
    try:
        await db.execute(text(UPSERT_SQL), session_to_row(session, user_id=user_id, status=status))
        return {"durable": True, "durability": "database", "durability_reason": None}
    except Exception as exc:  # noqa: BLE001 - the test must say so, not pretend it saved
        logger.warning("[Psychometric] Session %s was not saved: %s", session.session_id, exc)
        try:
            await db.rollback()
        except Exception:  # noqa: BLE001
            pass
        reason = "migration_0007_not_applied" if "psychometric_sessions" in str(exc) else "database_unavailable"
        return {"durable": False, "durability": "memory_only", "durability_reason": reason}


async def _load(db: Optional[AsyncSession], session_id: str):
    if db is None:
        return None
    try:
        result = await db.execute(text(LOAD_SQL), {"session_id": session_id})
        row = result.mappings().first()
        return row_to_session(dict(row)) if row else None
    except Exception as exc:  # noqa: BLE001
        logger.warning("[Psychometric] Could not load session %s: %s", session_id, exc)
        try:
            await db.rollback()
        except Exception:  # noqa: BLE001
            pass
        return None


def _remember(session) -> None:
    psychometric_engine.sessions[session.session_id] = session


async def _session_for(db: Optional[AsyncSession], session_id: str):
    """This process's copy if it has one, otherwise the row from the last successful save."""
    current = psychometric_engine.get_session(session_id)
    if current is not None:
        return current
    loaded = await _load(db, session_id)
    if loaded is not None:
        _remember(loaded)
    return loaded


class StartRequest(BaseModel):
    stream: str = ""
    budget: int = 15


class RespondRequest(BaseModel):
    session_id: str
    item_id: str
    option_index: int  # 0-3


def _serialize_item(item: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Strip IRT params and validity meta before sending to client."""
    if item is None:
        return None
    return {
        "id": item["id"],
        "type": item["type"],
        "text": item["text"],
        "trait": item["trait"],
        "options": [{"text": opt["text"]} for opt in item.get("options", [])],
    }


@router.post("/start")
async def start_session(
    req: StartRequest,
    db: Optional[AsyncSession] = Depends(_optional_db),
) -> Dict[str, Any]:
    """
    Create a new psychometric session and return the first item.
    """
    session = psychometric_engine.create_session(stream=req.stream, budget=min(100, max(1, req.budget)))
    item, is_converged = psychometric_engine.get_next_item(session)
    # Persist after selection: get_next_item mutates the cluster queue.
    durability = await _persist(db, session, None, "in_progress")

    return {
        "session_id": session.session_id,
        "item": _serialize_item(item),
        "is_converged": is_converged,
        "items_completed": 0,
        "traits": session.traits,
        "archetype_posterior": session.archetype_posterior,
        "estimated_remaining": 16,
        **durability,
    }


@router.post("/respond")
async def record_response(
    req: RespondRequest,
    db: Optional[AsyncSession] = Depends(_optional_db),
) -> Dict[str, Any]:
    """
    Record response for current item and return next item + updated state.
    """
    session = await _session_for(db, req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Start a new session.")

    if req.item_id in session.answered_ids:
        raise HTTPException(status_code=400, detail="Item already answered in this session.")

    # Record response and update trait estimates
    psychometric_engine.record_response(session, req.item_id, req.option_index)

    # Get next item
    next_item, is_converged = psychometric_engine.get_next_item(session)
    status = "completed" if is_converged else "in_progress"
    durability = await _persist(db, session, None, status)

    # Estimate remaining
    max_se = max(session.trait_se.values())
    est_remaining = max(0, int((max_se - 0.38) / 0.08)) if not is_converged else 0

    return {
        "session_id": req.session_id,
        "item": _serialize_item(next_item),
        "is_converged": is_converged,
        "items_completed": len(session.answered_ids),
        "traits": session.traits,
        "trait_se": session.trait_se,
        "archetype_posterior": session.archetype_posterior,
        "primary_archetype": max(session.archetype_posterior, key=lambda k: session.archetype_posterior[k]),
        "estimated_remaining": min(30, est_remaining),
        **durability,
    }


@router.get("/result/{session_id}")
async def get_result(
    session_id: str,
    db: Optional[AsyncSession] = Depends(_optional_db),
) -> Dict[str, Any]:
    """
    Retrieve full archetype report for a completed or in-progress session.
    """
    session = await _session_for(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    return psychometric_engine.compute_final_report(session)
