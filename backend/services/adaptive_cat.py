"""
IndiaLens Backend — 3PL Computerized Adaptive Testing (CAT) Engine

3-Parameter Logistic IRT Model:
  P(x = 1 | θ) = c + (1 - c) / (1 + exp(-a * (θ - b)))

Fisher Information (3PL):
  I(θ) = a² * (P(θ) - c)² * (1 - P(θ)) / ((1 - c)² * P(θ))

Multidimensional latent trait vector θ ∈ [-3.0, +3.0]⁴:
  - θ_risk      : Risk Appetite & Uncertainty Tolerance
  - θ_value     : Economic Salary & ROI Maximization
  - θ_autonomy  : Entrepreneurial / Startup vs Corporate Alignment
  - θ_ai        : AI Adaptability & Future Upskilling Propensity

Adaptive routing:
  - Items selected by max Fisher Information on the CURRENT estimate of the target trait
  - After a trait is answered ≥2 times, that trait's SE is lower; engine pivots to next weakest-SE trait
  - Prevents the bank-exhaustion problem where both high and low theta students get same sequence
  - Terminates when max SE < 0.40 OR all 8 items answered

Item Bank Design:
  - 5 items per trait (20 total)
  - Each trait has: 1 easy (b≈-1.2), 1 below-avg (b≈-0.4), 1 medium (b≈0.2), 1 hard (b≈0.8), 1 very hard (b≈1.5)
  - High θ student gets progressively harder items on their strong trait
  - Low θ student gets easier items, diverging from the high-θ path by item 2
"""
import math
import logging
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)

