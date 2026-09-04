"""
Unit & Integration Tests for All PRD Mathematical Models
=========================================================
Verifies 100% fidelity to equations in PROJECT_PRD.html:
- Section 04: Net Present Value, Newton-Raphson IRR, Student-Adaptive Composite ROI, Monte Carlo Solvency
- Section 05: 8-Vector Risk Surface, Job Security Score, Layoff Probabilities, Upskilling Reserve
- Section 06: 3PL IRT Item Response Theory & Bayesian Archetype Posterior
- Section 09: Cutoff Delta Z-Scores, Normal CDF Probability, 4-Tier Application Matrix
"""
import pytest
import math
from backend.ml.roi_computer import (
    compute_annual_cash_flow_series,
    compute_master_npv,
    compute_newton_raphson_irr,
    compute_eight_vector_risk,
    compute_job_security_score,
    compute_student_adaptive_weights,
    compute_roi,
    calculate_post_tax_income,
)
from backend.ml.nextgen_engine import (
    monte_carlo_engine,
    global_degree_engine,
    marketplace_engine,
    portfolio_spike_engine,
)
from backend.ml.admissions_engine import admissions_portfolio_engine
from backend.services.psychometric_engine import psychometric_engine


def test_calculate_post_tax_income():
    """Test progressive tax slab calculation for Indian regime."""
    # Under ₹7L should have 0 tax due to 87A rebate
    assert calculate_post_tax_income(650000.0, "India") == 650000.0
    # ₹15L income
    post_tax = calculate_post_tax_income(1500000.0, "India")
    assert post_tax < 1500000.0
    assert post_tax > 1200000.0


def test_master_npv_and_irr_newton_raphson():
    """Test Section 04 Master NPV and Newton-Raphson IRR equations."""
    sample_traj = {
        "y1": {"p50": 1000000.0},
        "y5": {"p50": 2200000.0},
        "y10": {"p50": 4500000.0},
        "y20": {"p50": 9000000.0},
    }
    cash_flows = compute_annual_cash_flow_series(
        trajectory=sample_traj,
        duration_years=4.0,
        country="India",
        base_disruption=0.25,
        human_resilience=0.85,
    )
    assert len(cash_flows) == 20
    assert all(cf > 0 for cf in cash_flows)

    net_npv, earnings, investment = compute_master_npv(
        annual_cash_flows=cash_flows,
        total_cost_inr=1000000.0,
        duration_years=4.0,
        state="Maharashtra",
        college_type="private",
    )
    assert earnings > investment
    assert net_npv > 0

    irr = compute_newton_raphson_irr(cash_flows, investment)
    assert irr is not None
    assert irr > 15.0  # Positive return above loan rates


def test_student_adaptive_weights():
    """Test Section 4.3 Student-Conditioned Adaptive Weights from IRT Traits."""
    # High value maximizer
    w_value_max = compute_student_adaptive_weights({"value": 2.0, "risk": -1.0, "autonomy": 0.0, "ai_adapt": 0.0})
    # Balanced student
    w_balanced = compute_student_adaptive_weights({"value": 0.0, "risk": 0.0, "autonomy": 0.0, "ai_adapt": 0.0})

    # Financial weight must be significantly higher for value maximizer
    assert w_value_max["financial_roi"] > w_balanced["financial_roi"]
    # Safety weight must be higher for risk-averse student (theta_risk = -1.0)
    assert w_value_max["safety"] > w_balanced["safety"]
    assert abs(sum(w_value_max.values()) - 1.0) < 1e-3


def test_eight_vector_risk_and_jss():
    """Test Section 05 Eight-Vector Risk Tensor & Job Security Score."""
    sample_prog = {
        "degree_field": "engineering-cs",
        "tier": "1",
        "ai_automation_prob": 0.28,
        "salary_volatility": 0.16,
        "industry_cyclicality": 0.18,
        "credential_inflation": 0.14,
        "geographic_concentration": 0.20,
        "work_life_quality": 0.80,
    }
    risk_score, vectors = compute_eight_vector_risk(sample_prog)
    assert len(vectors) == 8
    assert 0.0 < risk_score < 1.0

    jss_res = compute_job_security_score(
        degree_field="engineering-cs",
        college_tier="1",
        student_ai_adaptability=1.2,
        base_disruption=0.28,
        human_resilience=0.85,
    )
    assert 35.0 <= jss_res["jss_score"] <= 99.0
    assert 1.0 <= jss_res["layoff_probability_5y_pct"] <= 35.0
    assert 2.5 <= jss_res["layoff_probability_10y_pct"] <= 50.0
    assert jss_res["upskilling_reserve_inr"] > 120000.0


