"""
/api/v1/person — the durable interest graph for one signed-in student.

Every route goes through `require_user`. The snapshot is the student's own
memory, not a shareable token artefact.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.database import get_db
from ..identity import UserIdentity, require_user
from ..services.person_memory_store import (
    append_events,
    load_state,
    memory_payload,
    reset_state,
    save_state,
)
from services.person_memory import compile_llm_context, rank_candidates, upsert_fact

router = APIRouter(prefix="/person", tags=["Person memory"])


class PersonEvent(BaseModel):
    signal: str = Field(..., min_length=2, max_length=24)
    path: Optional[str] = Field(None, max_length=200)
    text: Optional[str] = Field(None, max_length=2000)
    dwell_ms: Optional[float] = Field(None, ge=0, le=3_600_000)
    strength: Optional[float] = Field(None, ge=-3, le=5)
    entities: Optional[List[Dict[str, Any]]] = None
    occurred_at: Optional[str] = None


class PersonFact(BaseModel):
    key: str = Field(..., min_length=1, max_length=64)
    value: Any
    confidence: Optional[float] = Field(None, ge=0, le=1)
    source: Optional[str] = Field(None, max_length=40)
    sensitive: Optional[bool] = None


class EventBatch(BaseModel):
    events: List[PersonEvent] = Field(default_factory=list, max_length=50)
    facts: List[PersonFact] = Field(default_factory=list, max_length=30)
    profile: Optional[Dict[str, Any]] = None


class RankRequest(BaseModel):
    candidates: List[Dict[str, Any]] = Field(default_factory=list, max_length=80)


@router.post("/events")
async def ingest_events(
    payload: EventBatch,
    identity: UserIdentity = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    state = await append_events(
        db,
        identity.id,
        events=[e.model_dump() for e in payload.events],
        facts=[f.model_dump() for f in payload.facts],
        profile=payload.profile,
    )
    packet = compile_llm_context(state, include_sensitive=True)
    return {"ok": True, "persisted": bool(state.get("persisted")), "memory": packet}


@router.post("/facts")
async def write_fact(
    payload: PersonFact,
    identity: UserIdentity = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    state = await load_state(db, identity.id)
    state = upsert_fact(state, payload.model_dump())
    persisted = await save_state(db, identity.id, state)
    return {"ok": True, "persisted": persisted, "memory": compile_llm_context(state, include_sensitive=True)}


@router.get("/memory")
async def read_memory(
    identity: UserIdentity = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    return await memory_payload(db, identity.id, include_sensitive=True)


@router.get("/llm-context")
async def llm_context(
    identity: UserIdentity = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    """Drop `prompt_block` into any future LLM system prompt."""
    state = await load_state(db, identity.id)
    return compile_llm_context(state, include_sensitive=False)


@router.post("/rank")
async def rank(
    payload: RankRequest,
    identity: UserIdentity = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    state = await load_state(db, identity.id)
    return {"items": rank_candidates(state, payload.candidates)}


@router.delete("/memory")
async def forget(
    identity: UserIdentity = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    ok = await reset_state(db, identity.id)
    return {"ok": ok}
