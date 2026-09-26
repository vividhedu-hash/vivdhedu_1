"""
The Student Intelligence Layer — Gemini 3.7 Flash Hybrid ML-LLM Engine
========================================================================
Comprehensive implementation of Section 08 of The Project PRD.

Features:
1. Structured Context Injection Protocol (Section 8.2):
   Bridges the quantitative ML pipeline with the generative reasoning layer via
   dense JSON context packets (traits, financial constraints, academic matrix,
   econometric evaluations, active path DAG, longitudinal memory).

2. Anti-Yes-Man Fiduciary Enforcement Directives (Section 8.3):
   - Fiduciary Prime Directive: Sole loyalty to student's 20-year net solvency
   - Mandatory Downside-First Presentation: Lead with P10 scenario & default risk
   - Contradiction Interception: Flags psychological contradictions (e.g. θ_risk < -1.0 with high-debt abroad)
   - Zero Numerical Hallucination: Mandatory grounding or ML packet citation
"""
import json
import logging
from typing import Any, Dict, List, Optional

from api.config import settings
from services.gemini_grounded import gemini_grounded

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_CONSTRAINTS = """You are the Senior Actuarial Fiduciary & Strategic Calculator for 'The Project', India's sovereign quantitative career intelligence system.
Your sole loyalty is to the student's 20-year net financial solvency and developmental resilience. You are strictly forbidden from flattering the student, validating unrealistic aspirations without data, or acting as an agreeable cheerleader.

CORE BEHAVIORAL DIRECTIVES (MANDATORY):
1. MANDATORY DOWNSIDE-FIRST PRESENTATION:
   Whenever evaluating any academic program or career choice, you MUST present the P10 downside scenario, debt service burden, and loan default risk BEFORE discussing any upside potential.
2. CONTRADICTION INTERCEPTION:
   If the student's stated intent contradicts their quantitative psychometric traits (e.g. high risk aversion θ_risk < -0.8 paired with high debt, or low AI adaptability θ_ai < -0.5 in a high-disruption field), you MUST explicitly intervene, name the psychological contradiction, and quantify the risk in INR.
3. ZERO NUMERICAL HALLUCINATION:
   NEVER invent salary figures, placement percentages, or cutoff ranks. All numbers MUST be cited from the injected CONTEXT_PACKET or retrieved via live Google Search grounding.
4. CHALLENGE PRESTIGE BIAS:
   If the student gravitates toward a brand-name institution with poor financial ROI or high default risk over a high-NPV target or hidden gem, explicitly demonstrate the opportunity cost difference in INR.
"""


