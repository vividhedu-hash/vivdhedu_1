"""
Admissions Portfolio Router — /api/v2/admissions
Exposes the Caliber-Calibrated Admissions Portfolio Engine (PRD Section 09).
"""
import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field

from ml.admissions_engine import admissions_portfolio_engine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admissions", tags=["Admissions Portfolio"])


class AdmissionsEvaluateRequest(BaseModel):
    student_rank: float = Field(..., gt=0, description="Expected or actual exam rank")
    exam_name: str = Field("JEE Main", description="Standardized test name: JEE Main, JEE Advanced, NEET, BITSAT, etc.")
    category: str = Field("General", description="Reservation category: General, EWS, OBC-NCL, SC, ST, PwD")
    home_state: str = Field("Maharashtra", description="Student's home state domicile")
    max_budget_inr: float = Field(2000000.0, description="Maximum 4-year household educational budget")
    preferred_field: Optional[str] = Field(None, description="Degree field filter (e.g. engineering-cs)")


@router.post("/portfolio")
async def evaluate_admissions_portfolio(req: AdmissionsEvaluateRequest) -> Dict[str, Any]:
    """
    Computes Cutoff Delta Z-Scores and Normal CDF probabilities (Eq 9.1).
    Returns 4-tier application matrix: Reach, Target, Safety, Hidden Gem, Pruned.
    """
    try:
        portfolio = admissions_portfolio_engine.generate_admissions_portfolio(
            student_rank=req.student_rank,
            exam_name=req.exam_name,
            category=req.category,
            home_state=req.home_state,
            max_budget_inr=req.max_budget_inr,
            preferred_field=req.preferred_field,
        )
        return portfolio
    except Exception as e:
        logger.error(f"Error computing admissions portfolio: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calculate-probability")
async def calculate_probability(
    student_rank: float = Query(..., gt=0),
    base_closing_rank: float = Query(..., gt=0),
    exam_name: str = Query("JEE Main"),
    category: str = Query("General"),
    is_home_state: bool = Query(False),
) -> Dict[str, Any]:
    """
    Quick endpoint for Cutoff Delta Z-score and Normal CDF admission probability.
    """
    z, prob = admissions_portfolio_engine.calculate_admission_probability(
        expected_rank=student_rank,
        base_closing_rank=base_closing_rank,
        category=category,
        is_home_state=is_home_state,
        exam_name=exam_name,
    )
    return {
        "student_rank": student_rank,
        "base_closing_rank": base_closing_rank,
        "z_score": z,
        "admission_probability_pct": round(prob * 100.0, 1),
        "status": "Safety" if z > 1.5 else ("Target" if z >= -0.5 else ("Reach" if z >= -1.5 else "Aspirational / Pruned")),
    }
