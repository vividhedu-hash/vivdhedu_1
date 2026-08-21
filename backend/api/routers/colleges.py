"""
/api/colleges — programs, ROI index, compare, CSV export.
All responses come from Postgres. Empty catalog is empty — never invented.
"""
from datetime import datetime
import csv
import io
from typing import Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from ..db.database import get_db
from ..config import settings

try:
    from ml.nextgen_engine import AIJobSecurityEngine
    from ml.roi_computer import compute_roi
except ImportError:
    from backend.ml.nextgen_engine import AIJobSecurityEngine
    from backend.ml.roi_computer import compute_roi

router = APIRouter()

PROGRAM_SELECT = """
    SELECT
        p.id AS program_id,
        c.id AS college_id, c.short_name AS college_short_name,
        c.full_name AS college_full_name, c.state, c.city, c.tier,
        c.college_type, c.nirf_rank, c.naac_grade, c.established_year,
        d.id AS degree_id, d.short_name AS degree_short_name,
        d.full_name AS degree_full_name, d.field AS degree_field,
        d.level AS degree_level, d.duration_years,
        p.annual_tuition_inr, p.total_seats,
        r.composite_score, r.financial_roi_pct, r.risk_score,
        r.optionality_score, r.mobility_score, r.satisfaction_score,
        r.network_score, r.ci_low, r.ci_high, r.confidence_level, r.model_version,
        ri.ai_automation_prob, ri.salary_volatility, ri.industry_cyclicality,
        ri.credential_inflation, ri.geographic_concentration, ri.regulatory_risk,
        ri.physical_health_risk, ri.work_life_quality, ri.ai_risk_label,
        pl.placement_rate_pct, pl.highest_salary_inr, pl.median_salary_inr,
        pl.average_salary_inr, pl.companies_visited, pl.academic_year,
        cd.total_tuition_inr, cd.hostel_living_inr, cd.exam_prep_costs_inr,
        cd.opportunity_cost_inr, cd.total_cost_of_degree
    FROM programs p
    JOIN colleges c ON c.id = p.college_id
    JOIN degrees d ON d.id = p.degree_id
    LEFT JOIN roi_scores r ON r.program_id = p.id AND r.is_current = TRUE
    LEFT JOIN risk_indicators ri ON ri.program_id = p.id AND ri.is_current = TRUE
    LEFT JOIN placement_data pl ON pl.program_id = p.id AND pl.is_current = TRUE
    LEFT JOIN cost_data cd ON cd.program_id = p.id AND cd.is_current = TRUE
"""


def _program_filters(field, state, tier, ai_risk, q) -> Tuple[str, dict]:
    filters = ["p.is_active = TRUE"]
    params: dict = {}
    if field:
        filters.append("d.field = :field")
        params["field"] = field
    if state:
        filters.append("c.state = :state")
        params["state"] = state
    if tier:
        filters.append("c.tier = :tier")
        params["tier"] = tier
    if ai_risk:
        filters.append("ri.ai_risk_label = :ai_risk")
        params["ai_risk"] = ai_risk
    if q:
        filters.append("(c.full_name ILIKE :q OR d.full_name ILIKE :q OR c.short_name ILIKE :q)")
        params["q"] = f"%{q}%"
    return " AND ".join(filters), params


def _build_program_item(row: dict) -> dict:
    return {
        "id": str(row.get("program_id", "")),
        "college": {
            "id": str(row.get("college_id", "")),
            "shortName": row.get("college_short_name", ""),
            "name": row.get("college_full_name", ""),
            "state": row.get("state", ""),
            "city": row.get("city", ""),
            "tier": int(row.get("tier", 2)),
            "type": row.get("college_type", "private"),
            "nirfRank": row.get("nirf_rank"),
        },
        "degree": {
            "id": str(row.get("degree_id", "")),
            "shortName": row.get("degree_short_name", ""),
            "name": row.get("degree_full_name", ""),
            "field": row.get("degree_field", ""),
            "durationYears": float(row.get("duration_years", 4)),
            "level": row.get("degree_level", "UG"),
        },
        "roi": {
            "compositeScore": float(row.get("composite_score") or 0),
            "financialRoiPct": float(row.get("financial_roi_pct") or 0),
            "riskScore": float(row.get("risk_score") or 0),
            "confidenceIntervalLow": float(row.get("ci_low") or 0),
            "confidenceIntervalHigh": float(row.get("ci_high") or 0),
            "confidenceLevel": row.get("confidence_level") or "Medium",
            "modelVersion": row.get("model_version") or settings.current_model_version,
        },
        "meta": {
            "aiRiskLabel": row.get("ai_risk_label") or "Medium",
            "dataFreshnessDays": 0,
        },
        "placement": {
            "rate": float(row.get("placement_rate_pct") or 0),
            "medianSalaryInr": row.get("median_salary_inr"),
        },
    }


