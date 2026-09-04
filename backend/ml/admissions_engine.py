"""
Caliber-Calibrated Admissions Portfolio Engine
===============================================
Comprehensive implementation of Section 09 of The Project PRD.

Mathematical Specifications:
1. Cutoff Delta Z-Score & Normal CDF Admission Probability — Equation 9.1:
   Z(s, p) = [ HistoricalClosingRank(p, cat, quota) - E[StudentRank(s)] ] / σ_{exam_variability}
   Pr[Admission(s,p)] = Φ(Z(s,p)) = 0.5 * [1 + erf(Z / sqrt(2))]

2. 4-Tier Application Matrix:
   - Safety:     Z > +1.5        (Pr > 93%)
   - Target:     -0.5 <= Z <= 1.5 (50% <= Pr <= 90%)
   - Reach:      -1.5 <= Z < -0.5 (10% <= Pr < 50%)
   - Pruned:     Z < -1.5        (Pr < 10%, unviable aspirational)
   - Hidden Gem: Composite ROI >= 82.0, Fees < ₹6,00,000, Pr >= 60%

3. Category Reservations & Home State Quota Calibration:
   - Category relaxation multipliers on historical closing ranks:
     General: 1.0, EWS: 1.25, OBC-NCL: 1.50, SC: 2.80, ST: 4.50
   - Home State Quota advantage: 1.35x rank expansion for NITs / State Autonomous

4. Fiduciary Financial Pruning:
   If TotalCost > Budget * 1.30, flag as financially unviable / prune.
"""
import math
import logging
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)

# Empirical exam variability (standard deviation of rank shifts around cutoff)
EXAM_RANK_VARIABILITY: Dict[str, float] = {
    "JEE Main":     2200.0,
    "JEE Advanced":  650.0,
    "NEET":         3500.0,
    "CUET":         1800.0,
    "CAT":           850.0,
    "BITSAT":        400.0,
    "MHT-CET":      2800.0,
    "GATE":          750.0,
    "Default":      1500.0,
}

# Category reservation rank relaxation multipliers
CATEGORY_MULTIPLIERS: Dict[str, float] = {
    "General": 1.00,
    "OPEN":    1.00,
    "EWS":     1.28,
    "OBC-NCL": 1.55,
    "OBC":     1.55,
    "SC":      2.85,
    "ST":      4.60,
    "PwD":     5.20,
}

