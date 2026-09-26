"""
/api/v1/analytics — Global-Standards Educational & Financial Analytics Router

Endpoints:
- POST /analytics/dcf-roi       — 20-year Discounted Cash Flow (DCF), Net Present Value (NPV), & Loan Amortization Schedule
- POST /analytics/monte-carlo   — 1,000-trial Stochastic Monte Carlo Risk & Percentile Simulation
- POST /analytics/mobility      — Chetty Socioeconomic Upward Mobility Index
- POST /analytics/counterfactual — Synthetic Control Pairwise Counterfactual Analysis
- POST /analytics/skill-velocity — Lightcast-Style Skill Demand Elasticity
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any
from services.global_standards_analytics import global_analytics_service

router = APIRouter()


class DCFRequest(BaseModel):
    total_cost_inr: float = Field(1_200_000, description="Total tuition & degree cost in INR")
    starting_salary_y1: float = Field(1_000_000, description="Expected Year 1 starting salary in INR")
    degree_duration_years: float = Field(4.0, description="Duration of degree in years")
    discount_rate: float = Field(0.07, description="Real annual discount rate (default 7%)")
    growth_rate: float = Field(0.12, description="Annual salary growth rate")
    loan_amount_inr: float = Field(500_000, description="Education loan amount in INR")
    loan_tenure_years: int = Field(7, description="Loan repayment tenure in years")


class MonteCarloRequest(BaseModel):
    base_starting_salary: float = Field(1_000_000, description="Median starting salary")
    placement_rate: float = Field(0.85, description="Institutional placement rate (0.0 to 1.0)")
    ai_automation_prob: float = Field(0.25, description="AI automation probability (0.0 to 1.0)")
    total_cost_inr: float = Field(1_200_000, description="Total degree cost in INR")
    num_trials: int = Field(1000, description="Number of Monte Carlo simulation trials")


class MobilityRequest(BaseModel):
    tier: str = Field("1", description="College tier: 1, 2, or 3")
    college_type: str = Field("IIT", description="College classification type")
    family_income_bracket: str = Field("5-10L", description="Family annual income bracket")
    placement_rate: float = Field(0.85, description="Placement rate")


class CounterfactualRequest(BaseModel):
    program_a: Dict[str, Any] = Field(..., description="Program A details dict")
    program_b: Dict[str, Any] = Field(..., description="Program B details dict")


class SkillVelocityRequest(BaseModel):
    degree_field: str = Field("engineering-cs", description="Degree field of study")


@router.post("/dcf-roi")
async def calculate_dcf_npv(payload: DCFRequest):
    """Calculates 20-year DCF, Net Present Value, IRR, and loan EMI amortization schedule."""
    return global_analytics_service.calculate_dcf_npv_irr(
        total_cost_inr=payload.total_cost_inr,
        starting_salary_y1=payload.starting_salary_y1,
        degree_duration_years=payload.degree_duration_years,
        discount_rate=payload.discount_rate,
        growth_rate=payload.growth_rate,
        loan_amount_inr=payload.loan_amount_inr,
        loan_tenure_years=payload.loan_tenure_years,
    )


@router.post("/monte-carlo")
async def run_monte_carlo(payload: MonteCarloRequest):
    """Runs 1,000 Monte Carlo stochastic trials to compute VaR95 and P10-P90 percentiles."""
    return global_analytics_service.run_monte_carlo_simulation(
        base_starting_salary=payload.base_starting_salary,
        placement_rate=payload.placement_rate,
        ai_automation_prob=payload.ai_automation_prob,
        total_cost_inr=payload.total_cost_inr,
        num_trials=payload.num_trials,
    )


@router.post("/mobility")
async def calculate_mobility(payload: MobilityRequest):
    """Computes Chetty Upward Income Mobility Index & Social Escalator rating."""
    return global_analytics_service.calculate_chetty_mobility_index(
        tier=payload.tier,
        college_type=payload.college_type,
        family_income_bracket=payload.family_income_bracket,
        placement_rate=payload.placement_rate,
    )


@router.post("/counterfactual")
async def evaluate_counterfactual(payload: CounterfactualRequest):
    """Evaluates synthetic control counterfactual delta between Program A and Program B."""
    return global_analytics_service.evaluate_counterfactual_pair(
        prog_a=payload.program_a,
        prog_b=payload.program_b,
    )


@router.post("/skill-velocity")
async def analyze_skills(payload: SkillVelocityRequest):
    """Returns Lightcast-style skill elasticity and AI complementarity metrics."""
    return global_analytics_service.analyze_skill_velocity(degree_field=payload.degree_field)
