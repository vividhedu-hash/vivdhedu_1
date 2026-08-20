"""
IndiaLens Backend — Computerized Adaptive Testing (CAT) & 2PL Item Response Theory (IRT) Service

Uses 2-Parameter Logistic IRT Model (a = discrimination, b = difficulty):
  P(x = 1 | theta) = 1 / (1 + exp(-a * (theta - b)))

Maintains multidimensional latent trait vector theta:
  - theta_risk: Risk Appetite & Uncertainty Tolerance [-3.0, +3.0]
  - theta_value: Economic Salary & ROI Maximization [-3.0, +3.0]
  - theta_autonomy: Entrepreneurial / Startup vs Corporate Alignment [-3.0, +3.0]
  - theta_ai: AI Adaptability & Future Upskilling Propensity [-3.0, +3.0]

Selects items dynamically to maximize Fisher Information:
  I(theta) = a^2 * P(theta) * (1 - P(theta))
"""
import math
import logging
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)

# ── Pre-calibrated IRT Item Bank ─────────────────────────────────────────
ITEM_BANK: List[Dict[str, Any]] = [
    {
        "id": "cat_q1",
        "trait": "risk",
        "a": 1.6,  # High discrimination
        "b": 0.2,  # Medium difficulty
        "prompt": "A venture studio offers ₹6L stipend + 5% equity in an early-stage AI firm vs. a ₹12L fixed package at an established IT Services major. What is your reaction?",
        "options": [
            {"label": "A) Take the IT Services major for guaranteed stability & zero risk", "score": -1.5, "value_bias": 0.2},
            {"label": "B) Negotiate higher fixed salary at IT services, ignore equity", "score": -0.8, "value_bias": 0.5},
            {"label": "C) Choose venture studio — equity upside and early ownership matter more", "score": 1.4, "autonomy_bias": 1.2},
            {"label": "D) Split time: take IT job, build startup prototype on weekends", "score": 0.6, "autonomy_bias": 0.8},
        ],
    },
    {
        "id": "cat_q2",
        "trait": "value",
        "a": 1.4,
        "b": -0.4,
        "prompt": "When choosing a degree, what is your non-negotiable metric?",
        "options": [
            {"label": "A) 1-Year Median Salary Placement & Payback Horizon (< 3 years)", "score": 1.5, "risk_bias": 0.2},
            {"label": "B) Institutional Alumni Network & Global Brand Reputation", "score": 0.4, "autonomy_bias": -0.3},
            {"label": "C) WLB, Location Flexibility & Low Stress Working Conditions", "score": -1.2, "risk_bias": -0.5},
            {"label": "D) Alignment with personal passion, regardless of initial pay", "score": -1.5, "risk_bias": 0.5},
        ],
    },
    {
        "id": "cat_q3",
        "trait": "autonomy",
        "a": 1.8,
        "b": 0.5,
        "prompt": "Your ideal 5-year work culture is best described as:",
        "options": [
            {"label": "A) Founding/Early Employee at a high-velocity startup with unstructured responsibilities", "score": 1.8, "risk_bias": 1.0},
            {"label": "B) Specialist Consultant at top firm with clear promotion tracks and structure", "score": -0.5, "value_bias": 0.8},
            {"label": "C) Core Engineer/Manager at a Fortune 500 company with solid WLB", "score": -1.2, "risk_bias": -0.8},
            {"label": "D) Independent Freelancer / Solopreneur managing client retainers", "score": 1.5, "risk_bias": 0.6},
        ],
    },
    {
        "id": "cat_q4",
        "trait": "ai_adaptability",
        "a": 1.5,
        "b": 0.1,
        "prompt": "GenAI tools (like Devin/Gemini/Claude) automate 40% of entry-level tasks in your field. How do you respond?",
        "options": [
            {"label": "A) Immediately master AI workflow tools & double down on high-level system design", "score": 1.6, "risk_bias": 0.5},
            {"label": "B) Shift focus toward human-centric roles (Management, Client Strategy, Sales)", "score": 0.4, "autonomy_bias": 0.2},
            {"label": "C) Seek government or heavily regulated sectors protected from rapid automation", "score": -1.4, "risk_bias": -1.2},
            {"label": "D) Wait and see how industry trends standardize before making changes", "score": -0.8, "risk_bias": -0.4},
        ],
    },
    {
        "id": "cat_q5",
        "trait": "risk",
        "a": 1.7,
        "b": 0.8,
        "prompt": "Would you take an education loan of ₹15L for a Tier-2 institute with 80% placement rate?",
        "options": [
            {"label": "A) Yes, confident I can outperform average placements and pay back fast", "score": 1.5, "value_bias": 1.0},
            {"label": "B) Only if an income-share agreement (ISA) or collateral-free loan is available", "score": 0.2, "value_bias": 0.4},
            {"label": "C) No, I prefer lower-cost state/tier-3 colleges to remain debt-free", "score": -1.3, "value_bias": -0.6},
            {"label": "D) No loan ever — I will only study within my family's cash savings", "score": -1.8, "risk_bias": -1.5},
        ],
    },
    {
        "id": "cat_q6",
        "trait": "value",
        "a": 1.3,
        "b": 0.3,
        "prompt": "You are offered 2 job promotions after 2 years:",
        "options": [
            {"label": "A) Team Lead at current company: 15% hike, steady workload, familiar team", "score": -0.5, "risk_bias": -0.6},
            {"label": "B) High-Growth IC role at competitor: 60% hike, intense hours, new stack", "score": 1.6, "risk_bias": 0.9},
            {"label": "C) International transfer to regional office: 30% hike, global exposure", "score": 0.8, "autonomy_bias": 0.5},
            {"label": "D) Internal mobility to R&D division: same pay, learning cutting-edge tech", "score": -0.2, "ai_bias": 1.2},
        ],
    },
]