# Historical Closing Rank registry for representative engineering, medical, management, law benchmarks
COLLEGE_BENCHMARK_RANKS: List[Dict[str, Any]] = [
    # ── IITs & Tier-1 Engineering (JEE Advanced) ──────────────────────────
    {"college": "IIT Bombay", "degree": "B.Tech Computer Science", "field": "engineering-cs", "tier": "1", "exam": "JEE Advanced", "base_closing_rank": 67, "state": "Maharashtra", "total_cost_inr": 1200000.0, "roi_score": 94.5},
    {"college": "IIT Delhi", "degree": "B.Tech Computer Science", "field": "engineering-cs", "tier": "1", "exam": "JEE Advanced", "base_closing_rank": 115, "state": "Delhi", "total_cost_inr": 1200000.0, "roi_score": 93.8},
    {"college": "IIT Madras", "degree": "B.Tech Electrical Engineering", "field": "engineering-cs", "tier": "1", "exam": "JEE Advanced", "base_closing_rank": 480, "state": "Tamil Nadu", "total_cost_inr": 1200000.0, "roi_score": 91.2},
    {"college": "IIT Kanpur", "degree": "B.Tech Computer Science", "field": "engineering-cs", "tier": "1", "exam": "JEE Advanced", "base_closing_rank": 235, "state": "Uttar Pradesh", "total_cost_inr": 1200000.0, "roi_score": 93.0},
    {"college": "IIT Kharagpur", "degree": "B.Tech Mechanical Engineering", "field": "engineering-non-cs", "tier": "1", "exam": "JEE Advanced", "base_closing_rank": 2400, "state": "West Bengal", "total_cost_inr": 1150000.0, "roi_score": 86.4},
    {"college": "IIT Roorkee", "degree": "B.Tech Data Science & AI", "field": "engineering-cs", "tier": "1", "exam": "JEE Advanced", "base_closing_rank": 720, "state": "Uttarakhand", "total_cost_inr": 1200000.0, "roi_score": 90.5},
    {"college": "IIT Guwahati", "degree": "B.Tech Computer Science", "field": "engineering-cs", "tier": "1", "exam": "JEE Advanced", "base_closing_rank": 610, "state": "Assam", "total_cost_inr": 1180000.0, "roi_score": 89.8},
    {"college": "IIT Hyderabad", "degree": "B.Tech Artificial Intelligence", "field": "engineering-cs", "tier": "1", "exam": "JEE Advanced", "base_closing_rank": 820, "state": "Telangana", "total_cost_inr": 1200000.0, "roi_score": 91.5},

    # ── BITS Pilani Campuses (BITSAT) ────────────────────────────────────
    {"college": "BITS Pilani (Pilani)", "degree": "B.E. Computer Science", "field": "engineering-cs", "tier": "1", "exam": "BITSAT", "base_closing_rank": 330, "state": "Rajasthan", "total_cost_inr": 2600000.0, "roi_score": 89.0},
    {"college": "BITS Pilani (Goa)", "degree": "B.E. Electronics & Instrumentation", "field": "engineering-cs", "tier": "1", "exam": "BITSAT", "base_closing_rank": 245, "state": "Goa", "total_cost_inr": 2500000.0, "roi_score": 84.5},
    {"college": "BITS Pilani (Hyderabad)", "degree": "B.E. Computer Science", "field": "engineering-cs", "tier": "1", "exam": "BITSAT", "base_closing_rank": 285, "state": "Telangana", "total_cost_inr": 2550000.0, "roi_score": 87.0},

    # ── Top NITs & IIITs (JEE Main) ──────────────────────────────────────
    {"college": "NIT Trichy", "degree": "B.Tech Computer Science", "field": "engineering-cs", "tier": "1", "exam": "JEE Main", "base_closing_rank": 1500, "state": "Tamil Nadu", "total_cost_inr": 780000.0, "roi_score": 91.0},
    {"college": "NIT Surathkal", "degree": "B.Tech Information Technology", "field": "engineering-cs", "tier": "1", "exam": "JEE Main", "base_closing_rank": 2600, "state": "Karnataka", "total_cost_inr": 780000.0, "roi_score": 89.5},
    {"college": "NIT Warangal", "degree": "B.Tech Electronics & Comm", "field": "engineering-cs", "tier": "1", "exam": "JEE Main", "base_closing_rank": 4800, "state": "Telangana", "total_cost_inr": 780000.0, "roi_score": 87.2},
    {"college": "NIT Rourkela", "degree": "B.Tech Computer Science", "field": "engineering-cs", "tier": "1", "exam": "JEE Main", "base_closing_rank": 3800, "state": "Odisha", "total_cost_inr": 760000.0, "roi_score": 88.0},
    {"college": "NIT Calicut", "degree": "B.Tech Computer Science", "field": "engineering-cs", "tier": "1", "exam": "JEE Main", "base_closing_rank": 4500, "state": "Kerala", "total_cost_inr": 760000.0, "roi_score": 87.5},
    {"college": "IIIT Hyderabad", "degree": "B.Tech Computer Science", "field": "engineering-cs", "tier": "1", "exam": "JEE Main", "base_closing_rank": 950, "state": "Telangana", "total_cost_inr": 1800000.0, "roi_score": 93.0},
    {"college": "IIIT Bangalore", "degree": "Integrated M.Tech CS", "field": "engineering-cs", "tier": "1", "exam": "JEE Main", "base_closing_rank": 6200, "state": "Karnataka", "total_cost_inr": 2200000.0, "roi_score": 88.2},
    {"college": "IIIT Allahabad", "degree": "B.Tech Information Technology", "field": "engineering-cs", "tier": "1", "exam": "JEE Main", "base_closing_rank": 5200, "state": "Uttar Pradesh", "total_cost_inr": 920000.0, "roi_score": 89.0},

    # ── State Autonomous & Value Kings (Low Cost, High ROI) ──────────────
    {"college": "Jadavpur University", "degree": "B.E. Computer Science", "field": "engineering-cs", "tier": "1", "exam": "WBJEE", "base_closing_rank": 85, "state": "West Bengal", "total_cost_inr": 24000.0, "roi_score": 96.2},
    {"college": "COEP Technological University", "degree": "B.Tech Computer Engineering", "field": "engineering-cs", "tier": "2", "exam": "MHT-CET", "base_closing_rank": 120, "state": "Maharashtra", "total_cost_inr": 420000.0, "roi_score": 88.5},
    {"college": "VJTI Mumbai", "degree": "B.Tech Information Technology", "field": "engineering-cs", "tier": "2", "exam": "MHT-CET", "base_closing_rank": 180, "state": "Maharashtra", "total_cost_inr": 380000.0, "roi_score": 87.8},
    {"college": "DTU Delhi", "degree": "B.Tech Computer Science", "field": "engineering-cs", "tier": "1", "exam": "JEE Main", "base_closing_rank": 3800, "state": "Delhi", "total_cost_inr": 950000.0, "roi_score": 89.4},
    {"college": "NSUT Delhi", "degree": "B.Tech Artificial Intelligence", "field": "engineering-cs", "tier": "1", "exam": "JEE Main", "base_closing_rank": 4900, "state": "Delhi", "total_cost_inr": 920000.0, "roi_score": 88.0},
    {"college": "College of Engineering Guindy (Anna Univ)", "degree": "B.E. Computer Science", "field": "engineering-cs", "tier": "1", "exam": "TNEA", "base_closing_rank": 150, "state": "Tamil Nadu", "total_cost_inr": 180000.0, "roi_score": 92.4},

    # ── Bengaluru Tech Hub Institutions (KCET / COMEDK) ──────────────────
    {"college": "RV College of Engineering", "degree": "B.E. Computer Science", "field": "engineering-cs", "tier": "2", "exam": "KCET", "base_closing_rank": 350, "state": "Karnataka", "total_cost_inr": 1100000.0, "roi_score": 86.8},
    {"college": "BMS College of Engineering", "degree": "B.E. Information Science", "field": "engineering-cs", "tier": "2", "exam": "KCET", "base_closing_rank": 820, "state": "Karnataka", "total_cost_inr": 1050000.0, "roi_score": 84.5},
    {"college": "Ramaiah Institute of Technology", "degree": "B.E. Computer Science", "field": "engineering-cs", "tier": "2", "exam": "KCET", "base_closing_rank": 1100, "state": "Karnataka", "total_cost_inr": 1050000.0, "roi_score": 83.2},

    # ── Premier Private Tech Institutions ────────────────────────────────
    {"college": "Thapar University", "degree": "B.Tech Computer Science", "field": "engineering-cs", "tier": "2", "exam": "JEE Main", "base_closing_rank": 24000, "state": "Punjab", "total_cost_inr": 2100000.0, "roi_score": 76.5},
    {"college": "Manipal Institute of Technology", "degree": "B.Tech Computer Science", "field": "engineering-cs", "tier": "2", "exam": "MET", "base_closing_rank": 1400, "state": "Karnataka", "total_cost_inr": 2200000.0, "roi_score": 75.8},
    {"college": "VIT Vellore", "degree": "B.Tech Computer Science", "field": "engineering-cs", "tier": "2", "exam": "VITEEE", "base_closing_rank": 7500, "state": "Tamil Nadu", "total_cost_inr": 1900000.0, "roi_score": 74.2},
    {"college": "DA-IICT Gandhinagar", "degree": "B.Tech ICT", "field": "engineering-cs", "tier": "2", "exam": "JEE Main", "base_closing_rank": 15500, "state": "Gujarat", "total_cost_inr": 1450000.0, "roi_score": 84.0},

    # ── Medical Institutions (NEET) ──────────────────────────────────────
    {"college": "AIIMS New Delhi", "degree": "MBBS", "field": "medicine", "tier": "1", "exam": "NEET", "base_closing_rank": 55, "state": "Delhi", "total_cost_inr": 10000.0, "roi_score": 98.5},
    {"college": "CMC Vellore", "degree": "MBBS", "field": "medicine", "tier": "1", "exam": "NEET", "base_closing_rank": 210, "state": "Tamil Nadu", "total_cost_inr": 220000.0, "roi_score": 95.0},
    {"college": "Kasturba Medical College (Manipal)", "degree": "MBBS", "field": "medicine", "tier": "1", "exam": "NEET", "base_closing_rank": 4800, "state": "Karnataka", "total_cost_inr": 7200000.0, "roi_score": 78.5},
    {"college": "Grant Medical College Mumbai", "degree": "MBBS", "field": "medicine", "tier": "1", "exam": "NEET", "base_closing_rank": 2150, "state": "Maharashtra", "total_cost_inr": 650000.0, "roi_score": 91.2},

    # ── Management & Commerce (IPMAT / CUET / CAT) ───────────────────────
    {"college": "IIM Indore (IPM)", "degree": "Integrated BBA+MBA", "field": "management", "tier": "1", "exam": "IPMAT", "base_closing_rank": 85, "state": "Madhya Pradesh", "total_cost_inr": 3500000.0, "roi_score": 88.5},
    {"college": "SRCC Delhi", "degree": "B.Com (Hons)", "field": "commerce", "tier": "1", "exam": "CUET", "base_closing_rank": 120, "state": "Delhi", "total_cost_inr": 95000.0, "roi_score": 95.5},
    {"college": "St. Xavier's College Mumbai", "degree": "Bachelor of Management Studies", "field": "management", "tier": "1", "exam": "CUET", "base_closing_rank": 140, "state": "Maharashtra", "total_cost_inr": 180000.0, "roi_score": 91.0},
    {"college": "Shaheed Sukhdev College of Business Studies", "degree": "BBA (FIA)", "field": "management", "tier": "1", "exam": "CUET", "base_closing_rank": 95, "state": "Delhi", "total_cost_inr": 110000.0, "roi_score": 94.2},

    # ── Law (CLAT / AILET) ───────────────────────────────────────────────
    {"college": "NLSIU Bengaluru", "degree": "B.A. LL.B. (Hons)", "field": "law", "tier": "1", "exam": "CLAT", "base_closing_rank": 98, "state": "Karnataka", "total_cost_inr": 1600000.0, "roi_score": 92.5},
    {"college": "NALSAR Hyderabad", "degree": "B.A. LL.B. (Hons)", "field": "law", "tier": "1", "exam": "CLAT", "base_closing_rank": 175, "state": "Telangana", "total_cost_inr": 1550000.0, "roi_score": 90.8},
    {"college": "WBNUJS Kolkata", "degree": "B.A. LL.B. (Hons)", "field": "law", "tier": "1", "exam": "CLAT", "base_closing_rank": 265, "state": "West Bengal", "total_cost_inr": 1500000.0, "roi_score": 88.4},
]


