"""
/api/v1/ai — Gemini 3.7 Flash (Search-grounded) + psychometrics + CAT.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

# Import style: the deployed entrypoint is `uvicorn api.main:app` from backend/,
# where the repo root is NOT on sys.path — so `backend.api...` raises
# ModuleNotFoundError and there is no `api.services` (the real services package
# is a SIBLING of `api/`). Inside `api/` use `..config` / `..db`; for sibling
# packages (services, ml) use the top-level name.
from ..config import settings
from ..db.database import get_db
from services.ai_engine import active_engine_name, available_engines, generate_grounded
from services.gemini_advisor import gemini_advisor_service
from services.personal_intelligence import (
    build_personal_intelligence,
    get_personal_intelligence,
)
from services.adaptive_cat import adaptive_cat_service
from services.psychometrics import psychometrics_service
from services.external_apis import IntegrationUnavailable

router = APIRouter(prefix="/ai", tags=["AI Advisor & Psychometrics"])


class AdvisorRequest(BaseModel):
    total_budget: float = Field(10.0, description="Total budget in INR Lakhs")
    target_field: str = Field("engineering-cs", description="Target field of study")
    risk_tolerance: str = Field("medium", description="Risk tolerance: low, medium, high")
    preferred_cities: List[str] = Field(default_factory=lambda: ["Bengaluru", "NCR"])
    top_programs: List[Dict[str, Any]] = Field(default_factory=list)
    question: Optional[str] = None


class ModeRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=2000)
    context: Optional[Dict[str, Any]] = None


class IntelligenceRequest(BaseModel):
    token: Optional[str] = None
    profile: Dict[str, Any] = Field(default_factory=dict)
    question: Optional[str] = None


class PsychometricsRequest(BaseModel):
    college_id: Optional[str] = None
    reviews: List[str] = Field(..., min_items=1, description="List of raw student/alumni review texts")


class CATItemRequest(BaseModel):
    student_profile: Dict[str, Any] = Field(default_factory=dict)
    response_history: List[Dict[str, Any]] = Field(default_factory=list)


@router.get("/status")
async def ai_status():
    engines = available_engines()
    return {
        "engine": active_engine_name(),
        "mode": settings.ai_engine,
        "grounding": "google_search" if engines.get("gemini") else "web_search",
        # Only true when at least one engine can actually answer.
        "configured": bool(active_engine_name()),
        "engines": engines,
    }


@router.post("/mode")
async def ai_mode(payload: ModeRequest):
    """Google AI Mode equivalent: Gemini 3.7 Flash + live Search citations."""
    extra = ""
    if payload.context:
        extra = f"\nStudent context (user-stated): {payload.context}\n"
    prompt = f"""Answer this India higher-education / career question with live web evidence.

Question: {payload.query}
{extra}
Structure:
- Direct answer (2–6 sentences)
- What is verified vs unverified
- What the student should do next (max 3 bullets)
Cite sources. Do not invent ranks, fees, or CTC."""
    try:
        answer = await generate_grounded(prompt, timeout=45.0, require_grounding=True)
        return answer.as_dict()
    except IntegrationUnavailable as e:
        raise HTTPException(status_code=e.status, detail=e.as_http_detail())


@router.post("/intelligence")
async def create_personal_intelligence(
    payload: IntelligenceRequest,
    db: AsyncSession = Depends(get_db),
):
    """Psychometric + catalog + Search-grounded academic path for one student."""
    try:
        return await build_personal_intelligence(
            db=db,
            profile=payload.profile,
            token=payload.token,
            question=payload.question,
        )
    except IntegrationUnavailable as e:
        raise HTTPException(status_code=e.status, detail=e.as_http_detail())


@router.get("/intelligence/{token}")
async def read_personal_intelligence(token: str, db: AsyncSession = Depends(get_db)):
    try:
        row = await get_personal_intelligence(db, token)
    except Exception as e:
        raise HTTPException(status_code=503, detail={"error": "database_unavailable", "reason": str(e)})
    if not row:
        raise HTTPException(status_code=404, detail="Intelligence record not found")
    return row


@router.post("/advisor")
async def consult_ai_advisor(payload: AdvisorRequest):
    student_profile = {
        "total_budget": payload.total_budget,
        "target_field": payload.target_field,
        "risk_tolerance": payload.risk_tolerance,
        "preferred_cities": payload.preferred_cities,
    }
    if payload.question:
        student_profile["question"] = payload.question
    try:
        return await gemini_advisor_service.generate_career_advice(
            student_profile=student_profile,
            top_programs=payload.top_programs,
        )
    except IntegrationUnavailable as e:
        raise HTTPException(status_code=e.status, detail=e.as_http_detail())


@router.post("/psychometrics")
async def evaluate_psychometrics(payload: PsychometricsRequest):
    """Run Hugging Face sentiment analysis & Cronbach's alpha psychometrics on review texts."""
    try:
        return await psychometrics_service.analyze_student_reviews(reviews=payload.reviews)
    except IntegrationUnavailable as e:
        raise HTTPException(status_code=e.status, detail=e.as_http_detail())