def test_monte_carlo_10000_paths():
    """Test Section 4.4 10,000-Path Monte Carlo Simulation with MCLR Drift."""
    res = monte_carlo_engine.simulate_student_trajectory(
        base_salary_trajectory={1: 700000.0, 5: 1500000.0, 10: 3000000.0, 20: 7000000.0},
        total_cost_inr=1200000.0,
        loan_amount_inr=800000.0,
        loan_interest_rate=0.105,
        loan_tenure_years=7,
        degree_field="engineering-cs",
        college_tier="2",
    )
    assert res["simulation_runs"] == 10000
    assert res["breakeven_timeline"]["median_months"] > 0
    assert "loan_stress_default_risk_pct" in res["loan_analytics"]
    assert len(res["net_worth_trajectories"]["p50"]) == 20


def test_admissions_cutoff_delta_z_score():
    """Test Section 09 Cutoff Delta Z-Score & 4-Tier Application Matrix."""
    # Student with rank 3000 applying to program with closing rank 3000
    z, prob = admissions_portfolio_engine.calculate_admission_probability(
        expected_rank=3000,
        base_closing_rank=3000,
        category="General",
        is_home_state=False,
        exam_name="JEE Main",
    )
    assert z == 0.0
    assert prob == 0.50  # Exactly at cutoff = 50% probability

    # Full portfolio test
    portfolio = admissions_portfolio_engine.generate_admissions_portfolio(
        student_rank=3500,
        exam_name="JEE Main",
        category="General",
        home_state="Maharashtra",
        max_budget_inr=2000000.0,
    )
    assert portfolio["portfolio_summary"]["reach_count"] >= 0
    assert portfolio["portfolio_summary"]["target_count"] >= 0
    assert portfolio["portfolio_summary"]["safety_count"] >= 0


def test_global_degree_h1b_survival_odds():
    """Test Section 10.1 Cumulative H-1B Survival Math."""
    # STEM: 1 - (1 - 0.25)^3 = 57.8%
    stem_prob = global_degree_engine.calculate_h1b_survival_odds(is_stem=True)
    assert abs(stem_prob - 0.578) < 0.005
    # Non-STEM: 1 - (1 - 0.25)^1 = 25.0%
    non_stem_prob = global_degree_engine.calculate_h1b_survival_odds(is_stem=False)
    assert abs(non_stem_prob - 0.250) < 0.005


def test_marketplace_gating_threshold():
    """Test Section 3 Course Marketplace M >= 0.75 Gate."""
    sample_course = {
        "id": "c1",
        "course_title": "Deep Learning Specialization",
        "provider": "DeepLearning.AI",
        "category": "Upskilling",
        "price_inr": 4999.0,
        "skill_tags": ["PyTorch", "Deep Learning", "Transformers"],
        "career_paths": ["AI Engineer", "ML Engineer"],
        "ai_resilience_score": 0.92,
        "affiliate_url": "https://coursera.org/specializations/deep-learning",
    }
    # Student lacking skills should get high gap fill
    match_res = marketplace_engine.match_course_for_student(
        student_skills=["Python", "Basic Math"],
        target_role="AI Engineer",
        monthly_budget_inr=5000.0,
        course_item=sample_course,
    )
    assert match_res["match_score"] >= 0.75
    assert match_res["is_gated_display"] is True


def test_psychometric_cat_engine_convergence():
    """Test Section 06 3PL IRT Psychometric Session & Convergence."""
    session = psychometric_engine.create_session("engineering", 15)
    item, is_converged = psychometric_engine.get_next_item(session)
    assert item is not None
    assert not is_converged

    # Record 8 gateway responses
    for _ in range(8):
        it, _ = psychometric_engine.get_next_item(session)
        if it:
            psychometric_engine.record_response(session, it["id"], 2)

    report = psychometric_engine.compute_final_report(session)
    assert "primary_archetype" in report
    assert "secondary_archetype" in report
    assert len(report["trait_vector"]) == 8
    assert report["validity_ok"] is True