# ── 20-Item Pre-Calibrated 3PL Bank (5 per trait, graded difficulty) ─────────
ITEM_BANK: List[Dict[str, Any]] = [

    # ── RISK APPETITE (θ_risk) ─────────────────────────────────────────────────
    {
        "id": "risk_easy",
        "trait": "risk",
        "a": 1.4, "b": -1.2, "c": 0.05,
        "prompt": "Your family offers to fully fund any degree in India with zero loan required. How important is 'brand name' of the college to you?",
        "options": [
            {"label": "A) Extremely — prestige signals quality and network", "score": 0.5, "value_bias": 0.4},
            {"label": "B) Matters but ROI and placement matters more", "score": 1.0, "value_bias": 0.8},
            {"label": "C) Not at all — I'll pick any accredited college with best fee/outcome ratio", "score": 1.5},
            {"label": "D) I would defer and work for a year before deciding", "score": -0.5},
        ],
    },
    {
        "id": "risk_belavg",
        "trait": "risk",
        "a": 1.5, "b": -0.4, "c": 0.05,
        "prompt": "You are offered two seats: NIT Trichy CSE at ₹5.5L total fees vs. a private Tier-1 college CSE at ₹15L with a 92% placement record. Your family can fund ₹10L max.",
        "options": [
            {"label": "A) Take NIT Trichy — government brand, lower cost, safe", "score": -0.8, "value_bias": 0.3},
            {"label": "B) Private college — higher fee but outcome data supports the investment", "score": 1.2, "value_bias": 1.2},
            {"label": "C) Take an education loan for the private college — worth the risk", "score": 1.6},
            {"label": "D) Reappear for JEE next year to get a better NIT", "score": -1.5},
        ],
    },
    {
        "id": "risk_med",
        "trait": "risk",
        "a": 1.6, "b": 0.2, "c": 0.05,
        "prompt": "A venture studio offers ₹6L stipend + 5% equity in an early-stage AI firm vs. a ₹12L fixed package at an established IT Services major. Your reaction?",
        "options": [
            {"label": "A) Take the IT Services major for guaranteed stability & zero risk", "score": -1.5, "value_bias": 0.2},
            {"label": "B) Negotiate higher fixed salary at IT services, ignore equity", "score": -0.8, "value_bias": 0.5},
            {"label": "C) Choose venture studio — equity upside and early ownership matter more", "score": 1.4, "autonomy_bias": 1.2},
            {"label": "D) Split: take IT job, build startup prototype on weekends", "score": 0.6, "autonomy_bias": 0.8},
        ],
    },
    {
        "id": "risk_hard",
        "trait": "risk",
        "a": 1.7, "b": 0.8, "c": 0.05,
        "prompt": "You have a job offer in Bangalore at ₹18L. A YCombinator application is live with 3% acceptance. Deadline clashes — you must choose one right now.",
        "options": [
            {"label": "A) Accept Bangalore offer immediately — certainty of income is paramount", "score": -1.8},
            {"label": "B) Apply to YC, negotiate Bangalore offer deadline (risky)", "score": 1.2, "autonomy_bias": 0.8},
            {"label": "C) Apply YC. If rejected, scramble for next hiring cycle", "score": 1.7, "autonomy_bias": 1.5},
            {"label": "D) Withdraw both — travel for 3 months to ideate", "score": -0.5},
        ],
    },
    {
        "id": "risk_vhard",
        "trait": "risk",
        "a": 1.8, "b": 1.5, "c": 0.05,
        "prompt": "You're 25, 2 years into a ₹22L/yr job, with ₹8L savings. An MIT Media Lab PhD (5-year, ~$38K stipend) accepts you. Family depends on your contribution. Do you go?",
        "options": [
            {"label": "A) No — financial responsibility to family is non-negotiable", "score": -1.8},
            {"label": "B) Yes — this is a once-in-a-decade opportunity, family will adapt", "score": 1.9},
            {"label": "C) Defer 1 year to save more; then accept", "score": 0.4},
            {"label": "D) Negotiate remote PhD or part-time PhD options first", "score": 0.8},
        ],
    },

    # ── VALUE / ROI MAXIMIZATION (θ_value) ────────────────────────────────────
    {
        "id": "value_easy",
        "trait": "value",
        "a": 1.3, "b": -1.2, "c": 0.05,
        "prompt": "A friend says 'follow your passion, salary will follow.' How much do you agree?",
        "options": [
            {"label": "A) Completely — passion-driven careers are sustainable long-term", "score": -1.5},
            {"label": "B) Mostly — but salary must cross a livable minimum", "score": -0.5, "risk_bias": -0.2},
            {"label": "C) Somewhat — but I actively model expected earnings before choosing", "score": 0.8},
            {"label": "D) Disagree entirely — career choice is a financial decision first", "score": 1.5},
        ],
    },
    {
        "id": "value_belavg",
        "trait": "value",
        "a": 1.4, "b": -0.4, "c": 0.05,
        "prompt": "When choosing a degree, what is your non-negotiable decision metric?",
        "options": [
            {"label": "A) 1-Year Median Salary Placement & Payback Horizon (< 3 years)", "score": 1.5, "risk_bias": 0.2},
            {"label": "B) Institutional Alumni Network & Global Brand Reputation", "score": 0.4, "autonomy_bias": -0.3},
            {"label": "C) WLB, Location Flexibility & Low Stress Working Conditions", "score": -1.2, "risk_bias": -0.5},
            {"label": "D) Alignment with personal passion, regardless of initial pay", "score": -1.5, "risk_bias": 0.5},
        ],
    },
    {
        "id": "value_med",
        "trait": "value",
        "a": 1.3, "b": 0.3, "c": 0.05,
        "prompt": "After 2 years at your job, two promotions are offered simultaneously:",
        "options": [
            {"label": "A) Team Lead at current company: 15% hike, steady workload, familiar team", "score": -0.5, "risk_bias": -0.6},
            {"label": "B) High-Growth IC role at competitor: 60% hike, intense hours, new stack", "score": 1.6, "risk_bias": 0.9},
            {"label": "C) International transfer to regional office: 30% hike, global exposure", "score": 0.8, "autonomy_bias": 0.5},
            {"label": "D) Internal mobility to R&D division: same pay, cutting-edge tech learning", "score": -0.2, "ai_bias": 1.2},
        ],
    },
    {
        "id": "value_hard",
        "trait": "value",
        "a": 1.5, "b": 0.9, "c": 0.05,
        "prompt": "You can complete an MBA from IIM-A (₹26L, top network, 2 years) vs. a fully-funded Masters from TU Munich (€0 tuition, Germany PR path, 2 years). Which one?",
        "options": [
            {"label": "A) IIM-A — domestic network + immediate India CTC upside (₹35-50L) is unmatched", "score": 1.5, "risk_bias": -0.2},
            {"label": "B) TU Munich — zero-cost + EU Blue Card path + long-term global upside", "score": 0.8, "autonomy_bias": 0.5},
            {"label": "C) Quantify 10-year NPV for both then decide — no emotion", "score": 1.8},
            {"label": "D) Neither — I'll do an online MBA and deploy the ₹26L as startup capital", "score": -0.2, "autonomy_bias": 1.2},
        ],
    },
    {
        "id": "value_vhard",
        "trait": "value",
        "a": 1.6, "b": 1.5, "c": 0.05,
        "prompt": "You're comparing two 20-year career paths: Path A gives you ₹1.2Cr cumulative earnings but high WLB. Path B gives ₹2.8Cr cumulative but 60-hr weeks and high stress. NPV at 7% discount rate favors B. What do you choose?",
        "options": [
            {"label": "A) Path A — money isn't everything; health and time are irreplaceable", "score": -1.5},
            {"label": "B) Path B — NPV analysis is the correct framework; I optimize for wealth", "score": 1.9},
            {"label": "C) Path B for 10 years then transition to Path A lifestyle at peak earning", "score": 1.2, "risk_bias": 0.5},
            {"label": "D) Build a hybrid — consulting model: high-pay project-based, not salaried", "score": 0.8, "autonomy_bias": 1.0},
        ],
    },

    # ── AUTONOMY / ENTREPRENEURIAL ALIGNMENT (θ_autonomy) ─────────────────────
    {
        "id": "auto_easy",
        "trait": "autonomy",
        "a": 1.3, "b": -1.2, "c": 0.05,
        "prompt": "In your dream work environment, who sets your daily tasks?",
        "options": [
            {"label": "A) My manager — I want clear direction and defined deliverables", "score": -1.5},
            {"label": "B) My team — collaborative goal-setting with shared ownership", "score": -0.3},
            {"label": "C) I define my own OKRs aligned to business goals", "score": 1.2},
            {"label": "D) Nobody — I'm building my own thing entirely", "score": 1.8},
        ],
    },
    {
        "id": "auto_belavg",
        "trait": "autonomy",
        "a": 1.5, "b": -0.3, "c": 0.05,
        "prompt": "If given a semester off, what would you build?",
        "options": [
            {"label": "A) Launch an open-source tool, API, or hardware prototype with GitHub traction", "score": 1.8, "ai_bias": 0.8},
            {"label": "B) Complete 3 certified specializations from top universities", "score": 0.2, "value_bias": 0.6},
            {"label": "C) Secure a structured 6-month corporate internship at an MNC", "score": -1.2, "risk_bias": -0.6},
            {"label": "D) Prepare rigorously for GATE/CAT/GRE for better program access", "score": -0.8, "value_bias": 0.4},
        ],
    },
    {
        "id": "auto_med",
        "trait": "autonomy",
        "a": 1.8, "b": 0.5, "c": 0.05,
        "prompt": "Your ideal 5-year work culture is best described as:",
        "options": [
            {"label": "A) Founding/Early Employee at a high-velocity startup with unstructured responsibilities", "score": 1.8, "risk_bias": 1.0},
            {"label": "B) Specialist Consultant at top firm with clear promotion tracks", "score": -0.5, "value_bias": 0.8},
            {"label": "C) Core Engineer at a Fortune 500 company with solid WLB", "score": -1.2, "risk_bias": -0.8},
            {"label": "D) Independent Freelancer / Solopreneur managing client retainers", "score": 1.5, "risk_bias": 0.6},
        ],
    },
    {
        "id": "auto_hard",
        "trait": "autonomy",
        "a": 1.7, "b": 0.9, "c": 0.05,
        "prompt": "You've built a SaaS product that earns ₹1.2L/month but requires 50-hr weeks. A ₹25L/yr offer from Google lands in your inbox. What do you do?",
        "options": [
            {"label": "A) Accept Google — brand, compensation, and structured growth beats uncertainty", "score": -1.5},
            {"label": "B) Keep the SaaS — ownership and equity potential is non-negotiable", "score": 1.8},
            {"label": "C) Take Google, keep the SaaS on the side (lower hours)", "score": 0.3, "risk_bias": -0.2},
            {"label": "D) Hire someone to run the SaaS, take Google for 18 months, then revisit", "score": 0.8, "value_bias": 0.5},
        ],
    },
    {
        "id": "auto_vhard",
        "trait": "autonomy",
        "a": 1.9, "b": 1.5, "c": 0.05,
        "prompt": "At age 28, your startup fails (₹15L personal investment lost). You have 3 months of runway. What's your next move?",
        "options": [
            {"label": "A) Get a salaried job immediately — financial recovery takes priority", "score": -1.8},
            {"label": "B) Start over with lessons learned — failure is the tuition for startup education", "score": 1.9},
            {"label": "C) Join a Series-B company as an early employee — near-founder upside, less founder risk", "score": 1.2, "risk_bias": 0.4},
            {"label": "D) Consult for 6 months, rebuild capital, then decide", "score": 0.5},
        ],
    },

    # ── AI ADAPTABILITY (θ_ai) ─────────────────────────────────────────────────
    {
        "id": "ai_easy",
        "trait": "ai_adaptability",
        "a": 1.3, "b": -1.2, "c": 0.05,
        "prompt": "How often do you use AI tools (ChatGPT, Gemini, Copilot, etc.) in your current work or studies?",
        "options": [
            {"label": "A) Never — I prefer not to rely on AI tools", "score": -1.5},
            {"label": "B) Occasionally for simple tasks like grammar checks", "score": -0.5},
            {"label": "C) Regularly — for research, drafting, debugging, ideation", "score": 1.2},
            {"label": "D) Daily and deeply — I've built workflows that orchestrate multiple AI agents", "score": 1.9},
        ],
    },
    {
        "id": "ai_belavg",
        "trait": "ai_adaptability",
        "a": 1.4, "b": -0.3, "c": 0.05,
        "prompt": "GenAI tools automate 40% of entry-level tasks in your target domain. How do you respond?",
        "options": [
            {"label": "A) Immediately master AI workflow tools & double down on system design", "score": 1.6, "risk_bias": 0.5},
            {"label": "B) Shift toward human-centric roles (Management, Client Strategy, Sales)", "score": 0.4, "autonomy_bias": 0.2},
            {"label": "C) Seek government or regulated sectors protected from rapid automation", "score": -1.4, "risk_bias": -1.2},
            {"label": "D) Wait and see before making changes", "score": -0.8, "risk_bias": -0.4},
        ],
    },
    {
        "id": "ai_med",
        "trait": "ai_adaptability",
        "a": 1.6, "b": 0.4, "c": 0.05,
        "prompt": "When evaluating your 10-year career resilience, where do you place your defensive moat?",
        "options": [
            {"label": "A) AI agent development, prompt engineering & autonomous system orchestration", "score": 1.9, "risk_bias": 0.6},
            {"label": "B) Deep physical engineering, wet-lab research, or clinical physical care", "score": 1.2, "risk_bias": -0.3},
            {"label": "C) C-suite stakeholder management, executive negotiation, high-empathy sales", "score": 0.8, "autonomy_bias": 0.5},
            {"label": "D) Statutory professional licenses (CA, Bar, Medical Council) as regulatory barriers", "score": -0.6, "risk_bias": -1.2},
        ],
    },
    {
        "id": "ai_hard",
        "trait": "ai_adaptability",
        "a": 1.7, "b": 0.9, "c": 0.05,
        "prompt": "A major consulting firm offers you ₹30L/yr as a 'Prompt Engineer & AI Systems Lead'. A traditional Software Engineer role at the same company offers ₹32L/yr with standard Java stack. Which do you pick?",
        "options": [
            {"label": "A) Software Engineer — the Java role is more stable and proven", "score": -1.2},
            {"label": "B) Prompt Engineer — I'm betting on AI infrastructure being the next decade's backbone", "score": 1.7},
            {"label": "C) Neither — I'd freelance as an AI integration consultant at ₹50K/day rate", "score": 1.5, "autonomy_bias": 1.2},
            {"label": "D) I'd ask for a hybrid role combining both skill sets", "score": 0.4},
        ],
    },
    {
        "id": "ai_vhard",
        "trait": "ai_adaptability",
        "a": 1.8, "b": 1.6, "c": 0.05,
        "prompt": "GPT-6 level models (2027) automate 70% of coding tasks. What is your 3-year career pivot strategy?",
        "options": [
            {"label": "A) Stay in coding — there will always be a human-in-the-loop premium", "score": -0.5},
            {"label": "B) Move entirely to AI systems architecture: training pipelines, RL fine-tuning, inference optimization", "score": 1.9},
            {"label": "C) Pivot to business roles that use AI as a tool, not as the product itself", "score": 0.6, "value_bias": 0.5},
            {"label": "D) Launch an AI-native product company before the window closes", "score": 1.6, "autonomy_bias": 1.2, "risk_bias": 0.8},
        ],
    },
]