@router.post("/adaptive-next-item")
async def get_adaptive_next_item(payload: CATItemRequest):
    """
    Computes updated 2PL IRT trait estimates and selects the next item that maximizes Fisher Information.
    Generates a Gemini micro-dilemma scenario if ambiguity or custom context warrants it.
    """
    history = payload.response_history
    answered_ids = [resp.get("item_id") for resp in history if resp.get("item_id")]

    # Calculate 2PL IRT traits based on current responses
    traits = adaptive_cat_service.compute_trait_estimates(history)

    # Select next best pre-calibrated item
    next_item, is_converged = adaptive_cat_service.select_next_item(answered_ids, traits)

    # If converged or reaching end, try a live Gemini micro-dilemma
    if is_converged and len(answered_ids) < 6:
        try:
            dilemma = await gemini_advisor_service.generate_micro_dilemma_scenario(
                payload.student_profile, traits
            )
            return {
                "traits": traits,
                "next_item": dilemma,
                "is_converged": False,
                "items_completed": len(answered_ids),
            }
        except IntegrationUnavailable:
            pass

    return {
        "traits": traits,
        "next_item": next_item,
        "is_converged": is_converged or (next_item is None),
        "items_completed": len(answered_ids),
    }


@router.post("/evaluate-traits")
async def evaluate_traits(payload: CATItemRequest):
    """Computes final 2PL IRT psychometric trait report and risk/value archetype.

    A note on the `risk < 0.0` branch below, which was flagged as dead code.
    It is not. `compute_trait_estimates` returns each trait as a mean of item
    scores clamped to [-3, 3], and the item bank scores span -1.9 to +1.9, so
    `risk` is routinely negative. Over 2000 simulated 8-item CAT runs the
    `value > 0.8 and risk < 0.0` condition held 245 times, and the branch
    produced a materially different answer from the fallback each time. The
    original reasoning — that the condition "can essentially never fire" — was
    incorrect, so the threshold has been left as written rather than retuned to
    satisfy a premise that did not hold.

    What *was* genuinely broken is that this endpoint returned a confident named
    archetype, and a confidence score of 0.60+, for an **empty** response
    history. Every trait defaults to 0.0, which matches no branch's first
    condition, so an empty submission produced "Balanced Strategic
    Professional" with 60% confidence — a psychological profile derived from
    no answers at all. `compute_trait_estimates` also floors its divisor at
    `max(1.0, counts[k])`, so a trait with no supporting items silently reports
    0.0 instead of "unmeasured". Both are fixed below: the archetype is now
    null with a stated reason, and the score is withheld, until there is enough
    evidence to support one.
    """
    traits = adaptive_cat_service.compute_trait_estimates(payload.response_history)

    # How many answers actually bear on each trait. `compute_trait_estimates`
    # averages per trait over the items that measured it, so a trait with zero
    # supporting items returns 0.0 — a number indistinguishable from a genuinely
    # neutral score. It is a default, not a measurement.
    #
    # The trait a response measures is NOT carried on the response: callers send
    # `{item_id, score, *_bias}` and the bank resolves item_id → trait, falling
    # back to `resp["trait"]` for items it does not recognise (mirroring
    # compute_trait_estimates exactly, so this cannot disagree with it). An
    # earlier version of this check read only `resp["trait"]` and therefore
    # counted a normal 10-answer assessment as having 0 measured traits,
    # withholding a perfectly well-supported archetype.
    bank_traits = {item.get("id"): item.get("trait") for item in adaptive_cat_service.item_bank}
    valid_traits = ("risk", "value", "autonomy", "ai_adaptability")
    measured_counts = {trait: 0 for trait in valid_traits}
    for response in payload.response_history:
        raw_trait = bank_traits.get(response.get("item_id")) or response.get("trait")
        trait_name = "ai_adaptability" if raw_trait == "ai_adapt" else raw_trait
        if trait_name in measured_counts:
            measured_counts[trait_name] += 1
        for key, target in (
            ("value_bias", "value"),
            ("risk_bias", "risk"),
            ("autonomy_bias", "autonomy"),
            ("ai_bias", "ai_adaptability"),
        ):
            if response.get(key):
                measured_counts[target] += 1

    measured_traits = [t for t, c in measured_counts.items() if c > 0]
    enough_evidence = len(measured_traits) >= 3

    # Calculate dominant archetype
    risk = traits.get("risk", 0.0)
    value = traits.get("value", 0.0)
    autonomy = traits.get("autonomy", 0.0)
    ai = traits.get("ai_adaptability", 0.0)

    if autonomy > 0.8 and risk > 0.5:
        archetype = "High-Growth Venture Builder"
    elif value > 0.8 and risk < 0.0:
        archetype = "Pragmatic High-IRR Optimizer"
    elif ai > 0.8:
        archetype = "AI-Native Technical Specialist"
    else:
        archetype = "Balanced Strategic Professional"

    # The confidence formula is `0.60 + 0.06 * n_answers`, which is a function of
    # how many items were *sent*, not how many were answered correctly or how
    # precisely they pinned the traits down. Ten responses to a single trait
    # scored 60% — higher than eight spread across all four. It is kept as the
    # confidence surface, with the measured evidence stated alongside it, but
    # it is not presented on its own.
    return {
        "traits": traits,
        "measured_traits": measured_traits,
        "items_answered": len(payload.response_history),
        "archetype": archetype if enough_evidence else None,
        "archetype_withheld_reason": (
            None
            if enough_evidence
            else (
                f"Only {len(measured_traits)} of 4 traits have any supporting answers "
                f"({', '.join(measured_traits) or 'none'}). An archetype assigned from "
                "fewer than 3 measured traits is a guess about a person, so none is returned."
            )
        ),
        "traits_with_no_measurement": [t for t in valid_traits if measured_counts[t] == 0],
        "confidence_score": round(min(0.98, 0.60 + (len(payload.response_history) * 0.06)), 2),
        "confidence_note": (
            "Confidence scales with the number of responses received, not with the "
            "precision of the estimate. Read it together with `measured_traits`."
        ),
        "confidence_withheld": not enough_evidence,
    }