def _rating_tier(score: float) -> str:
    if score >= 88:
        return "AAA+ Elite"
    if score >= 75:
        return "AA High Yield"
    if score >= 62:
        return "A Moderate Yield"
    if score >= 48:
        return "BBB Speculative"
    return "C Debt Risk"


async def _salary_traj(db: AsyncSession, program_id: str) -> dict:
    result = await db.execute(text("""
        SELECT year_number, p25_inr, p50_inr, p75_inr, p10_inr, p90_inr
        FROM salary_trajectories
        WHERE program_id = :pid AND is_current = TRUE
        ORDER BY year_number
    """), {"pid": program_id})
    traj = {}
    for r in result:
        traj[f"y{r.year_number}"] = {
            "p10": r.p10_inr,
            "p25": r.p25_inr,
            "p50": r.p50_inr,
            "p75": r.p75_inr,
            "p90": r.p90_inr,
        }
    return traj


def _icri_entry(row: dict, traj: dict) -> dict:
    program = {
        "degree_field": row.get("degree_field"),
        "tier": str(row.get("tier")),
        "college_type": row.get("college_type"),
        "state": row.get("state"),
        "nirf_rank": row.get("nirf_rank"),
        "total_cost_of_degree_inr": row.get("total_cost_of_degree") or row.get("annual_tuition_inr"),
        "duration_years": row.get("duration_years"),
        "placement_rate_pct": (row.get("placement_rate_pct") or 0) / 100.0
            if (row.get("placement_rate_pct") or 0) > 1
            else (row.get("placement_rate_pct") or 0),
        "ai_automation_prob": row.get("ai_automation_prob"),
        "salary_volatility": row.get("salary_volatility"),
        "industry_cyclicality": row.get("industry_cyclicality"),
        "credential_inflation": row.get("credential_inflation"),
        "geographic_concentration": row.get("geographic_concentration"),
        "work_life_quality": row.get("work_life_quality"),
    }
    roi_data = compute_roi(program, traj) if traj else None
    ai_sec = AIJobSecurityEngine.evaluate_job_security(
        row.get("degree_field") or "engineering-cs",
        str(row.get("tier") or "2"),
    )

    stored = float(row.get("composite_score") or 0)
    if roi_data:
        icri_raw = (
            0.35 * min(100.0, roi_data["financial_roi_pct"] / 3.5) +
            0.25 * min(100.0, ((row.get("median_salary_inr") or 0) / 2_500_000.0) * 100.0) +
            0.20 * ai_sec["job_security_score"] +
            0.10 * (100.0 - roi_data["monte_carlo_analytics"]["loan_analytics"]["loan_stress_default_risk_pct"]) +
            0.10 * (100.0 if str(row.get("tier")) == "1" else 75.0)
        )
        icri_score = round(max(0.0, min(99.9, icri_raw)), 1)
        financial_roi = roi_data["financial_roi_pct"]
        breakeven_months = roi_data["monte_carlo_analytics"]["breakeven_timeline"]["median_months"]
        breakeven_years = roi_data["monte_carlo_analytics"]["breakeven_timeline"]["median_years"]
        npv = roi_data["monte_carlo_analytics"]["npv_net_earnings_inr"]
        loan_risk = roi_data["monte_carlo_analytics"]["loan_analytics"]["loan_stress_default_risk_pct"]
    else:
        icri_score = round(stored, 1)
        financial_roi = float(row.get("financial_roi_pct") or 0)
        breakeven_months = None
        breakeven_years = None
        npv = None
        loan_risk = None

    placement = row.get("placement_rate_pct") or 0
    placement_pct = round(placement * 100, 1) if placement <= 1 else round(float(placement), 1)

    return {
        "college_id": str(row["program_id"]),
        "college_name": row["college_full_name"],
        "college_short": row["college_short_name"],
        "degree_name": row["degree_full_name"],
        "degree_field": row["degree_field"],
        "state": row["state"],
        "tier": str(row["tier"]),
        "icri_score": icri_score,
        "rating_tier": _rating_tier(icri_score),
        "financial_roi_pct": financial_roi,
        "breakeven_months": breakeven_months,
        "breakeven_years": breakeven_years,
        "npv_net_earnings_20y_inr": npv,
        "total_cost_inr": row.get("total_cost_of_degree"),
        "placement_rate_pct": placement_pct,
        "median_salary_y1_inr": row.get("median_salary_inr"),
        "ai_job_security_score": ai_sec["job_security_score"],
        "ai_risk_label": ai_sec["security_label"],
        "loan_default_risk_pct": loan_risk,
    }


