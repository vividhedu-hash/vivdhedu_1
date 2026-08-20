"""
IndiaLens Backend — Google Gemini AI Advisor Service
Provides interactive student career guidance, personalized degree ROI advice,
and structured JSON parsing of unstructured college placement reports.
"""
import logging
from typing import Dict, Any, List, Optional
import httpx
from backend.api.config import settings

logger = logging.getLogger(__name__)


class GeminiAdvisorService:
    """Service wrapping Google Gemini 1.5/2.5 Flash API via AI Studio."""

    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

    async def generate_career_advice(
        self,
        student_profile: Dict[str, Any],
        top_programs: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Generate personalized AI advisor advice for student profile x program options."""
        if not self.api_key:
            logger.info("GEMINI_API_KEY not set. Returning template AI advisor response.")
            return {
                "engine": "gemini-1.5-flash (fallback)",
                "summary": f"Based on your budget of ₹{student_profile.get('total_budget', 10)} Lakhs and target in {student_profile.get('target_field', 'Engineering')}, tier-1/tier-2 programs deliver optimal 5-year IRR.",
                "recommendations": [
                    "Prioritize programs with high placement consistency (>85%) over brand prestige alone.",
                    "Focus on developing specialized technical skills to mitigate 10-year AI automation exposure.",
                    "Explore early internship opportunities in high-growth tech hubs (Bengaluru / NCR).",
                ],
                "risk_warning": "High tuition costs (>₹15 Lakhs) increase payback horizon beyond 4.5 years.",
            }

        prompt = f"""
        You are IndiaLens AI, an expert quantitative career and education advisor for Indian students.
        Analyze this student profile and top recommended college programs:
        
        Student Profile: {student_profile}
        Top Recommended Programs: {top_programs}
        
        Provide a structured advice summary, top 3 actionable recommendations, and a key risk warning.
        Keep advice grounded in Indian labor market realities, salary trajectories, and ROI.
        """

        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    f"{self.api_url}?key={self.api_key}",
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        return {
                            "engine": "gemini-1.5-flash",
                            "advice_markdown": text,
                        }
        except Exception as e:
            logger.warning(f"Gemini API call failed: {e}")

        return {
            "engine": "gemini-1.5-flash (fallback)",
            "summary": "AI advisor consultation complete. Recommended prioritizing low-cost high-placement engineering programs.",
            "recommendations": [
                "Target tier-1/tier-2 government & autonomous institutes to maximize Net Present Value.",
                "Upskill in cloud architecture & data engineering to protect against AI risk vectors.",
            ],
            "risk_warning": "Monitor economic cyclicality when choosing specialized domains.",
        }

    async def generate_micro_dilemma_scenario(
        self,
        student_profile: Dict[str, Any],
        traits: Dict[str, float],
    ) -> Dict[str, Any]:
        """Generate a personalized real-world micro-dilemma scenario based on student profile and trait estimates."""
        target_field = student_profile.get("twelfth_stream") or student_profile.get("target_field", "tech")
        budget = student_profile.get("total_budget", 15)

        if not self.api_key:
            # High quality synthetic fallback dilemma tailored to stream
            return {
                "id": "gemini_gen_dilemma_1",
                "trait": "risk",
                "is_generative": True,
                "prompt": f"You are entering the {target_field} sector with a total degree budget of ₹{budget}L. A Series-B startup in Indiranagar offers you ₹7L + ₹5L ESOPs with high autonomy, while an established MNC in Hinjewadi offers ₹10L fixed with mandatory 3-year bond. Which choice reflects your core driver?",
                "options": [
                    {"label": "A) Take the Indiranagar Startup — high autonomy & equity upside match my appetite", "score": 1.5, "autonomy_bias": 1.0},
                    {"label": "B) Take the Hinjewadi MNC — fixed package and structured stability matter most", "score": -1.2, "value_bias": 0.8},
                    {"label": "C) Negotiate with the startup for a higher cash component before deciding", "score": 0.3, "value_bias": 0.4},
                    {"label": "D) Decline both — keep looking for remote international opportunities", "score": 0.8, "risk_bias": 0.9},
                ],
            }

        prompt = f"""
        You are IndiaLens Dynamic CAT Diagnostic Engine.
        Create 1 highly realistic, non-repetitive micro-dilemma scenario for an Indian student with:
        Field/Stream: {target_field}
        Total Budget: ₹{budget} Lakhs
        Current Trait Estimates: {traits}

        Return ONLY a JSON object with this exact structure:
        {{
            "id": "gemini_dilemma_dyn",
            "trait": "risk",
            "prompt": "Scenario text here (under 50 words, with specific INR values and realistic Indian locations/companies)",
            "options": [
                {{"label": "A) Option 1 text", "score": 1.2}},
                {{"label": "B) Option 2 text", "score": -1.0}},
                {{"label": "C) Option 3 text", "score": 0.4}},
                {{"label": "D) Option 4 text", "score": -0.5}}
            ]
        }}
        """

        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"{self.api_url}?key={self.api_key}",
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        # Parse JSON from response
                        import json
                        clean_text = text.strip().strip("```json").strip("```").strip()
                        parsed = json.loads(clean_text)
                        parsed["is_generative"] = True
                        return parsed
        except Exception as e:
            logger.warning(f"Failed to generate Gemini scenario: {e}")

        return {
            "id": "gemini_gen_dilemma_fallback",
            "trait": "risk",
            "is_generative": True,
            "prompt": f"You are evaluating opportunities in {target_field}. Would you prefer a fast-track leadership program in a Tier-2 city with ₹12L salary or a specialized AI engineer role in Bengaluru with ₹9L salary?",
            "options": [
                {"label": "A) Fast-track leadership in Tier-2 city — salary and career growth", "score": -0.8, "value_bias": 1.0},
                {"label": "B) AI engineer in Bengaluru — ecosystem and technical skill development", "score": 1.2, "ai_bias": 1.5},
                {"label": "C) Hybrid approach — start in Bengaluru, transition to leadership later", "score": 0.4, "autonomy_bias": 0.5},
                {"label": "D) Neither — focus on higher studies (GATE/CAT/GRE)", "score": -1.0, "risk_bias": -0.5},
            ],
        }


gemini_advisor_service = GeminiAdvisorService()

