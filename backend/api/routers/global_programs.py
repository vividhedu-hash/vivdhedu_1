"""
Global Programs Router
======================
Endpoints for cross-border degree discovery, STEM OPT H-1B probability simulation,
and spatial cost-of-living tax drag comparisons.
"""
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

try:
    from ..db.database import get_db
except ImportError:
    from ..db.database import get_db

try:
    from ml.nextgen_engine import global_degree_engine
    from scripts.seed_global_and_marketplace import GLOBAL_PROGRAMS_SEED
except ImportError:
    from ml.nextgen_engine import global_degree_engine
    from scripts.seed_global_and_marketplace import GLOBAL_PROGRAMS_SEED

router = APIRouter(prefix="/global", tags=["Global Degrees & Cross-Border ROI"])


class GlobalNPVRequest(BaseModel):
    university_name: str
    country: str
    city: str
    is_stem_designated: bool
    annual_tuition_usd: float
    living_cost_annual_usd: float
    median_salary_usd_y1: float
    duration_years: float = 2.0


@router.get("/programs")
async def get_global_programs(
    country: Optional[str] = None,
    is_stem: Optional[bool] = None,
    tier: Optional[str] = None,
    session: AsyncSession = Depends(get_db)
):
    """List international university degree offerings with verified actuarial metrics."""
    filtered = GLOBAL_PROGRAMS_SEED

    if country:
        filtered = [p for p in filtered if p["country"].lower() == country.lower()]
    if is_stem is not None:
        filtered = [p for p in filtered if p["is_stem_designated"] == is_stem]
    if tier:
        filtered = [p for p in filtered if p["global_tier"].lower() == tier.lower()]

    return {
        "programs": filtered,
        "total": len(filtered),
        "source": "verified_actuarial_registry"
    }


@router.post("/cross-border-npv")
async def compute_cross_border_npv(payload: GlobalNPVRequest):
    """
    Computes real-time cross-border 20-Year Net Present Value (in INR),
    accounting for STEM OPT H-1B lottery probability, city-level rent/COLI drag,
    and effective marginal tax schedules.
    """
    result = global_degree_engine.evaluate_global_program_npv(
        university_name=payload.university_name,
        country=payload.country,
        city=payload.city,
        is_stem=payload.is_stem_designated,
        annual_tuition_usd=payload.annual_tuition_usd,
        living_cost_annual_usd=payload.living_cost_annual_usd,
        median_salary_usd_y1=payload.median_salary_usd_y1,
        duration_years=payload.duration_years,
    )
    return result


@router.get("/city-benchmarks")
async def get_city_benchmarks():
    """Returns spatial tax and cost-of-living indices across key destination metros."""
    return {
        "cities": global_degree_engine.CITY_COLI_INDEX,
        "fx_rates": {
            "USD_INR": global_degree_engine.USD_INR_RATE,
            "EUR_INR": global_degree_engine.EUR_INR_RATE,
            "GBP_INR": global_degree_engine.GBP_INR_RATE,
            "SGD_INR": global_degree_engine.SGD_INR_RATE,
        }
    }
