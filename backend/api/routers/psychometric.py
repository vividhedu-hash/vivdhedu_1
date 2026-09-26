"""
API Router — /api/v2/psychometric
Free adaptive psychometric test engine.
"""
import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.psychometric_engine import psychometric_engine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v2/psychometric", tags=["psychometric"])


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
async def start_session(req: StartRequest) -> Dict[str, Any]:
    """
    Create a new psychometric session and return the first item.
    """
    session = psychometric_engine.create_session(stream=req.stream, budget=req.budget)
    item, is_converged = psychometric_engine.get_next_item(session)

    return {
        "session_id": session.session_id,
        "item": _serialize_item(item),
        "is_converged": is_converged,
        "items_completed": 0,
        "traits": session.traits,
        "archetype_posterior": session.archetype_posterior,
        "estimated_remaining": 16,
    }


@router.post("/respond")
async def record_response(req: RespondRequest) -> Dict[str, Any]:
    """
    Record response for current item and return next item + updated state.
    """
    session = psychometric_engine.get_session(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Start a new session.")

    if req.item_id in session.answered_ids:
        raise HTTPException(status_code=400, detail="Item already answered in this session.")

    # Record response and update trait estimates
    psychometric_engine.record_response(session, req.item_id, req.option_index)

    # Get next item
    next_item, is_converged = psychometric_engine.get_next_item(session)

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
    }


@router.get("/result/{session_id}")
async def get_result(session_id: str) -> Dict[str, Any]:
    """
    Retrieve full archetype report for a completed or in-progress session.
    """
    session = psychometric_engine.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    return psychometric_engine.compute_final_report(session)