class AdaptiveCATService:
    """
    3PL IRT Adaptive CAT Engine.

    Adaptive routing mechanism:
    1. Compute Standard Error per trait from answered items.
    2. Select the trait with HIGHEST SE (most uncertain) as the target.
    3. From items in that target trait, pick the one with max Fisher Information
       at the CURRENT theta estimate for that trait.
    4. This ensures high-theta students get harder questions on their strong traits,
       and low-theta students get easier ones — diverging paths by question 2.
    """

    def __init__(self):
        self.item_bank = list(ITEM_BANK)
        try:
            # `ml` is a top-level sibling package (deployed as
            # `uvicorn api.main:app` from backend/). `backend.ml...` raised
            # ModuleNotFoundError in that layout, and the bare `except` below
            # swallowed it — so production silently ran with a fraction of the
            # calibrated item bank and logged only a warning at startup.
            from ml.psychometric_bank import ITEM_BANK as COMPREHENSIVE_BANK
            for comp_item in COMPREHENSIVE_BANK:
                mapped_id = comp_item.get("id")
                if not any(it["id"] == mapped_id for it in self.item_bank):
                    trait = comp_item.get("trait", "risk")
                    if trait == "ai_adapt":
                        trait = "ai_adaptability"
                    elif trait not in ["risk", "value", "autonomy", "ai_adaptability"]:
                        continue
                    options = []
                    for opt in comp_item.get("options", []):
                        scores = opt.get("scores", {})
                        primary_score = scores.get(comp_item.get("trait"), 0.0)
                        options.append({
                            "label": opt.get("text"),
                            "score": primary_score,
                            "value_bias": scores.get("value", 0.0),
                        })
                    self.item_bank.append({
                        "id": mapped_id,
                        "trait": trait,
                        "a": comp_item.get("a", 1.5),
                        "b": comp_item.get("b", 0.0),
                        "c": comp_item.get("c", 0.05),
                        "prompt": comp_item.get("text"),
                        "options": options,
                    })
        except Exception as e:
            logger.warning(f"Could not load comprehensive psychometric bank into CAT: {e}")

    @staticmethod
    def calc_3pl_prob(theta: float, a: float, b: float, c: float = 0.05) -> float:
        """3PL: P(θ) = c + (1 - c) / (1 + exp(-a(θ - b)))"""
        logit = max(-12.0, min(12.0, -a * (theta - b)))
        return c + ((1.0 - c) / (1.0 + math.exp(logit)))

    def calculate_fisher_information(self, item: Dict[str, Any], theta: float) -> float:
        """3PL Fisher Information: I(θ) = a² * (P-c)² * (1-P) / ((1-c)² * P)"""
        a = item.get("a", 1.5)
        b = item.get("b", 0.0)
        c = item.get("c", 0.05)
        p = self.calc_3pl_prob(theta, a, b, c)
        if p <= c + 1e-6 or p >= 1.0 - 1e-6:
            return 0.001
        numerator = (a ** 2) * ((p - c) ** 2) * (1.0 - p)
        denominator = ((1.0 - c) ** 2) * p
        return max(0.001, numerator / max(1e-9, denominator))

    def compute_trait_estimates(self, responses: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        EAP (Expected A Posteriori) trait estimation from response history.
        Returns theta vector clamped to [-3.0, +3.0].
        """
        accum = {"risk": 0.0, "value": 0.0, "autonomy": 0.0, "ai_adaptability": 0.0}
        counts = {k: 0.0 for k in accum}

        for resp in responses:
            item_id = resp.get("item_id", "")
            score = float(resp.get("score", 0.0))

            matching = next((it for it in self.item_bank if it["id"] == item_id), None)
            trait_name = matching["trait"] if matching else resp.get("trait", "risk")

            if trait_name in accum:
                accum[trait_name] += score
                counts[trait_name] += 1.0

            # Cross-trait bias contributions (weighted lower)
            for bias_key, trait_target in [
                ("value_bias", "value"), ("risk_bias", "risk"),
                ("autonomy_bias", "autonomy"), ("ai_bias", "ai_adaptability"),
            ]:
                if resp.get(bias_key):
                    accum[trait_target] += float(resp[bias_key]) * 0.30
                    counts[trait_target] += 0.30

        result = {}
        for k in accum:
            cnt = max(1.0, counts[k])
            result[k] = round(max(-3.0, min(3.0, accum[k] / cnt)), 3)
        return result

    def compute_trait_se(self, trait: str, answered_items: List[Dict[str, Any]], theta: float) -> float:
        """
        Standard Error for a given trait: SE(θ) = 1 / sqrt(ΣI(θ)).
        Starts at SE=1.2 (high uncertainty) when no items for this trait answered.
        """
        total_info = sum(
            self.calculate_fisher_information(it, theta)
            for it in answered_items
            if it.get("trait") == trait
        )
        if total_info < 0.01:
            return 1.2  # Maximum uncertainty
        return 1.0 / math.sqrt(total_info)

    def select_next_item(
        self,
        answered_ids: List[str],
        current_traits: Dict[str, float],
    ) -> Tuple[Optional[Dict[str, Any]], bool]:
        """
        Adaptive item selection algorithm:

        Step 1: Find the trait with the highest SE (most uncertain = most informative to target next)
        Step 2: From unanswered items in that target trait, pick max Fisher Information item
        Step 3: If target trait is exhausted, fall back to global max-info item
        Step 4: Converge when max SE < 0.40 OR answered >= 8 items

        This guarantees: a high-risk student (θ_risk = +2.0) gets the hard risk items (b=0.8, 1.5)
        while a low-risk student (θ_risk = -1.5) gets easy risk items (b=-1.2, -0.4) — DIFFERENT PATHS.
        """
        unanswered = [it for it in self.item_bank if it["id"] not in answered_ids]

        if not unanswered or len(answered_ids) >= 8:
            return None, True

        answered_items = [it for it in self.item_bank if it["id"] in answered_ids]

        # Compute SE for all 4 traits
        trait_se = {
            trait: self.compute_trait_se(trait, answered_items, current_traits.get(trait, 0.0))
            for trait in ["risk", "value", "autonomy", "ai_adaptability"]
        }

        # Check convergence: all traits SE < 0.40
        max_se = max(trait_se.values())
        if max_se < 0.40 and len(answered_ids) >= 4:
            return None, True

        # Step 1: Target the trait with highest SE (most uncertain)
        target_trait = max(trait_se, key=lambda t: trait_se[t])
        logger.debug(f"Target trait: {target_trait} (SE={trait_se[target_trait]:.3f}), all SE: {trait_se}")

        # Step 2: Get candidate items for target trait
        target_unanswered = [it for it in unanswered if it["trait"] == target_trait]

        if target_unanswered:
            theta_val = current_traits.get(target_trait, 0.0)
            best_item = max(
                target_unanswered,
                key=lambda it: self.calculate_fisher_information(it, theta_val)
            )
        else:
            # Target trait bank exhausted — fall back to global max-info item
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
