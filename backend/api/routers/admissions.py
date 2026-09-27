"""
Admissions Portfolio Router — /api/v2/admissions

Cutoff rows and exam sigmas are read from `cutoffs` and `exam_rank_variability`
(migration 0006). The Python literal in admissions_engine.py is not consulted.
If those tables are missing or empty, the response says so.
"""
import logging
from decimal import Decimal
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from ml.admissions_engine import admissions_portfolio_engine

from ..db.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admissions", tags=["Admissions Portfolio"])

_LATEST_CUTOFFS = """
SELECT exam,
       college_name,
       program_name,
       field::text AS field,
       tier::text AS tier,
       state,
       closing_rank,
       total_cost_inr,
       roi_score,
       vintage_year,
       source_url,
       is_verified
FROM cutoffs
WHERE vintage_year = (SELECT MAX(vintage_year) FROM cutoffs)
"""


class AdmissionsEvaluateRequest(BaseModel):
    student_rank: float = Field(..., gt=0, description="Expected or actual exam rank")
    exam_name: str = Field("JEE Main")
    category: str = Field("General")
    home_state: str = Field("Maharashtra")
    max_budget_inr: float = Field(2000000.0)
    preferred_field: Optional[str] = None


def _num(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def _unavailable(reason: str) -> HTTPException:
    return HTTPException(
        status_code=503,
        detail={
            "error": "cutoff_data_unavailable",
            "message": reason,
        },
    )


async def _load_sigma(db: AsyncSession) -> Dict[str, float]:
    result = await db.execute(text("SELECT exam, rank_sigma FROM exam_rank_variability"))
    rows = result.mappings().all()
    return {str(row["exam"]): float(row["rank_sigma"]) for row in rows}


async def _load_programs(db: AsyncSession, exam: Optional[str] = None) -> List[Dict[str, Any]]:
    sql = _LATEST_CUTOFFS
    params: Dict[str, Any] = {}
    if exam:
        sql += " AND exam = :exam"
        params["exam"] = exam
    sql += " ORDER BY closing_rank ASC"
    result = await db.execute(text(sql), params)
    programs = []
    for row in result.mappings():
        programs.append({
            "college": row["college_name"],
            "degree": row["program_name"],
            "field": row["field"],
            "tier": row["tier"],
            "exam": row["exam"],
            "base_closing_rank": int(row["closing_rank"]),
            "state": row["state"],
            "total_cost_inr": _num(row["total_cost_inr"]),
            "roi_score": _num(row["roi_score"]),
            "vintage_year": int(row["vintage_year"]) if row["vintage_year"] is not None else None,
            "source_url": row["source_url"],
            "is_verified": bool(row["is_verified"]),
        })
    return programs


@router.post("/portfolio")
async def evaluate_admissions_portfolio(
    req: AdmissionsEvaluateRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    4-tier matrix from the cutoffs table. Unverified rows stay in the result
    and are marked is_verified false — they are not dropped and not relabelled
    as published cutoffs.
    """
    try:
        programs = await _load_programs(db)
        sigma = await _load_sigma(db)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("[Admissions] Cutoff load failed: %s", exc)
        raise _unavailable(
            "The cutoffs table could not be read. No portfolio was built from the old in-source list."
        ) from exc

    if not programs:
        raise _unavailable(
            "The cutoffs table has no rows. No portfolio was built from the old in-source list."
        )
    if not sigma:
        raise _unavailable(
            "exam_rank_variability has no rows, so a probability would use an unstated sigma. Nothing was computed."
        )

    portfolio = admissions_portfolio_engine.generate_admissions_portfolio(
        student_rank=req.student_rank,
        exam_name=req.exam_name,
        category=req.category,
        home_state=req.home_state,
        max_budget_inr=req.max_budget_inr,
        preferred_field=req.preferred_field,
        programs=programs,
        rank_variability=sigma,
    )
    verified = sum(1 for row in programs if row["is_verified"])
    portfolio["provenance"] = {
        "verified_rows": verified,
        "unverified_rows": len(programs) - verified,
        "note": (
            "is_verified is false on a row whose source URL has not been recorded. "
            "Treat that closing rank as imported, not as a published cutoff."
        ),
    }
    return portfolio


@router.get("/cutoffs")
async def list_cutoffs(
    db: AsyncSession = Depends(get_db),
    exam: Optional[str] = None,
    state: Optional[str] = None,
) -> Dict[str, Any]:
    """Public catalogue. is_verified and source_url are always present."""
    try:
        programs = await _load_programs(db, exam=exam)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("[Admissions] Cutoff list failed: %s", exc)
        raise _unavailable("The cutoffs table could not be read.") from exc

    if state:
        wanted = state.strip().lower()
        programs = [row for row in programs if str(row.get("state") or "").lower() == wanted]
    return {
        "data": programs,
        "total": len(programs),
        "verified": sum(1 for row in programs if row["is_verified"]),
    }


@router.get("/calculate-probability")
async def calculate_probability(
    student_rank: float = Query(..., gt=0),
    base_closing_rank: float = Query(..., gt=0),
    exam_name: str = Query("JEE Main"),
    category: str = Query("General"),
    is_home_state: bool = Query(False),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Z-score for one closing rank. Sigma is the database value for that exam."""
    try:
        sigma = await _load_sigma(db)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("[Admissions] Sigma load failed: %s", exc)
        raise _unavailable("exam_rank_variability could not be read, so no probability was computed.") from exc
    if exam_name not in sigma and "Default" not in sigma:
        raise _unavailable(f"No rank sigma is stored for {exam_name}.")

    z, prob = admissions_portfolio_engine.calculate_admission_probability(
        expected_rank=student_rank,
        base_closing_rank=base_closing_rank,
        category=category,
        is_home_state=is_home_state,
        exam_name=exam_name,
        rank_variability=sigma,
    )
    return {
        "student_rank": student_rank,
        "base_closing_rank": base_closing_rank,
        "z_score": z,
        "admission_probability_pct": round(prob * 100.0, 1),
        "sigma_source": "exam_rank_variability",
        "status": "Safety" if z > 1.5 else ("Target" if z >= -0.5 else ("Reach" if z >= -1.5 else "Aspirational / Pruned")),
    }