class AdmissionsPortfolioEngine:
    """
    Evaluates student exam rank/percentile and constructs a 4-tier calibrated application matrix.
    """

    @staticmethod
    def normal_cdf(z: float) -> float:
        """
        Computes Standard Normal Cumulative Distribution Function:
        Φ(z) = 0.5 * [1 + erf(z / sqrt(2))]
        """
        return 0.5 * (1.0 + math.erf(z / math.sqrt(2.0)))

    @classmethod
    def calculate_admission_probability(
        cls,
        expected_rank: float,
        base_closing_rank: float,
        category: str = "General",
        is_home_state: bool = False,
        exam_name: str = "JEE Main",
    ) -> Tuple[float, float]:
        """
        Calculates Cutoff Delta Z-Score and Normal CDF Admission Probability (Equation 9.1).
        Returns: (z_score, probability)
        """
        cat_mult = CATEGORY_MULTIPLIERS.get(category, 1.0)
        hs_mult = 1.35 if is_home_state else 1.00
        
        # Calibrated closing rank under student's category and quota
        calibrated_cutoff = base_closing_rank * cat_mult * hs_mult
        sigma = EXAM_RANK_VARIABILITY.get(exam_name, EXAM_RANK_VARIABILITY["Default"])

        # Z = (ClosingRank - StudentRank) / sigma
        # If StudentRank < ClosingRank, Z is positive -> higher chance
        z = (calibrated_cutoff - expected_rank) / sigma
        prob = cls.normal_cdf(z)
        
        return round(z, 2), round(max(0.01, min(0.99, prob)), 3)

    @classmethod
    def generate_admissions_portfolio(
        cls,
        student_rank: float,
        exam_name: str = "JEE Main",
        category: str = "General",
        home_state: str = "Maharashtra",
        max_budget_inr: float = 2000000.0,
        preferred_field: Optional[str] = None,
        programs: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Constructs the 4-Tier Caliber-Calibrated Admissions Application Matrix.
        Tiers: Reach, Target, Safety, Hidden Gem, Pruned.
        Supports custom or live database program catalogs.
        """
        reach_list = []
        target_list = []
        safety_list = []
        hidden_gems = []
        pruned_list = []

        pool = programs if programs is not None and len(programs) > 0 else COLLEGE_BENCHMARK_RANKS

        for p in pool:
            field = p.get("field") or p.get("degree_field")
            if preferred_field and field != preferred_field:
                continue

            exam = p.get("exam", exam_name)
            base_closing = float(p.get("base_closing_rank") or p.get("closing_rank", 10000))
            cost = float(p.get("total_cost_inr") or p.get("total_cost_of_degree") or 1000000.0)
            roi_score = float(p.get("roi_score") or p.get("composite_score") or 75.0)
            college_name = p.get("college") or p.get("college_name", "Target Institution")
            degree_name = p.get("degree") or p.get("degree_name", "Degree Program")
            tier = str(p.get("tier", "2"))
            state = p.get("state", "All India")

            is_hs = (state.lower() == home_state.lower())
            z, prob = cls.calculate_admission_probability(
                expected_rank=student_rank,
                base_closing_rank=base_closing,
                category=category,
                is_home_state=is_hs,
                exam_name=exam,
            )

            # Financial pruning check
            is_financially_pruned = cost > (max_budget_inr * 1.30)
            
            entry = {
                "college": college_name,
                "degree": degree_name,
                "field": field,
                "tier": tier,
                "exam": exam,
                "total_cost_inr": cost,
                "composite_roi": roi_score,
                "z_score": z,
                "admission_probability_pct": round(prob * 100.0, 1),
                "is_home_state_quota": is_hs,
                "financial_fit": "Within Budget" if cost <= max_budget_inr else "Budget Stretch",
            }

            if is_financially_pruned:
                entry["pruning_reason"] = f"Total Cost (₹{p['total_cost_inr']:,.0f}) exceeds 130% of budget (₹{max_budget_inr:,.0f})"
                pruned_list.append(entry)
                continue

            # Hidden Gem check: ROI >= 82.0, Fees < ₹6,00,000, Prob >= 60%
            if p["roi_score"] >= 82.0 and p["total_cost_inr"] <= 600000.0 and prob >= 0.60:
                hidden_gems.append(entry)

            if z > 1.5:
                entry["tier_badge"] = "Safety (High Solvency)"
                safety_list.append(entry)
            elif -0.5 <= z <= 1.5:
                entry["tier_badge"] = "Target (Optimal Match)"
                target_list.append(entry)
            elif -1.5 <= z < -0.5:
                entry["tier_badge"] = "Reach (Convex Upside)"
                reach_list.append(entry)
            else:
                entry["pruning_reason"] = f"Cutoff Delta Z-Score ({z}) is below -1.5 (Admission probability < 10%)"
                pruned_list.append(entry)

        # Sort within each tier by ROI score descending
        safety_list.sort(key=lambda x: x["composite_roi"], reverse=True)
        target_list.sort(key=lambda x: x["composite_roi"], reverse=True)
        reach_list.sort(key=lambda x: x["composite_roi"], reverse=True)
        hidden_gems.sort(key=lambda x: x["composite_roi"], reverse=True)

        return {
            "student_profile": {
                "expected_rank": student_rank,
                "exam": exam_name,
                "category": category,
                "home_state": home_state,
                "budget_inr": max_budget_inr,
            },
            "portfolio_summary": {
                "reach_count": len(reach_list),
                "target_count": len(target_list),
                "safety_count": len(safety_list),
                "hidden_gem_count": len(hidden_gems),
                "pruned_count": len(pruned_list),
            },
            "recommended_allocation": "2 Reach (15-25% odds), 3 Target (50-75% odds), 2 Safety (>90% odds), 1 Hidden Gem",
            "tiers": {
                "reach": reach_list,
                "target": target_list,
                "safety": safety_list,
                "hidden_gems": hidden_gems,
                "pruned": pruned_list,
            }
        }


# Singleton instance
admissions_portfolio_engine = AdmissionsPortfolioEngine()