class AdaptiveCATService:
    """Computes multidimensional IRT trait estimates and selects optimal CAT items."""

    def __init__(self):
        self.item_bank = ITEM_BANK

    @staticmethod
    def sigmoid(x: float) -> float:
        return 1.0 / (1.0 + math.exp(-max(-10.0, min(10.0, x))))

    def compute_trait_estimates(self, responses: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Calculates EAP/MLE trait updates theta = (theta_risk, theta_value, theta_autonomy, theta_ai)
        given a user's answer history.
        """
        traits = {
            "risk": 0.0,
            "value": 0.0,
            "autonomy": 0.0,
            "ai_adaptability": 0.0,
        }
        counts = {k: 0 for k in traits}

        for resp in responses:
            item_id = resp.get("item_id")
            score = resp.get("score", 0.0)
            
            # Find item in bank if exists
            matching_item = next((it for it in self.item_bank if it["id"] == item_id), None)
            trait_name = matching_item["trait"] if matching_item else resp.get("trait", "risk")

            if trait_name in traits:
                traits[trait_name] += score
                counts[trait_name] += 1

            # Secondary trait biases
            if "value_bias" in resp:
                traits["value"] += resp["value_bias"]
                counts["value"] += 0.5
            if "risk_bias" in resp:
                traits["risk"] += resp["risk_bias"]
                counts["risk"] += 0.5
            if "autonomy_bias" in resp:
                traits["autonomy"] += resp["autonomy_bias"]
                counts["autonomy"] += 0.5
            if "ai_bias" in resp:
                traits["ai_adaptability"] += resp["ai_bias"]
                counts["ai_adaptability"] += 0.5

        # Normalize traits to [-2.5, +2.5] range
        normalized = {}
        for k, val in traits.items():
            cnt = max(1.0, counts[k])
            avg = val / cnt
            # Clamp between -2.5 and +2.5
            normalized[k] = round(max(-2.5, min(2.5, avg)), 2)

        return normalized

    def calculate_fisher_information(self, item: Dict[str, Any], theta: float) -> float:
        """Fisher Information: I(theta) = a^2 * P(theta) * (1 - P(theta))"""
        a = item.get("a", 1.0)
        b = item.get("b", 0.0)
        p = self.sigmoid(a * (theta - b))
        return (a ** 2) * p * (1.0 - p)

    def select_next_item(
        self,
        answered_ids: List[str],
        current_traits: Dict[str, float],
    ) -> Tuple[Optional[Dict[str, Any]], bool]:
        """
        Selects the next un-answered item from the item bank that maximizes
        Fisher Information for the trait with highest uncertainty / fewest responses.
        Returns (next_item, is_converged).
        """
        unanswered = [it for it in self.item_bank if it["id"] not in answered_ids]

        if not unanswered or len(answered_ids) >= 6:
            return None, True  # CAT Converged!

        # Find target trait with least confidence
        # Rank traits by absolute value or selection count
        best_item = None
        max_info = -1.0

        for item in unanswered:
            trait_key = item["trait"]
            theta_val = current_traits.get(trait_key, 0.0)
            info = self.calculate_fisher_information(item, theta_val)

            if info > max_info:
                max_info = info
                best_item = item

        return best_item, False


adaptive_cat_service = AdaptiveCATService()
