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
    assert "ai_job_security" in res



def test_psychometric_match_engine():
    engine = AdvancedPsychometricMatchEngine()
    student_traits = {"risk": 0.8, "value": 0.9, "autonomy": 1.2, "ai_adaptability": 1.0}
    program = {"field": "engineering-cs", "tier": "1", "college_type": "IIT", "placement_rate": 0.95}

    fit = engine.calculate_program_alignment(student_traits, program)
    assert fit["overall_fit_score"] >= 80
    assert fit["compatibility_tier"] in ["Excellent Match", "Strong Match"]
    assert len(fit["key_reasons"]) > 0


def test_ai_job_security_engine():
    from backend.ml.nextgen_engine import AIJobSecurityEngine
    matrix = AIJobSecurityEngine.get_profession_safety_matrix()
    assert len(matrix) >= 10
    assert "Clinical Medicine & Surgery" in matrix
    assert matrix["Clinical Medicine & Surgery"]["safety_score"] >= 95

    eval_res = AIJobSecurityEngine.evaluate_job_security("engineering-cs", "1", 0.5)
    assert eval_res["job_security_score"] > 70
    assert "vulnerable_tasks" in eval_res["role_breakdown"]
    assert "resilient_skills" in eval_res["role_breakdown"]


def test_on_the_spot_profession_decision():
    from backend.ml.nextgen_engine import AIJobSecurityEngine
    
    # Test arbitrary novel profession 1: Hands-on / Clinical
    surge_res = AIJobSecurityEngine.evaluate_any_profession_on_the_spot("Robotic Surgery Technician", "1", 0.5)
    assert surge_res["job_security_score"] >= 85
    assert surge_res["security_label"] == "Safe (AI-Resilient)"

    # Test arbitrary novel profession 2: High Routine / Repetitive
    clerk_res = AIJobSecurityEngine.evaluate_any_profession_on_the_spot("Junior Copywriter & Data Entry Typist", "3", -0.5)
    assert clerk_res["job_security_score"] < 70
    assert clerk_res["security_label"] == "High Disruption Risk"

    # Test arbitrary novel profession 3: High-Order Systems
    arch_res = AIJobSecurityEngine.evaluate_any_profession_on_the_spot("Principal Quantum Systems Architect", "1", 1.0)
    assert arch_res["job_security_score"] >= 80