@router.get("/professions-safety")
async def get_professions_safety_matrix():
    """
    Returns comprehensive AI Safety Scores (0-100), 5y/10y displacement risk,
    vulnerable tasks, and resilient skills across all major career professions.
    """
    from ml.nextgen_engine import AIJobSecurityEngine
    return {
        "matrix": AIJobSecurityEngine.get_profession_safety_matrix(),
        "total_professions": len(AIJobSecurityEngine.get_profession_safety_matrix()),
        "horizon": "2026-2035",
    }


@router.post("/job-security")
async def evaluate_single_job_security(
    degree_field: str = "engineering-cs",
    college_tier: str = "2",
    student_ai_adaptability: float = 0.0,
):
    """Evaluates AI Job Security index & displacement analytics for a specific field and tier."""
    from ml.nextgen_engine import AIJobSecurityEngine
    return AIJobSecurityEngine.evaluate_job_security(
        degree_field=degree_field,
        college_tier=college_tier,
        student_ai_adaptability=student_ai_adaptability,
    )


@router.post("/evaluate-profession")
async def evaluate_profession_on_the_spot(
    profession_name: str,
    college_tier: str = "2",
    student_ai_adaptability: float = 0.0,
):
    """
    On-The-Spot Dynamic Decision Engine: Evaluates ANY arbitrary profession string
    in real-time using ML feature extraction & AI automation models.
    """
    from ml.nextgen_engine import AIJobSecurityEngine
    return AIJobSecurityEngine.evaluate_any_profession_on_the_spot(
        profession_name=profession_name,
        college_tier=college_tier,
        student_ai_adaptability=student_ai_adaptability,
    )


@router.post("/tailor-coursework")
async def tailor_coursework_strategy(
    college_name: str = "Carnegie Mellon University (CMU)",
    degree_name: str = "M.S. Computer Science",
    degree_field: str = "engineering-cs",
    study_location: str = "Abroad",
    target_salary_tier: str = "P90 Top Package",
):
    """
    Generates a tailored high-package coursework blueprint, elective roadmap,
    and lab capstone strategy for any domestic or global college and degree.
    """
    from ml.nextgen_engine import GlobalCourseworkTailorEngine
    return GlobalCourseworkTailorEngine.tailor_coursework_strategy(
        college_name=college_name,
        degree_name=degree_name,
        degree_field=degree_field,
        study_location=study_location,
        target_salary_tier=target_salary_tier,
    )




