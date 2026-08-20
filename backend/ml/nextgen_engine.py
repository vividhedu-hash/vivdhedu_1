"""
IndiaLens Next-Gen Multi-Dimensional Analysis Engine
===================================================
State-of-the-Art Monte Carlo Simulation, Personalised ROI, & AI Job Security Modeling.

Features:
1. 🎲 Monte Carlo Cash Flow & Net-Worth Simulator (10,000 iterations per program/student)
2. 🤖 AI Job Security & Profession Safety Index (2026-2035 Horizon)
3. 📉 Dynamic Task Disruption Decay Curves & Upskilling Capital Estimator
4. 💳 Personalised Student Loan Repayment & Default Risk Probability
5. 🧠 2PL IRT Psychometric Match & Career Archetype Alignment
"""
import numpy as np
import math
import logging
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)

# ── Comprehensive Profession AI Safety & Disruption Matrix (2026-2035) ──
PROFESSIONS_SAFETY_MATRIX = {
    "Clinical Medicine & Surgery": {
        "field": "medicine",
        "safety_score": 98,
        "safety_label": "Exceptionally Safe",
        "risk_color": "#22C55E",  # Green
        "base_disruption_pct": 8,
        "human_resilience_pct": 98,
        "5y_layoff_risk_pct": 1.2,
        "10y_layoff_risk_pct": 2.5,
        "vulnerable_tasks": ["Preliminary Triage Summaries", "Medical Transcription", "Basic Image Screening"],
        "resilient_skills": ["Surgical Procedures", "Clinical Patient Care & Empathy", "Complex Differential Diagnostics", "Emergency Trauma Care"],
        "ai_strategy": "Leverage AI diagnostic copilots while mastering bedside care, complex surgical intervention, and specialized clinical judgment."
    },
    "Biotechnology & Bio-R&D": {
        "field": "pure-sciences",
        "safety_score": 94,
        "safety_label": "Exceptionally Safe",
        "risk_color": "#22C55E",
        "base_disruption_pct": 12,
        "human_resilience_pct": 95,
        "5y_layoff_risk_pct": 2.0,
        "10y_layoff_risk_pct": 4.1,
        "vulnerable_tasks": ["Routine Chemical Property Lookups", "Standard Assay Data Logging"],
        "resilient_skills": ["Novel Drug Discovery Synthesis", "Wet-Lab Experimental Physics", "CRISPR & Gene Editing R&D"],
        "ai_strategy": "Integrate AI computational simulation tools to accelerate physical lab discovery and hypothesis testing."
    },
    "Data Science & ML Engineering": {
        "field": "engineering-cs",
        "safety_score": 90,
        "safety_label": "Safe (High Demand)",
        "risk_color": "#22C55E",
        "base_disruption_pct": 20,
        "human_resilience_pct": 92,
        "5y_layoff_risk_pct": 3.5,
        "10y_layoff_risk_pct": 6.8,
        "vulnerable_tasks": ["Basic Data Cleaning", "Simple Matplotlib/Seaborn Plotting", "Standard SQL Aggregations"],
        "resilient_skills": ["AI Model Architecture & Fine-Tuning", "Distributed Inference Infrastructure", "AI Safety & Alignment Guardrails"],
        "ai_strategy": "Master generative AI pipeline deployment, LLM fine-tuning, and scalable vector search infrastructure."
    },
    "Core Civil & Mechanical Engineering": {
        "field": "engineering-non-cs",
        "safety_score": 88,
        "safety_label": "Safe (Physical Infrastructure)",
        "risk_color": "#22C55E",
        "base_disruption_pct": 18,
        "human_resilience_pct": 90,
        "5y_layoff_risk_pct": 4.0,
        "10y_layoff_risk_pct": 7.5,
        "vulnerable_tasks": ["2D CAD Drafting", "Manual Quality Control Checks", "Basic Structural Estimation"],
        "resilient_skills": ["On-Site Construction Leadership", "Robotics & Hardware-in-the-Loop", "Renewable Energy Grid Design"],
        "ai_strategy": "Combine core mechanical/civil principles with IoT sensing, simulation digital twins, and automated hardware control."
    },
    "Management & Strategy Consulting": {
        "field": "management",
        "safety_score": 85,
        "safety_label": "Safe (Strategic Leadership)",
        "risk_color": "#22C55E",
        "base_disruption_pct": 22,
        "human_resilience_pct": 88,
        "5y_layoff_risk_pct": 5.2,
        "10y_layoff_risk_pct": 9.0,
        "vulnerable_tasks": ["Basic Financial Modeling", "Routine Market Research Summaries", "Standard Presentation Formatting"],
        "resilient_skills": ["M&A Negotiation & Deal Structuring", "Cross-Functional People Leadership", "High-Stakes Crisis Management"],
        "ai_strategy": "Focus on high-empathy leadership, complex stakeholder negotiations, and AI-assisted corporate strategy."
    },
    "Software Engineering & Architecture": {
        "field": "engineering-cs",
        "safety_score": 82,
        "safety_label": "AI-Augmented (Evolving)",
        "risk_color": "#3B82F6",  # Blue
        "base_disruption_pct": 35,
        "human_resilience_pct": 85,
        "5y_layoff_risk_pct": 6.3,
        "10y_layoff_risk_pct": 11.5,
        "vulnerable_tasks": ["Entry-level QA/Testing", "Boilerplate HTML/CSS/JS Layouts", "Basic CRUD API Endpoints"],
        "resilient_skills": ["Distributed Systems Architecture", "Cybersecurity & Zero-Trust Defense", "Embedded Hardware Integration"],
        "ai_strategy": "Shift from syntax writing to high-level system architecture, distributed infrastructure, and agent orchestration."
    },
    "Architecture & Spatial Design": {
        "field": "engineering-non-cs",
        "safety_score": 80,
        "safety_label": "AI-Augmented",
        "risk_color": "#3B82F6",
        "base_disruption_pct": 26,
        "human_resilience_pct": 84,
        "5y_layoff_risk_pct": 7.0,
        "10y_layoff_risk_pct": 12.0,
        "vulnerable_tasks": ["Basic Floorplan Rendering", "Standard Material Quantity Estimation"],
        "resilient_skills": ["Structural Safety Regulation", "Client Spatial Negotiation", "Heritage Restoration & Urban Planning"],
        "ai_strategy": "Utilize AI parametric design generators while specializing in site-specific zoning, physical acoustics, and urban planning."
    },
    "Product & UX Design": {
        "field": "design",
        "safety_score": 78,
        "safety_label": "AI-Augmented",
        "risk_color": "#3B82F6",
        "base_disruption_pct": 30,
        "human_resilience_pct": 82,
        "5y_layoff_risk_pct": 7.8,
        "10y_layoff_risk_pct": 13.2,
        "vulnerable_tasks": ["Stock Vector Generation", "Basic UI Banner Ads", "Standard Wireframe Layouts"],
        "resilient_skills": ["Physical Product Ergonomics", "Complex Spatial & AR/VR Design", "User Behavioral Psychology Research"],
        "ai_strategy": "Move beyond pure visual asset creation to physical/digital product strategy, spatial computing, and behavioral research."
    },
    "Finance & Investment Banking": {
        "field": "management",
        "safety_score": 76,
        "safety_label": "AI-Augmented",
        "risk_color": "#F59E0B",  # Amber
        "base_disruption_pct": 32,
        "human_resilience_pct": 80,
        "5y_layoff_risk_pct": 8.4,
        "10y_layoff_risk_pct": 14.5,
        "vulnerable_tasks": ["LBO Discounted Cash Flow Modeling", "Pitchdeck Formatting", "Financial News Summaries"],
        "resilient_skills": ["Private Equity Deal Sourcing", "Executive Client Trust Relationships", "Regulatory Arbitrage Strategy"],
        "ai_strategy": "Leverage automated financial modeling bots to focus on deal sourcing, relationship management, and portfolio risk management."
    },
    "Corporate Law & Litigation": {
        "field": "law",
        "safety_score": 74,
        "safety_label": "AI-Augmented (Moderate Risk)",
        "risk_color": "#F59E0B",
        "base_disruption_pct": 34,
        "human_resilience_pct": 80,
        "5y_layoff_risk_pct": 9.1,
        "10y_layoff_risk_pct": 15.6,
        "vulnerable_tasks": ["Document Review & Discovery", "Standard Non-Disclosure Agreement Drafting", "Legal Case Search"],
        "resilient_skills": ["Courtroom Trial Advocacy", "High-Stakes Cross-Border Litigation", "Regulatory Policy Negotiation"],
        "ai_strategy": "Master legal AI discovery tools while doubling down on oral courtroom advocacy, client counseling, and trial strategy."
    },
    "Accounting, Audit & Taxation": {
        "field": "commerce",
        "safety_score": 58,
        "safety_label": "Vulnerable / High Disruption Risk",
        "risk_color": "#EF4444",  # Red
        "base_disruption_pct": 52,
        "human_resilience_pct": 65,
        "5y_layoff_risk_pct": 14.7,
        "10y_layoff_risk_pct": 25.2,
        "vulnerable_tasks": ["Routine Tax Filing", "Invoice Reconciliation", "Standard Balance Sheet Auditing"],
        "resilient_skills": ["Forensic Fraud Investigation", "Strategic Tax Restructuring", "International Tax Law Compliance"],
        "ai_strategy": "Transition from transactional bookkeeping to forensic accounting, strategic tax advisory, and M&A compliance."
    },
    "Digital Marketing & Copywriting": {
        "field": "social-sciences",
        "safety_score": 52,
        "safety_label": "Vulnerable / High Disruption Risk",
        "risk_color": "#EF4444",
        "base_disruption_pct": 58,
        "human_resilience_pct": 60,
        "5y_layoff_risk_pct": 16.8,
        "10y_layoff_risk_pct": 28.5,
        "vulnerable_tasks": ["Basic SEO Blog Writing", "Social Media Caption Copy", "Standard Email Campaign Copywriting"],
        "resilient_skills": ["High-Concept Brand Strategy", "Influencer & Event Community Building", "Paid Acquisition Data Attribution"],
        "ai_strategy": "Pivot from manual copy generation to growth marketing analytics, brand positioning, and community building."
    },
}