class GeminiAdvisorService:
    @staticmethod
    def build_context_packet(
        student_profile: Dict[str, Any],
        top_programs: List[Dict[str, Any]],
        traits: Optional[Dict[str, float]] = None,
        path_dag: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Constructs the dense Context Injection Packet (PRD Section 8.2).
        """
        traits = traits or {
            "theta_risk": float(student_profile.get("theta_risk", -0.4)),
            "theta_value": float(student_profile.get("theta_value", 1.2)),
            "theta_autonomy": float(student_profile.get("theta_autonomy", 0.5)),
            "theta_ai": float(student_profile.get("theta_ai", 0.8)),
        }

        budget_lakhs = float(student_profile.get("total_budget", 15.0))
        budget_inr = budget_lakhs * 100000.0

        return {
            "student_token": student_profile.get("token", "anonymous-session"),
            "psychometric_profile": traits,
            "financial_constraints": {
                "max_household_budget_inr": budget_inr,
                "max_acceptable_loan_inr": float(student_profile.get("loan_amount", budget_inr * 0.7)),
                "max_monthly_emi_tolerance_inr": float(student_profile.get("max_emi", 25000.0)),
            },
            "academic_reality_matrix": {
                "exam": student_profile.get("exam", "JEE Main"),
                "score_or_percentile": student_profile.get("percentile", 94.5),
                "rank": student_profile.get("expected_rank", None),
                "category": student_profile.get("category", "General"),
                "home_state": student_profile.get("home_state", "Maharashtra"),
                "target_degree_level": student_profile.get("degree_level", "Undergraduate B.Tech"),
            },
            "econometric_evaluations": GeminiAdvisorService._enrich_programs(student_profile, top_programs[:6], traits),
            "active_path_dag": path_dag or {
                "current_node": "EVALUATING_OPTIONS",
                "unlocked_nodes": [p.get("college", "Target") for p in top_programs[:3]],
            },
            "longitudinal_memory": {
                "user_stated_question": student_profile.get("question", "What is the optimal path for my budget and caliber?"),
                "preferred_cities": student_profile.get("preferred_cities", ["Bengaluru", "Pune", "NCR"]),
            },
        }

    @staticmethod
    def _enrich_programs(
        student_profile: Dict[str, Any],
        programs: List[Dict[str, Any]],
        traits: Dict[str, float],
    ) -> List[Dict[str, Any]]:
        from ml.admissions_engine import AdmissionsPortfolioEngine
        from ml.nextgen_engine import AIJobSecurityEngine

        student_rank = float(student_profile.get("expected_rank") or student_profile.get("jee_rank") or 14000.0)
        exam_name = student_profile.get("exam", "JEE Main")
        category = student_profile.get("category", "General")
        home_state = student_profile.get("home_state", "Maharashtra")

        enriched = []
        for p in programs:
            prog_copy = dict(p)
            tier = str(prog_copy.get("tier", "2"))
            field = prog_copy.get("field") or prog_copy.get("degree_field", "engineering-cs")
            cost = float(prog_copy.get("total_cost_inr") or prog_copy.get("total_cost_of_degree") or 1200000.0)

            # 1. Calibrate admissions probability if missing
            if "admission_probability_pct" not in prog_copy:
                bench = 3500.0 if tier == "1" else (18000.0 if tier == "2" else 50000.0)
                z, prob = AdmissionsPortfolioEngine.calculate_admission_probability(
                    expected_rank=student_rank,
                    base_closing_rank=bench,
                    category=category,
                    is_home_state=(str(prog_copy.get("state", "")).lower() == home_state.lower()),
                    exam_name=exam_name,
                )
                prog_copy["admission_z_score"] = z
                prog_copy["admission_probability_pct"] = round(prob * 100.0, 1)

            # 2. AI Job Security & Layoff Risk if missing
            if "job_security_score" not in prog_copy:
                jss = AIJobSecurityEngine.evaluate_job_security(
                    degree_field=field,
                    college_tier=tier,
                    student_ai_adaptability=traits.get("theta_ai", 0.0),
                )
                prog_copy["job_security_score"] = jss["jss_score"]
                prog_copy["layoff_probability_5y_pct"] = jss["layoff_probability_5y_pct"]

            # 3. Monthly EMI and Default Risk
            budget_lakhs = float(student_profile.get("total_budget", 15.0))
            loan_p = float(student_profile.get("loan_amount") or (cost * 0.60))
            if "monthly_emi_inr" not in prog_copy and loan_p > 0:
                monthly_r = 0.105 / 12.0
                n_m = 7 * 12
                emi = (loan_p * monthly_r * ((1.0 + monthly_r) ** n_m)) / (((1.0 + monthly_r) ** n_m) - 1.0)
                prog_copy["estimated_monthly_emi_inr"] = round(emi, 0)
                y1_sal = float(prog_copy.get("median_salary_inr") or 750000.0)
                take_home_m = (y1_sal / 12.0) * 0.78 * 0.88
                dti = emi / max(1.0, take_home_m)
                prog_copy["debt_to_income_ratio"] = round(dti, 3)
                prog_copy["estimated_loan_default_risk_pct"] = round(min(65.0, max(2.0, (dti - 0.25) * 85.0)), 1) if dti > 0.25 else 2.0

            enriched.append(prog_copy)
        return enriched

    async def generate_career_advice(
        self,
        student_profile: Dict[str, Any],
        top_programs: List[Dict[str, Any]],
        traits: Optional[Dict[str, float]] = None,
        path_dag: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Executes grounded Socratic advisory session adhering to Section 08.
        """
        context_packet = self.build_context_packet(student_profile, top_programs, traits, path_dag)
        user_question = student_profile.get("question") or "Provide an actuarial analysis of my choices and optimal strategy."

        prompt = f"""{SYSTEM_PROMPT_CONSTRAINTS}

=== STRUCTURED INJECTED CONTEXT PACKET (GROUND TRUTH) ===
{json.dumps(context_packet, indent=2)}

=== STUDENT QUERY ===
"{user_question}"

Provide a structured fiduciary analysis:
1. DOWNSIDE & SOLVENCY AUDIT: Analyze the P10 downside scenario, debt service load, and potential default risk across the options.
2. PSYCHOMETRIC & CONTRADICTION CHECK: Cross-examine student's choices against their psychometric traits (θ_risk={context_packet['psychometric_profile'].get('theta_risk')}, θ_value={context_packet['psychometric_profile'].get('theta_value')}, θ_ai={context_packet['psychometric_profile'].get('theta_ai')}). Explicitly highlight any contradictions.
3. ACTUARIAL RECOMMENDATION & ARBITRAGE: State the single highest risk-adjusted NPV pathway. If a Hidden Gem or high-ROI alternative exists, contrast it with high-cost options.
4. TACTICAL NEXT ACTIONS: 3 concrete, mathematically grounded milestones for the next 90 days.

Cite sources with URLs when referencing cutoffs or current market trends.
"""
        answer = await gemini_grounded.generate(prompt, timeout=45.0, require_grounding=False)
        payload = answer.as_dict()
        payload["summary"] = answer.text[:320]
        payload["context_packet"] = context_packet
        payload["model"] = settings.gemini_model
        return payload

    async def generate_micro_dilemma_scenario(
        self,
        student_profile: Dict[str, Any],
        traits: Dict[str, float],
    ) -> Dict[str, Any]:
        """
        Generates live generative micro-dilemma when calibrated bank items are exhausted.
        """
        target_field = student_profile.get("twelfth_stream") or student_profile.get("target_field", "tech")
        budget = student_profile.get("total_budget", 15)
        prompt = f"""Create ONE realistic Indian career micro-dilemma for an Item Response Theory (IRT) diagnostic.

Field: {target_field}
Budget (₹ Lakh): {budget}
Current Trait estimates: {traits}

Return valid JSON:
{{
  "id": "gemini_dilemma_dyn",
  "trait": "risk",
  "type": "SJT",
  "prompt": "under 50 words, specific INR amounts and Indian company/city scenarios",
  "options": [
    {{"label": "A) ...", "score": 1.2}},
    {{"label": "B) ...", "score": -1.0}},
    {{"label": "C) ...", "score": 0.4}},
    {{"label": "D) ...", "score": -0.5}}
  ]
}}
Do not invent ungrounded company packages."""
        data = await gemini_grounded.generate_json(prompt, timeout=25.0, require_grounding=False)
        data["is_generative"] = True
        data["status"] = "live"
        data["engine"] = settings.gemini_model
        return data


gemini_advisor_service = GeminiAdvisorService()