@router.get("/colleges")
async def list_colleges(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    field: Optional[str] = None,
    state: Optional[str] = None,
    tier: Optional[str] = None,
    ai_risk: Optional[str] = None,
    q: Optional[str] = None,
    sort_by: str = "composite_score",
    sort_dir: str = "desc",
):
    where_clause, params = _program_filters(field, state, tier, ai_risk, q)
    sort_col = {
        "composite_score": "r.composite_score",
        "financial_roi": "r.financial_roi_pct",
        "placement_rate": "pl.placement_rate_pct",
        "risk_score": "r.risk_score",
    }.get(sort_by, "r.composite_score")
    sort_direction = "DESC" if sort_dir == "desc" else "ASC"

    try:
        total_result = await db.execute(text(f"""
            SELECT COUNT(*) FROM programs p
            JOIN colleges c ON c.id = p.college_id
            JOIN degrees d ON d.id = p.degree_id
            LEFT JOIN roi_scores r ON r.program_id = p.id AND r.is_current = TRUE
            LEFT JOIN risk_indicators ri ON ri.program_id = p.id AND ri.is_current = TRUE
            LEFT JOIN placement_data pl ON pl.program_id = p.id AND pl.is_current = TRUE
            WHERE {where_clause}
        """), params)
        total = total_result.scalar() or 0

        params = {**params, "limit": per_page, "offset": (page - 1) * per_page}
        rows = await db.execute(text(f"""
            {PROGRAM_SELECT}
            WHERE {where_clause}
            ORDER BY {sort_col} {sort_direction} NULLS LAST
            LIMIT :limit OFFSET :offset
        """), params)
        programs = [_build_program_item(dict(row._mapping)) for row in rows]
        return {
            "data": programs,
            "total": total,
            "page": page,
            "per_page": per_page,
            "model_version": settings.current_model_version,
            "generated_at": datetime.utcnow().isoformat(),
            "_source": "database",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail={"error": "database_unavailable", "reason": str(e)})


@router.get("/colleges/roi-index")
async def get_college_roi_index(
    db: AsyncSession = Depends(get_db),
    field: Optional[str] = None,
    tier: Optional[str] = None,
    state: Optional[str] = None,
    q: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    where_clause, params = _program_filters(field, state, tier, None, q)
    try:
        rows = await db.execute(text(f"""
            {PROGRAM_SELECT}
            WHERE {where_clause}
            ORDER BY r.composite_score DESC NULLS LAST
        """), params)
        index_results = []
        for row in rows:
            mapping = dict(row._mapping)
            traj = await _salary_traj(db, str(mapping["program_id"]))
            entry = _icri_entry(mapping, traj)
            index_results.append(entry)

        index_results.sort(key=lambda x: x["icri_score"], reverse=True)
        for rank, item in enumerate(index_results, start=1):
            item["rank"] = rank

        start = (page - 1) * per_page
        return {
            "index_name": "IndiaLens College ROI Index (ICRI)",
            "version": settings.current_model_version,
            "total_colleges_evaluated": len(index_results),
            "page": page,
            "per_page": per_page,
            "_source": "database",
            "methodology": {
                "financial_irr_npv_weight": "35%",
                "salary_liquidity_weight": "25%",
                "ai_job_security_weight": "20%",
                "loan_default_safety_weight": "10%",
                "network_brand_weight": "10%",
            },
            "leaderboard": index_results[start:start + per_page],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail={"error": "database_unavailable", "reason": str(e)})


@router.get("/colleges/compare")
async def compare_colleges(
    ids: str = Query(..., description="Comma-separated program UUIDs"),
    db: AsyncSession = Depends(get_db),
):
    program_ids = [i.strip() for i in ids.split(",") if i.strip()]
    if not program_ids:
        raise HTTPException(status_code=400, detail="ids required")
    if len(program_ids) > 6:
        raise HTTPException(status_code=400, detail="Compare at most 6 programs")

    try:
        placeholders = ", ".join(f":id{i}" for i in range(len(program_ids)))
        params = {f"id{i}": pid for i, pid in enumerate(program_ids)}
        rows = await db.execute(text(f"""
            {PROGRAM_SELECT}
            WHERE p.id IN ({placeholders})
        """), params)
        found = {str(r.program_id): _build_program_item(dict(r._mapping)) for r in rows}
        missing = [pid for pid in program_ids if pid not in found]
        if missing:
            raise HTTPException(status_code=404, detail={"error": "program_not_found", "ids": missing})
        return {
            "data": [found[pid] for pid in program_ids],
            "_source": "database",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail={"error": "database_unavailable", "reason": str(e)})


@router.get("/colleges/export/csv")
async def export_colleges_csv(
    db: AsyncSession = Depends(get_db),
    field: Optional[str] = None,
    state: Optional[str] = None,
):
    where_clause, params = _program_filters(field, state, None, None, None)
    try:
        rows = await db.execute(text(f"""
            {PROGRAM_SELECT}
            WHERE {where_clause}
            ORDER BY r.composite_score DESC NULLS LAST
        """), params)

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Program ID", "College", "Degree", "State", "Tier",
            "Composite Score", "Financial ROI %", "AI Risk", "Placement Rate %",
            "Median Salary Y1 (INR)", "Model Version",
        ])
        for row in rows:
            r = dict(row._mapping)
            writer.writerow([
                r.get("program_id"),
                r.get("college_full_name"),
                r.get("degree_full_name"),
                r.get("state"),
                r.get("tier"),
                r.get("composite_score"),
                r.get("financial_roi_pct"),
                r.get("ai_risk_label"),
                r.get("placement_rate_pct"),
                r.get("median_salary_inr"),
                r.get("model_version") or settings.current_model_version,
            ])

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=indialens-export.csv"},
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail={"error": "database_unavailable", "reason": str(e)})