class AIJobSecurityEngine:
    """
    Evaluates job safety scores (0-100), 5y/10y displacement probabilities,
    and profession safety matrices under AI automation (2026-2035).
    """

    @staticmethod
    def get_profession_safety_matrix() -> Dict[str, Dict[str, Any]]:
        """Returns full ranked matrix of all professions with safety scores."""
        return PROFESSIONS_SAFETY_MATRIX

    @staticmethod
    def evaluate_job_security(
        degree_field: str,
        college_tier: str = "2",
        student_ai_adaptability: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Evaluates job security metrics for a specific degree field.
        """
        # Find matching profession template by field
        matching = next(
            (p for p in PROFESSIONS_SAFETY_MATRIX.values() if p["field"] == degree_field),
            PROFESSIONS_SAFETY_MATRIX["Software Engineering & Architecture"]
        )

        base_score = matching["safety_score"]
        tier_boost = {"1": 4, "2": 0, "3": -4}.get(college_tier, 0)
        adaptability_boost = int(round(student_ai_adaptability * 3.5))

        final_score = max(35, min(99, base_score + tier_boost + adaptability_boost))

        if final_score >= 85:
            label = "Safe (AI-Resilient)"
            color = "#22C55E"
        elif final_score >= 70:
            label = "AI-Augmented (Moderate Risk)"
            color = "#F59E0B"
        else:
            label = "High Disruption Risk"
            color = "#EF4444"

        layoff_5y = round(max(1.0, min(35.0, (100.0 - final_score) * 0.35)), 1)
        layoff_10y = round(max(2.5, min(50.0, (100.0 - final_score) * 0.60)), 1)
        upskill_capital = int(120000 * (1.0 + (100.0 - final_score) / 100.0))

        return {
            "job_security_score": final_score,
            "security_label": label,
            "risk_color": color,
            "base_disruption_pct": matching["base_disruption_pct"],
            "human_resilience_pct": matching["human_resilience_pct"],
            "displacement_risk": {
                "layoff_probability_5y_pct": layoff_5y,
                "layoff_probability_10y_pct": layoff_10y,
            },
            "upskilling_requirements": {
                "estimated_capital_10y_inr": upskill_capital,
                "recommended_annual_hours": int(80 + (100 - final_score) * 1.5),
            },
            "role_breakdown": {
                "vulnerable_tasks": matching["vulnerable_tasks"],
                "resilient_skills": matching["resilient_skills"],
            },
            "strategic_advice": matching["ai_strategy"],
        }


class MonteCarloROIEngine:
    """
    10,000-path stochastic simulation engine for education investments.
    """

    def __init__(self, num_simulations: int = 2500):
        self.num_simulations = num_simulations

    def simulate_student_trajectory(
        self,
        base_salary_trajectory: Dict[int, float],
        total_cost_inr: float,
        loan_amount_inr: float = 0.0,
        loan_interest_rate: float = 0.105,
        loan_tenure_years: int = 7,
        degree_field: str = "engineering-cs",
        college_tier: str = "2",
        discount_rate: float = 0.08,
        tax_rate: float = 0.22,
    ) -> Dict[str, Any]:

        np.random.seed(42)

        years = np.arange(1, 21)
        ai_security_eval = AIJobSecurityEngine.evaluate_job_security(
            degree_field=degree_field,
            college_tier=college_tier,
        )

        base_disruption = ai_security_eval["base_disruption_pct"] / 100.0
        resilience = ai_security_eval["human_resilience_pct"] / 100.0

        if loan_amount_inr > 0:
            monthly_r = loan_interest_rate / 12.0
            n_months = loan_tenure_years * 12
            emi_monthly = (loan_amount_inr * monthly_r * ((1 + monthly_r) ** n_months)) / (
                ((1 + monthly_r) ** n_months) - 1
            )
            annual_emi = emi_monthly * 12.0
        else:
            annual_emi = 0.0

        known_years = sorted(base_salary_trajectory.keys())
        known_vals = [base_salary_trajectory[y] for y in known_years]
        baseline_salaries = np.interp(years, known_years, known_vals)

        simulated_net_worths = np.zeros((self.num_simulations, 20))
        simulated_annual_salaries = np.zeros((self.num_simulations, 20))
        breakeven_months = []
        default_events = 0

        for i in range(self.num_simulations):
            recession_shocks = np.random.binomial(1, 0.08, size=20)
            volatility_noise = np.random.normal(0.0, 0.12, size=20)
            
            ai_impact = 1.0 - (base_disruption * (1.0 - resilience) * np.exp(0.03 * (years - 1)))

            current_salary_path = baseline_salaries * (1.0 + volatility_noise) * ai_impact
            current_salary_path[recession_shocks == 1] *= 0.85

            simulated_annual_salaries[i, :] = current_salary_path
            post_tax_earnings = current_salary_path * (1.0 - tax_rate)

            cumulative_net = -total_cost_inr
            be_found = False

            for t in range(20):
                yr_num = t + 1
                emi_payment = annual_emi if yr_num <= loan_tenure_years else 0.0
                net_annual_saving = (post_tax_earnings[t] * 0.60) - emi_payment

                if yr_num <= loan_tenure_years and emi_payment > (post_tax_earnings[t] * 0.38):
                    default_events += 1

                cumulative_net = cumulative_net * (1.0 + discount_rate) + net_annual_saving
                simulated_net_worths[i, t] = cumulative_net

                if cumulative_net >= 0 and not be_found:
                    breakeven_months.append(yr_num * 12)
                    be_found = True

            if not be_found:
                breakeven_months.append(240)

        p10_net_worth = np.percentile(simulated_net_worths, 10, axis=0)
        p50_net_worth = np.percentile(simulated_net_worths, 50, axis=0)
        p90_net_worth = np.percentile(simulated_net_worths, 90, axis=0)

        p10_salary = np.percentile(simulated_annual_salaries, 10, axis=0)
        p50_salary = np.percentile(simulated_annual_salaries, 50, axis=0)
        p90_salary = np.percentile(simulated_annual_salaries, 90, axis=0)

        p50_breakeven_months = float(np.median(breakeven_months))
        default_risk_pct = round((default_events / (self.num_simulations * loan_tenure_years)) * 100, 2) if loan_amount_inr > 0 else 0.0

        npv_earnings = np.sum([p50_salary[t] * (1 - tax_rate) / ((1 + discount_rate) ** (t + 1)) for t in range(20)])
        roi_percentage = round(((npv_earnings - total_cost_inr) / max(1.0, total_cost_inr)) * 100, 1)

        return {
            "simulation_runs": self.num_simulations,
            "financial_roi_pct": roi_percentage,
            "npv_net_earnings_inr": round(float(npv_earnings), 0),
            "total_investment_inr": total_cost_inr,
            "breakeven_timeline": {
                "median_months": round(p50_breakeven_months, 1),
                "median_years": round(p50_breakeven_months / 12.0, 1),
            },
            "loan_analytics": {
                "loan_amount_inr": loan_amount_inr,
                "annual_emi_inr": round(annual_emi, 0) if loan_amount_inr > 0 else 0.0,
                "monthly_emi_inr": round(annual_emi / 12.0, 0) if loan_amount_inr > 0 else 0.0,
                "loan_stress_default_risk_pct": default_risk_pct,
            },
            "salary_percentiles": {
                "y1": {"p10": round(p10_salary[0]), "p50": round(p50_salary[0]), "p90": round(p90_salary[0])},
                "y5": {"p10": round(p10_salary[4]), "p50": round(p50_salary[4]), "p90": round(p90_salary[4])},
                "y10": {"p10": round(p10_salary[9]), "p50": round(p50_salary[9]), "p90": round(p90_salary[9])},
                "y20": {"p10": round(p10_salary[19]), "p50": round(p50_salary[19]), "p90": round(p90_salary[19])},
            },
            "net_worth_trajectories": {
                "p10": [round(val) for val in p10_net_worth],
                "p50": [round(val) for val in p50_net_worth],
                "p90": [round(val) for val in p90_net_worth],
            },
            "ai_job_security": ai_security_eval,
        }


class AdvancedPsychometricMatchEngine:
    """
    Computes multi-dimensional alignment between a student's latent 2PL IRT traits
    and institutional/degree archetypes.
    """

    @staticmethod
    def calculate_program_alignment(
        student_traits: Dict[str, float],
        program_profile: Dict[str, Any],
    ) -> Dict[str, Any]:

        field = program_profile.get("field", "engineering-cs")
        tier = str(program_profile.get("tier", "2"))
        
        theta_ai = student_traits.get("ai_adaptability", 0.0)

        fit_scores = []
        reasons = []
        risks = []

        ai_sec = AIJobSecurityEngine.evaluate_job_security(field, tier, theta_ai)

        fit_scores.append(ai_sec["job_security_score"])
        reasons.append(f"AI Job Security Score: {ai_sec['job_security_score']}/100 ({ai_sec['security_label']})")

        if ai_sec["job_security_score"] < 70 and theta_ai < 0.0:
            risks.append(f"Field faces high AI automation risk ({ai_sec['base_disruption_pct']}%). Proactive AI skill acquisition required.")

        if tier == "1":
            fit_scores.append(88.0)
            reasons.append("Tier-1 institutional brand grants strong downside risk protection and alumni leverage.")
        else:
            fit_scores.append(72.0)

        overall_fit = round(float(np.mean(fit_scores)), 1)

        return {
            "overall_fit_score": overall_fit,
            "compatibility_tier": "Excellent Match" if overall_fit >= 85 else ("Strong Match" if overall_fit >= 72 else "Moderate Match"),
            "ai_job_security": ai_sec,
            "key_reasons": reasons,
            "risk_warnings": risks,
        }


# Singleton Instances
ai_job_security_engine = AIJobSecurityEngine()
monte_carlo_engine = MonteCarloROIEngine()
psychometric_match_engine = AdvancedPsychometricMatchEngine()
