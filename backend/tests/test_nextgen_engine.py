"""
Unit tests for Next-Gen Monte Carlo Simulation & Advanced Psychometric Match Engine
"""
import pytest
from backend.ml.nextgen_engine import MonteCarloROIEngine, AdvancedPsychometricMatchEngine


def test_monte_carlo_simulation():
    engine = MonteCarloROIEngine(num_simulations=100)
    base_salaries = {1: 1200000, 5: 2200000, 10: 4500000, 20: 10000000}
    res = engine.simulate_student_trajectory(
        base_salary_trajectory=base_salaries,
        total_cost_inr=1500000,
        loan_amount_inr=1000000,
        loan_interest_rate=0.105,
        degree_field="engineering-cs",
    )

    assert res["simulation_runs"] == 100
    assert "financial_roi_pct" in res
    assert "breakeven_timeline" in res
    assert res["breakeven_timeline"]["median_months"] > 0
    assert "loan_analytics" in res
    assert res["loan_analytics"]["annual_emi_inr"] > 0
    assert "net_worth_trajectories" in res
    assert len(res["net_worth_trajectories"]["p50"]) == 20
    assert "ai_disruption_index" in res


def test_psychometric_match_engine():
    engine = AdvancedPsychometricMatchEngine()
    student_traits = {"risk": 0.8, "value": 0.9, "autonomy": 1.2, "ai_adaptability": 1.0}
    program = {"field": "engineering-cs", "tier": "1", "college_type": "IIT", "placement_rate": 0.95}

    fit = engine.calculate_program_alignment(student_traits, program)
    assert fit["overall_fit_score"] >= 80
    assert fit["compatibility_tier"] in ["Excellent Match", "Strong Match"]
    assert len(fit["key_reasons"]) > 0