@router.get("/colleges/{program_id}")
async def get_college_detail(
    program_id: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(text(f"""
            {PROGRAM_SELECT}
            WHERE p.id = :program_id
        """), {"program_id": program_id})
        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Program not found")

        row_dict = dict(row._mapping)
        traj = await _salary_traj(db, program_id)

        def sal_band(year: int) -> dict:
            band = traj.get(f"y{year}") or {}
            return {
                "p25": band.get("p25") or 0,
                "p50": band.get("p50") or 0,
                "p75": band.get("p75") or 0,
            }

        return {
            "id": program_id,
            "college": {
                "id": str(row_dict["college_id"]),
                "shortName": row_dict["college_short_name"],
                "name": row_dict["college_full_name"],
                "state": row_dict["state"],
                "city": row_dict["city"],
                "tier": int(row_dict["tier"]),
                "type": row_dict["college_type"],
                "nirfRank": row_dict["nirf_rank"],
                "naacGrade": row_dict["naac_grade"],
            },
            "degree": {
                "id": str(row_dict["degree_id"]),
                "shortName": row_dict["degree_short_name"],
                "name": row_dict["degree_full_name"],
                "field": row_dict["degree_field"],
                "durationYears": float(row_dict["duration_years"]),
                "level": row_dict["degree_level"],
            },
            "roi": {
                "compositeScore": float(row_dict["composite_score"] or 0),
                "financialRoiPct": float(row_dict["financial_roi_pct"] or 0),
                "riskScore": float(row_dict["risk_score"] or 0),
                "optionalityScore": float(row_dict["optionality_score"] or 0),
                "mobilityScore": float(row_dict["mobility_score"] or 0),
                "satisfactionScore": float(row_dict["satisfaction_score"] or 0),
                "networkScore": float(row_dict["network_score"] or 0),
                "confidenceIntervalLow": float(row_dict["ci_low"] or 0),
                "confidenceIntervalHigh": float(row_dict["ci_high"] or 0),
                "confidenceLevel": row_dict["confidence_level"] or "Medium",
                "modelVersion": row_dict["model_version"] or settings.current_model_version,
            },
            "salary": {
                "year1": sal_band(1),
                "year5": sal_band(5),
                "year10": sal_band(10),
                "year20": sal_band(20),
            },
            "risk": {
                "aiAutomationProbability": float(row_dict["ai_automation_prob"] or 0),
                "salaryVolatility": float(row_dict["salary_volatility"] or 0),
                "industryCyclicality": float(row_dict["industry_cyclicality"] or 0),
                "credentialInflation": float(row_dict["credential_inflation"] or 0),
                "geographicConcentration": float(row_dict["geographic_concentration"] or 0),
                "regulatoryRisk": float(row_dict["regulatory_risk"] or 0),
                "physicalHealthRisk": float(row_dict["physical_health_risk"] or 0),
                "workLifeQuality": float(row_dict["work_life_quality"] or 0),
                "aiRiskLabel": row_dict["ai_risk_label"] or "Medium",
            },
            "placement": {
                "rate": float(row_dict["placement_rate_pct"] or 0),
                "highestSalaryInr": row_dict["highest_salary_inr"],
                "medianSalaryInr": row_dict["median_salary_inr"],
                "companiesVisited": row_dict["companies_visited"],
                "academicYear": row_dict["academic_year"],
            },
            "costs": {
                "totalTuitionInr": row_dict["total_tuition_inr"],
                "hostelLivingInr": row_dict["hostel_living_inr"],
                "examPrepCostsInr": row_dict["exam_prep_costs_inr"],
                "opportunityCostInr": row_dict["opportunity_cost_inr"],
                "totalCostOfDegreeInr": row_dict["total_cost_of_degree"],
            },
            "meta": {
                "modelVersion": row_dict["model_version"] or settings.current_model_version,
                "dataFreshnessDays": 0,
            },
            "_source": "database",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail={"error": "database_unavailable", "reason": str(e)})
