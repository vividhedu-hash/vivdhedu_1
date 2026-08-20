"""
/api/v1/ai — Router for AI Advisor & Psychometrics endpoints
- POST /ai/advisor       — Google Gemini 1.5 Flash interactive career counseling
- POST /ai/psychometrics — Hugging Face sentiment & Cronbach's alpha scoring
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from backend.services.gemini_advisor import gemini_advisor_service
from backend.services.adaptive_cat import adaptive_cat_service
from backend.services.psychometrics import psychometrics_service

router = APIRouter(prefix="/ai", tags=["AI Advisor & Psychometrics"])


class AdvisorRequest(BaseModel):
    total_budget: float = Field(10.0, description="Total budget in INR Lakhs")
    target_field: str = Field("engineering-cs", description="Target field of study")
    risk_tolerance: str = Field("medium", description="Risk tolerance: low, medium, high")
    preferred_cities: List[str] = Field(default_factory=lambda: ["Bengaluru", "NCR"])
    top_programs: List[Dict[str, Any]] = Field(default_factory=list)


class PsychometricsRequest(BaseModel):
    college_id: Optional[str] = None
    reviews: List[str] = Field(..., min_items=1, description="List of raw student/alumni review texts")


class CATItemRequest(BaseModel):
    student_profile: Dict[str, Any] = Field(default_factory=dict)
    response_history: List[Dict[str, Any]] = Field(default_factory=list)


@router.post("/advisor")
async def consult_ai_advisor(payload: AdvisorRequest):
    """Consult Google Gemini AI Advisor for personalized degree ROI & career strategy."""
    student_profile = {
        "total_budget": payload.total_budget,
        "target_field": payload.target_field,
        "risk_tolerance": payload.risk_tolerance,
        "preferred_cities": payload.preferred_cities,
    }
    return await gemini_advisor_service.generate_career_advice(
        student_profile=student_profile,
        top_programs=payload.top_programs,
    )


@router.post("/psychometrics")
async def evaluate_psychometrics(payload: PsychometricsRequest):
    """Run Hugging Face sentiment analysis & Cronbach's alpha psychometrics on review texts."""
    return await psychometrics_service.analyze_student_reviews(reviews=payload.reviews)


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

    # If converged or reaching end, check if generative micro-dilemma is desired
    if is_converged and len(answered_ids) < 6:
        # Generate 1 personalized micro-dilemma from Gemini
        dilemma = await gemini_advisor_service.generate_micro_dilemma_scenario(
            payload.student_profile, traits
        )
        return {
            "traits": traits,
            "next_item": dilemma,
            "is_converged": False,
            "items_completed": len(answered_ids),
        }

    return {
        "traits": traits,
        "next_item": next_item,
        "is_converged": is_converged or (next_item is None),
        "items_completed": len(answered_ids),
    }


@router.post("/evaluate-traits")
async def evaluate_traits(payload: CATItemRequest):
    """Computes final 2PL IRT psychometric trait report and risk/value archetype."""
    traits = adaptive_cat_service.compute_trait_estimates(payload.response_history)
    
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

    return {
        "traits": traits,
        "archetype": archetype,
        "confidence_score": round(min(0.98, 0.60 + (len(payload.response_history) * 0.06)), 2),
    }

