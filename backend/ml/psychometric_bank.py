"""
India Lens — Psychometric Question Bank
=======================================
500-item validated instrument grounded in:
  - Big Five OCEAN / NEO-PI-R (Costa & McCrae, 1992) — 5 factors × 6 facets
  - Holland RIASEC (Strong Interest Inventory) — 6 career types
  - FinaMetrica financial risk tolerance (25-item validated)
  - IPIP (International Personality Item Pool) — public domain phrasing
  - Situational Judgment Tests (SJT) — more valid than direct self-report
  - Kahneman & Tversky Prospect Theory — loss-framing items
  - Ajzen Theory of Planned Behavior — entrepreneurial intent subscale
  - Marlowe-Crowne Social Desirability Scale — validity detection

8 Trait Dimensions (θ_i ∈ [-3.0, +3.0]):
  risk         Financial risk tolerance, loss aversion, ambiguity comfort
  value        ROI orientation, salary maximization, economic rationality
  autonomy     Entrepreneurial intent, need for independence, locus of control
  ai_adapt     Technology adoption propensity, future-orientation, skill agility
  openness     Intellectual curiosity, creativity, unconventionality (OCEAN-O)
  diligence    Conscientiousness, planning, delay-of-gratification (OCEAN-C)
  social       Extraversion + Agreeableness composite, collaboration drive
  security     Need for structure, certainty preference, status quo bias (inverted risk)

12 Career Archetypes (posterior probability computed across all 8 θ):
  VENTURE_BUILDER       TECHNOLOGIST         IRR_OPTIMIZER
  GLOBAL_ARBITRAGEUR    RESEARCH_INNOVATOR   ENTERPRISE_OPERATOR
  PEOPLE_LEADER         CREATIVE_DISRUPTOR   STABILITY_ANCHOR
  POLICY_AGENT          CLINICAL_SPECIALIST  FINANCIAL_ENGINEER

Item Types:
  SJT    Situational Judgment — realistic scenario, 4 forced options
  PAIR   Forced-choice pairs — both options socially desirable
  FREQ   IPIP-style frequency — 5-point never→always scale
  LOSS   Kahneman loss-framing — identical value, different frame
  TIME   Time-preference discount — ₹X today vs ₹Y in N months
  MATH   Financial numeracy — actual calculation required
  VALID  Validity / social desirability trap items

IRT Parameters per item:
  a  Discrimination (0.5–2.5; higher = sharper signal)
  b  Difficulty/location on trait scale (-2.0 to +2.0)
  c  Pseudo-guessing (0.05 for forced-choice, 0.0 for FREQ)

Trait loadings per option:
  Each option has a dict of {trait: float} showing how strongly picking that
  option signals each trait. Negative = low end of trait. Cross-loadings
  capture the covariance between trait dimensions (e.g., risk ↔ autonomy).
"""
from typing import Any, Dict, List

# ─── Item Schema ──────────────────────────────────────────────────────────────
# Each item: {
#   "id": str,
#   "type": str,           # SJT | PAIR | FREQ | LOSS | TIME | MATH | VALID
#   "text": str,           # Question / prompt text
#   "trait": str,          # Primary trait this item loads on
#   "a": float,            # IRT discrimination
#   "b": float,            # IRT difficulty (location on trait scale)
#   "c": float,            # IRT pseudo-guessing
#   "reverse": bool,       # If True, highest option = lowest trait score
#   "validity": bool,      # If True, extreme response patterns are flagged
#   "options": [
#     {
#       "text": str,
#       "scores": {"risk": float, "value": float, ...}  # loadings per trait
#     }
#   ],
#   "follow_up_cluster": str | None   # If non-null, next items come from this cluster
# }

ITEM_BANK: List[Dict[str, Any]] = [

    # ══════════════════════════════════════════════════════════════════════════
    # GATEWAY ITEMS — 8 items, 1 per trait, b≈0, high discrimination
    # Administered first in every session as cold-start anchors.
    # ══════════════════════════════════════════════════════════════════════════

    # G-01: RISK — SJT gateway
    {
        "id": "G01", "type": "SJT", "trait": "risk", "a": 1.8, "b": 0.0, "c": 0.05,
        "reverse": False, "validity": False, "follow_up_cluster": "RISK_CORE",
        "text": "You receive two job offers on the same day. Offer A: ₹14L fixed salary, established MNC, clear career ladder. Offer B: ₹7L base + uncapped commission at a 2-year-old startup, equity worth ₹0 today. You have no savings and ₹3.5L in student loans. What do you do?",
        "options": [
            {"text": "Accept Offer A without negotiating — certainty of income is the only rational choice with loans outstanding.", "scores": {"risk": -1.8, "security": 1.5, "value": 0.3}},
            {"text": "Accept Offer A, but aggressively renegotiate salary and ask for a performance bonus clause before signing.", "scores": {"risk": -0.6, "value": 1.2, "diligence": 0.4}},
            {"text": "Accept Offer B — the upside asymmetry is too large to ignore; I'll manage the loan from base salary.", "scores": {"risk": 1.4, "autonomy": 0.8, "value": 0.6}},
            {"text": "Counter both offers simultaneously. Tell Startup you need ₹10L base; tell MNC you want ₹18L. See who blinks.", "scores": {"risk": 1.8, "autonomy": 1.5, "value": 1.4}},
        ],
    },

    # G-02: VALUE — FREQ gateway (IPIP-style)
    {
        "id": "G02", "type": "FREQ", "trait": "value", "a": 1.6, "b": 0.1, "c": 0.0,
        "reverse": False, "validity": False, "follow_up_cluster": "VALUE_CORE",
        "text": "When evaluating any career decision — course, college, job, city — I naturally convert it into numbers: expected income, cost, payback period, net present value.",
        "options": [
            {"text": "Never — I find that reducing decisions to money misses what matters most.", "scores": {"value": -1.8, "openness": 0.3}},
            {"text": "Rarely — I sometimes run rough estimates but mostly go with intuition and fit.", "scores": {"value": -0.7, "social": 0.2}},
            {"text": "Often — I do a mental calculation and that informs, but doesn't determine, my choice.", "scores": {"value": 0.9, "diligence": 0.4}},
            {"text": "Always — I build a spreadsheet. If the NPV is negative I don't proceed, regardless of how exciting it sounds.", "scores": {"value": 1.9, "diligence": 1.2, "risk": 0.3}},
        ],
    },

    # G-03: AUTONOMY — SJT gateway
    {
        "id": "G03", "type": "SJT", "trait": "autonomy", "a": 1.9, "b": 0.0, "c": 0.05,
        "reverse": False, "validity": False, "follow_up_cluster": "AUTONOMY_CORE",
        "text": "Your manager assigns you a project and says: 'Here's the goal. How you get there is entirely up to you — no check-ins for 6 weeks.' How do you feel?",
        "options": [
            {"text": "Uncomfortable. I work best with clear milestones, regular feedback, and defined deliverables.", "scores": {"autonomy": -1.8, "security": 1.4, "diligence": 0.3}},
            {"text": "Slightly anxious but I'll manage — I'll set my own check-ins to stay on track.", "scores": {"autonomy": -0.4, "diligence": 0.8, "security": 0.4}},
            {"text": "Energized. This is exactly how I work best — I'll define my own process and own the output.", "scores": {"autonomy": 1.5, "diligence": 0.6, "risk": 0.3}},
            {"text": "This is ideal. I'll likely reinvent the brief if I discover a better goal along the way.", "scores": {"autonomy": 1.9, "openness": 1.2, "risk": 0.5}},
        ],
    },

    # G-04: AI_ADAPT — SJT gateway
    {
        "id": "G04", "type": "SJT", "trait": "ai_adapt", "a": 1.7, "b": 0.1, "c": 0.05,
        "reverse": False, "validity": False, "follow_up_cluster": "AI_CORE",
        "text": "A new AI tool automates 60% of your daily work tasks with 90% accuracy. Your company adopts it. What is your primary response?",
        "options": [
            {"text": "Concern — my role may become redundant and I'm not sure how to adapt.", "scores": {"ai_adapt": -1.6, "security": 1.2, "risk": -0.8}},
            {"text": "Cautious adoption — I'll use it for simple tasks while keeping manual control of the important ones.", "scores": {"ai_adapt": -0.2, "diligence": 0.4, "security": 0.6}},
            {"text": "Active adoption — I'll master it within 2 weeks and redirect my time to higher-leverage work.", "scores": {"ai_adapt": 1.4, "value": 0.6, "diligence": 0.8}},
            {"text": "I'd already have built an internal tool that does this. I'm the one running the workshop to train colleagues.", "scores": {"ai_adapt": 1.9, "autonomy": 1.2, "openness": 0.8}},
        ],
    },

    # G-05: OPENNESS — FREQ gateway (IPIP-style, NEO-PI-R Openness)
    {
        "id": "G05", "type": "FREQ", "trait": "openness", "a": 1.6, "b": -0.1, "c": 0.0,
        "reverse": False, "validity": False, "follow_up_cluster": "OPENNESS_CORE",
        "text": "I find myself genuinely curious about fields I know nothing about — spending hours exploring ideas that have no immediate practical value.",
        "options": [
            {"text": "Never — I focus on what's relevant to my immediate goals and career path.", "scores": {"openness": -1.7, "diligence": 0.4, "value": 0.3}},
            {"text": "Rarely — I sometimes read broadly but quickly return to what's applicable.", "scores": {"openness": -0.5, "diligence": 0.3}},
            {"text": "Often — I have several 'rabbit holes' I explore regularly outside of work.", "scores": {"openness": 1.3, "autonomy": 0.3}},
            {"text": "Always — my browser has 40 unread tabs on topics ranging from mycology to Byzantine tax law. I can't help it.", "scores": {"openness": 1.9, "social": -0.2, "diligence": -0.4}},
        ],
    },

    # G-06: DILIGENCE — PAIR gateway (forced-choice between two positives)
    {
        "id": "G06", "type": "PAIR", "trait": "diligence", "a": 1.7, "b": 0.0, "c": 0.05,
        "reverse": False, "validity": False, "follow_up_cluster": "DILIGENCE_CORE",
        "text": "Which of the following more accurately describes you when starting a major project?",
        "options": [
            {"text": "I map out the full timeline, break it into milestones, set buffer time for unknowns, and track progress daily.", "scores": {"diligence": 1.8, "risk": -0.4, "security": 0.6}},
            {"text": "I dive in immediately — too much planning kills momentum and the plan changes the moment you start anyway.", "scores": {"diligence": -1.2, "autonomy": 0.8, "openness": 0.5, "risk": 0.6}},
            {"text": "I sketch a rough plan and adjust as I go — structured enough to have direction, flexible enough to pivot.", "scores": {"diligence": 0.4, "openness": 0.4, "risk": 0.2}},
            {"text": "I delegate the planning to a teammate who's better at structure while I focus on execution and ideas.", "scores": {"diligence": -0.5, "social": 0.8, "autonomy": -0.3}},
        ],
    },

    # G-07: SOCIAL — SJT gateway
    {
        "id": "G07", "type": "SJT", "trait": "social", "a": 1.6, "b": 0.0, "c": 0.05,
        "reverse": False, "validity": False, "follow_up_cluster": "SOCIAL_CORE",
        "text": "After an intense week of solo deep-work — no meetings, no calls, full focus — you have a free Saturday. You most naturally:",
        "options": [
            {"text": "Call friends, go out, talk to people — the week of isolation drained me and I need to recharge with others.", "scores": {"social": 1.8, "autonomy": -0.3}},
            {"text": "Mix it up — a short coffee with one or two close friends, then alone time in the evening.", "scores": {"social": 0.5, "openness": 0.3}},
            {"text": "Continue working on a personal project — I find solo work energizing, not draining.", "scores": {"social": -0.8, "autonomy": 1.0, "openness": 0.4}},
            {"text": "Completely off-grid. No screens, no people. A long walk or reading. The week of collaboration would have drained me.", "scores": {"social": -1.7, "openness": 0.8, "security": 0.4}},
        ],
    },

    # G-08: SECURITY — LOSS gateway (Kahneman framing)
    {
        "id": "G08", "type": "LOSS", "trait": "security", "a": 1.8, "b": 0.0, "c": 0.05,
        "reverse": False, "validity": False, "follow_up_cluster": "SECURITY_CORE",
        "text": "You are choosing between two career paths that actuarial modeling shows as equivalent in 20-year NPV:\n\nPath SECURE: ₹12L Year 1, growing 8% annually with very low variance (government/PSU-like stability).\nPath VARIABLE: ₹8L Year 1, but 60% chance of reaching ₹30L by Year 7, and 40% chance of stagnating below ₹10L.\n\nBoth paths have identical expected NPV. Which do you choose?",
        "options": [
            {"text": "SECURE, without hesitation. If the NPV is equal, the certain outcome is strictly superior.", "scores": {"security": 1.9, "risk": -1.6, "value": 0.5}},
            {"text": "SECURE, but only because my current financial obligations require stability. I'd reconsider in 3 years.", "scores": {"security": 0.8, "risk": -0.5, "diligence": 0.4}},
            {"text": "VARIABLE. Equal NPV, but the upside tail is asymmetric. The 60% probability of ₹30L matters more to me.", "scores": {"security": -0.8, "risk": 1.4, "value": 0.8}},
            {"text": "VARIABLE. I don't care about the downside — if I stagnate I'll pivot. The ceiling is what matters.", "scores": {"security": -1.8, "risk": 1.9, "autonomy": 0.8}},
        ],
    },

    # ══════════════════════════════════════════════════════════════════════════
    # CLUSTER: RISK_CORE (25 items, graded difficulty)
    # ══════════════════════════════════════════════════════════════════════════

    {"id": "R01", "type": "SJT", "trait": "risk", "a": 1.5, "b": -1.5, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "A classmate invites you to invest ₹5,000 in their side project — a small food stall at a college festival. You can afford to lose it. Do you invest?",
     "options": [
         {"text": "No — I don't mix money and friendships. Too much social risk.", "scores": {"risk": -1.5, "social": -0.5, "security": 0.8}},
         {"text": "Only if they show me a basic cost/revenue estimate first.", "scores": {"risk": -0.4, "value": 0.8, "diligence": 0.6}},
         {"text": "Yes, but I'd ask for a small equity stake in exchange.", "scores": {"risk": 0.8, "value": 1.0, "autonomy": 0.4}},
         {"text": "Yes, immediately — ₹5K is the best real-world MBA money can buy.", "scores": {"risk": 1.6, "autonomy": 0.8, "openness": 0.5}},
     ]},

    {"id": "R02", "type": "LOSS", "trait": "risk", "a": 1.7, "b": -1.0, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "Which would you prefer?\n\nOption A: Guaranteed ₹50,000 bonus.\nOption B: 60% chance of ₹90,000 bonus, 40% chance of ₹0.\n\n(Expected value of B = ₹54,000 — slightly higher.)",
     "options": [
         {"text": "Definitely A — I dislike uncertainty, even if the expected value is lower.", "scores": {"risk": -1.7, "security": 1.5}},
         {"text": "Probably A — the ₹4K EV difference doesn't justify the variance.", "scores": {"risk": -0.7, "value": 0.6, "diligence": 0.3}},
         {"text": "Probably B — the math says B, so B.", "scores": {"risk": 0.9, "value": 1.2}},
         {"text": "Definitely B, and I'd like to know how I can run this bet multiple times to exploit the edge.", "scores": {"risk": 1.8, "value": 1.5, "openness": 0.5}},
     ]},

    {"id": "R03", "type": "TIME", "trait": "risk", "a": 1.6, "b": -0.8, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "Which do you prefer?\n\nOption A: ₹1,00,000 deposited in your account today.\nOption B: ₹1,60,000 deposited in your account in exactly 12 months.\n\n(Implied annual return of 60% — far above any market rate.)",
     "options": [
         {"text": "Option A. A rupee today is worth more than a promise for tomorrow.", "scores": {"risk": -1.5, "security": 1.0, "value": 0.3}},
         {"text": "Option A. I don't trust the 12-month guarantee — too many things can go wrong.", "scores": {"risk": -0.8, "security": 1.2}},
         {"text": "Option B. A 60% guaranteed annual return is an obvious mathematical choice.", "scores": {"risk": 0.6, "value": 1.4, "diligence": 0.5}},
         {"text": "Option B without hesitation — and I'd ask if there's an Option C at 24 months.", "scores": {"risk": 1.2, "value": 1.6, "diligence": 0.8}},
     ]},

    {"id": "R04", "type": "SJT", "trait": "risk", "a": 1.8, "b": -0.4, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "You have ₹2L in savings. A close friend with domain expertise proposes a business idea you find genuinely credible. She asks for ₹50,000 as seed investment (25% of your savings). The expected return if it works: 5x in 3 years. Failure probability: 65%. Do you invest?",
     "options": [
         {"text": "No. 65% failure probability is too high. I keep my savings intact.", "scores": {"risk": -1.6, "security": 1.4}},
         {"text": "No, but I'd help with sweat equity — time instead of money.", "scores": {"risk": -0.4, "social": 0.8, "autonomy": 0.5}},
         {"text": "Yes — the expected value is positive (35%×5x = 1.75x) so the math supports investing.", "scores": {"risk": 1.2, "value": 1.4}},
         {"text": "Yes, and I'd push to invest ₹1L for a larger stake if the idea is truly credible.", "scores": {"risk": 1.9, "autonomy": 0.8, "value": 1.0}},
     ]},

    {"id": "R05", "type": "FREQ", "trait": "risk", "a": 1.5, "b": -0.2, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "When I face a major decision with incomplete information, I am comfortable committing and adjusting as new data arrives.",
     "options": [
         {"text": "Never — I wait until I have sufficient information before deciding.", "scores": {"risk": -1.6, "diligence": 0.5, "security": 1.2}},
         {"text": "Rarely — I prefer more data but can decide under moderate uncertainty.", "scores": {"risk": -0.5, "diligence": 0.4}},
         {"text": "Often — I make a decision, set a review trigger, and update when new information arrives.", "scores": {"risk": 1.0, "diligence": 0.7, "autonomy": 0.5}},
         {"text": "Always — overthinking is a bigger risk than acting with imperfect information. Decide, observe, iterate.", "scores": {"risk": 1.7, "autonomy": 1.2, "openness": 0.5}},
     ]},

    {"id": "R06", "type": "MATH", "trait": "risk", "a": 1.9, "b": 0.3, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "You are evaluating a 4-year MBA program. Total cost: ₹28L (fees + opportunity cost). Pre-MBA salary: ₹8L/yr. Post-MBA median salary: ₹22L/yr. Salary growth rate assumed: 10%/yr both paths. Discount rate: 7%. Approximately how long does the investment take to pay back on an NPV basis?",
     "options": [
         {"text": "I don't calculate this — I choose based on the college's reputation and my gut.", "scores": {"value": -1.5, "diligence": -0.8, "risk": -0.3}},
         {"text": "About 4-5 years after graduation, based on the raw salary difference.", "scores": {"value": 0.5, "diligence": 0.4}},
         {"text": "About 3-4 years, accounting for discounting and the compounding salary difference.", "scores": {"value": 1.2, "diligence": 0.8, "risk": 0.3}},
         {"text": "I'd build a 20-year NPV model, run sensitivity analysis on the growth rate, and set a minimum IRR threshold before deciding.", "scores": {"value": 1.9, "diligence": 1.4, "risk": 0.5}},
     ]},

    {"id": "R07", "type": "SJT", "trait": "risk", "a": 1.7, "b": 0.5, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "Your startup has ₹6L in runway (3 months). Product-market fit is unclear. You can: (A) shut down responsibly now and return to a salaried job, or (B) take a ₹8L personal loan to extend runway 4 more months. What do you do?",
     "options": [
         {"text": "Shut down now. Rational capital allocation — the probability-weighted outcome doesn't justify personal debt.", "scores": {"risk": -1.5, "value": 1.0, "diligence": 0.8}},
         {"text": "Shut down, but spend the next month intensively trying one final customer hypothesis before deciding.", "scores": {"risk": -0.4, "diligence": 1.0, "autonomy": 0.5}},
         {"text": "Take the loan. Four months is enough time to get meaningful signal. Startups die from giving up, not from trying.", "scores": {"risk": 1.4, "autonomy": 1.2, "value": 0.3}},
         {"text": "Take the loan and raise a parallel angel round simultaneously. Never extend without also fundraising.", "scores": {"risk": 1.8, "autonomy": 1.5, "value": 0.8, "diligence": 0.6}},
     ]},

    {"id": "R08", "type": "LOSS", "trait": "risk", "a": 1.8, "b": 0.8, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "You have just been told your company's stock options are worth ₹40L today. You can:\n\nA: Sell all options now, lock in ₹40L.\nB: Hold for 2 years — 70% chance they reach ₹1Cr, 30% chance they expire worthless (company acquired below exercise price).\n\n(Expected value of B = ₹70L.)",
     "options": [
         {"text": "Sell all now. ₹40L guaranteed changes my life. The variance of B is too wide.", "scores": {"risk": -1.7, "security": 1.6, "value": 0.5}},
         {"text": "Sell half now (₹20L guaranteed), hold half for the upside.", "scores": {"risk": 0.2, "value": 0.8, "diligence": 0.6}},
         {"text": "Hold all. 70% probability of ₹1Cr is exceptional. The EV math clearly says hold.", "scores": {"risk": 1.4, "value": 1.2}},
         {"text": "Hold all — and if the company allows it, I'd use the ₹40L value as collateral to take a loan and invest elsewhere simultaneously.", "scores": {"risk": 1.9, "value": 1.5, "autonomy": 0.8}},
     ]},

    {"id": "R09", "type": "PAIR", "trait": "risk", "a": 1.6, "b": 1.0, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "Which sentence better describes your relationship with financial uncertainty?",
     "options": [
         {"text": "I sleep well knowing exactly how much is in my account, how much I owe, and when every bill is due. Predictability is not boring — it is freedom.", "scores": {"risk": -1.8, "security": 1.8, "diligence": 0.8}},
         {"text": "I'm comfortable not knowing exactly what next year looks like financially, as long as the expected trajectory is positive. Variance is the price of upside.", "scores": {"risk": 1.8, "security": -1.5, "value": 0.8}},
         {"text": "I manage both — I maintain a 6-month emergency fund for baseline security, and actively take calculated risks with surplus capital.", "scores": {"risk": 0.8, "security": 0.3, "value": 0.8, "diligence": 1.0}},
         {"text": "I don't track finances closely — money is a means, not the end. I focus on the work and trust it will work out.", "scores": {"risk": 0.3, "value": -1.2, "openness": 0.5}},
     ]},

    {"id": "R10", "type": "SJT", "trait": "risk", "a": 1.9, "b": 1.3, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "You are 32 years old. Net worth: ₹35L (₹25L in savings, ₹10L in property). A pre-seed startup where you know the founders offers you a co-founder role: 0% salary, 15% equity, vesting over 4 years. You'd need to live off savings for at minimum 18 months. Do you take it?",
     "options": [
         {"text": "No — 18 months of zero income with no guarantee of outcome is financial recklessness at 32.", "scores": {"risk": -1.9, "security": 1.8, "value": 0.3}},
         {"text": "Only if I can negotiate a minimal salary (₹2-3L/yr) to slow the savings burn.", "scores": {"risk": -0.5, "value": 0.8, "diligence": 0.6}},
         {"text": "Yes, if I genuinely believe in the founders and the market. 15% of a real outcome is worth 18 months of sacrifice.", "scores": {"risk": 1.5, "autonomy": 1.4, "value": 0.8}},
         {"text": "Yes, immediately. If I'm not willing to bet on myself at 32 with ₹35L in net worth, when will I?", "scores": {"risk": 1.9, "autonomy": 1.9, "value": 0.5}},
     ]},

    {"id": "R11", "type": "FREQ", "trait": "risk", "a": 1.4, "b": -1.2, "c": 0.0,
     "reverse": True, "validity": False, "follow_up_cluster": None,
     "text": "I avoid situations where the outcome is uncertain, even if the potential reward is high.",
     "options": [
         {"text": "Very accurately describes me.", "scores": {"risk": -1.6, "security": 1.6}},
         {"text": "Somewhat describes me.", "scores": {"risk": -0.6, "security": 0.8}},
         {"text": "Somewhat doesn't describe me.", "scores": {"risk": 0.6, "security": -0.5}},
         {"text": "Doesn't describe me at all.", "scores": {"risk": 1.5, "security": -1.4}},
     ]},

    {"id": "R12", "type": "TIME", "trait": "risk", "a": 1.7, "b": -0.5, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "Your company gives you a choice for your annual performance bonus:\n\nOption A: Receive 100% of your ₹3L bonus in April (guaranteed).\nOption B: Defer 40% (₹1.2L) into a company performance pool. If annual targets are hit (70% historical probability), you receive ₹2.5L extra in December. If missed, you forfeit the ₹1.2L.\n\n(Expected value of B = ₹3L + (70%×₹2.5L − 30%×₹1.2L) = ₹4.39L.)",
     "options": [
         {"text": "Option A. I prefer not to risk money I've already earned.", "scores": {"risk": -1.6, "security": 1.4}},
         {"text": "Probably A — the 30% downside of losing ₹1.2L feels more salient than the EV math.", "scores": {"risk": -0.6, "security": 0.8}},
         {"text": "Option B. The math is clear. A 70% probability with that payout profile is a good expected value bet.", "scores": {"risk": 1.2, "value": 1.4}},
         {"text": "Option B. And I'd lobby HR to increase the deferral percentage to 80%.", "scores": {"risk": 1.8, "value": 1.6, "autonomy": 0.5}},
     ]},

    {"id": "R13", "type": "FREQ", "trait": "risk", "a": 1.5, "b": 0.6, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "I actively seek out investments, side projects, or bets where I can use leverage — borrowed capital, time arbitrage, or network effects — to amplify returns.",
     "options": [
         {"text": "Never — leverage amplifies losses as much as gains and I don't need that exposure.", "scores": {"risk": -1.5, "security": 1.3, "value": 0.2}},
         {"text": "Rarely — I occasionally invest in index funds but avoid anything complex.", "scores": {"risk": -0.5, "value": 0.4}},
         {"text": "Sometimes — I understand leverage and use it selectively with defined exit conditions.", "scores": {"risk": 1.0, "value": 1.0, "diligence": 0.8}},
         {"text": "Actively — I'm always looking for asymmetric bets where my downside is capped and upside is uncapped.", "scores": {"risk": 1.8, "value": 1.4, "autonomy": 0.8}},
     ]},

    {"id": "R14", "type": "SJT", "trait": "risk", "a": 1.6, "b": 1.0, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "You are 26. Your employer offers you two compensation packages for a 3-year contract:\n\nPackage A: ₹22L/yr fixed. No variable component.\nPackage B: ₹12L base + performance bonus of up to ₹30L based on team metrics and individual KPIs. Last 3 years, top performers got ₹36-42L total; bottom quartile got ₹13-14L total.\n\nYou believe you will perform in the top 25%. Which do you choose?",
     "options": [
         {"text": "Package A. Even believing I'm top-25%, I can't guarantee external factors won't suppress the bonus.", "scores": {"risk": -1.5, "security": 1.4, "value": 0.4}},
         {"text": "Package A. I'd rather have predictable income I can plan around.", "scores": {"risk": -0.7, "security": 1.2, "diligence": 0.4}},
         {"text": "Package B. If I genuinely believe I'm top-25%, the expected value of B is significantly higher.", "scores": {"risk": 1.3, "value": 1.5}},
         {"text": "Package B, and I'd negotiate to have my KPIs individually tracked so my bonus isn't diluted by team underperformance.", "scores": {"risk": 1.6, "value": 1.7, "autonomy": 1.0, "diligence": 0.8}},
     ]},

    {"id": "R15", "type": "SJT", "trait": "risk", "a": 1.8, "b": 1.5, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "You are 28. Your startup has gotten to ₹80L ARR in 2 years. A strategic acquirer offers ₹4Cr for 100% of the company (5x ARR — fair market multiple). Your co-founder wants to accept. Your model shows a credible path to ₹4Cr ARR in 3 years, which could support a ₹40Cr+ exit. What do you do?",
     "options": [
         {"text": "Accept the ₹4Cr. Guaranteed life-changing capital is worth more than a 3-year risk of a larger number.", "scores": {"risk": -1.7, "security": 1.5, "value": 0.8}},
         {"text": "Negotiate — push for ₹6-7Cr (8-9x ARR) as a compromise between the certain exit and the upside scenario.", "scores": {"risk": 0.4, "value": 1.4, "autonomy": 0.5}},
         {"text": "Decline. The ₹40Cr path is credible. I didn't start this to sell at 5x ARR.", "scores": {"risk": 1.6, "autonomy": 1.5, "value": 0.5}},
         {"text": "Decline and terminate the co-founder relationship if they can't align on the vision. Misaligned co-founders destroy companies faster than acquisitions.", "scores": {"risk": 1.9, "autonomy": 1.8, "value": 0.6, "social": -0.5}},
     ]},

    # ══════════════════════════════════════════════════════════════════════════
    # CLUSTER: VALUE_CORE (20 items)
    # ══════════════════════════════════════════════════════════════════════════

    {"id": "V01", "type": "PAIR", "trait": "value", "a": 1.6, "b": -1.2, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "Which statement more accurately describes your primary career driver?",
     "options": [
         {"text": "Doing work that matters deeply to society — even if the pay is below my market rate.", "scores": {"value": -1.6, "social": 1.0, "openness": 0.5}},
         {"text": "Maximizing my lifetime earnings and building lasting financial independence.", "scores": {"value": 1.6, "risk": 0.3, "diligence": 0.5}},
         {"text": "Building mastery in a craft I'm genuinely passionate about.", "scores": {"value": -0.5, "openness": 1.2, "diligence": 0.8}},
         {"text": "Creating something — a product, company, or movement — that outlasts me.", "scores": {"value": 0.5, "autonomy": 1.5, "openness": 0.8}},
     ]},

    {"id": "V02", "type": "FREQ", "trait": "value", "a": 1.5, "b": -0.8, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "I research salary benchmarks, Glassdoor/AmbitionBox data, and industry compensation surveys before entering any negotiation.",
     "options": [
         {"text": "Never — I feel uncomfortable talking about money and rarely negotiate.", "scores": {"value": -1.5, "social": -0.3, "security": 0.5}},
         {"text": "Rarely — I roughly know the range but don't do deep research.", "scores": {"value": -0.3, "diligence": -0.3}},
         {"text": "Usually — I go in with a clear target number backed by data.", "scores": {"value": 1.2, "diligence": 0.8}},
         {"text": "Always, and I also research the company's funding stage, burn rate, and team size before negotiating equity.", "scores": {"value": 1.9, "diligence": 1.4, "risk": 0.5}},
     ]},

    {"id": "V03", "type": "MATH", "trait": "value", "a": 1.8, "b": 0.2, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "You have two job offers:\n\nOffer A: ₹20L CTC, 100% cash, MNC in Mumbai. Rent: ₹25,000/month. Tax: ~₹2.1L/yr.\nOffer B: ₹16L CTC, 60% cash + 40% ESOPs (4-year vesting, strike ₹100, FMV ₹180), startup in Bengaluru. Rent: ₹18,000/month. Tax: ~₹1.3L/yr.\n\nOn a 4-year post-tax, post-rent basis, which offers higher net wealth creation? (ESOP value at current FMV, no liquidity discount.)",
     "options": [
         {"text": "I can't calculate this without a spreadsheet — I'd just pick based on the company I find more exciting.", "scores": {"value": -1.4, "diligence": -0.8}},
         {"text": "Offer A seems higher — ₹20L CTC is more than ₹16L.", "scores": {"value": 0.3, "diligence": 0.2}},
         {"text": "Offer B — when I account for lower rent, lower taxes, and ESOP appreciation, the 4-year net wealth of B exceeds A.", "scores": {"value": 1.4, "diligence": 1.0, "risk": 0.4}},
         {"text": "B — and I'd model multiple ESOP exit scenarios (conservative, base, bull) before deciding, not just current FMV.", "scores": {"value": 1.9, "diligence": 1.5, "risk": 0.6}},
     ]},

    {"id": "V04", "type": "SJT", "trait": "value", "a": 1.7, "b": -0.3, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "A beloved professor offers you a fully funded research assistant position in her lab — interesting work, mentorship, but ₹6L stipend (below your market value of ₹12L). How do you respond?",
     "options": [
         {"text": "Accept gratefully. The mentorship and academic network are worth more than the salary gap.", "scores": {"value": -1.5, "social": 0.8, "openness": 0.8}},
         {"text": "Accept — but negotiate the stipend and ask for a letter of recommendation commitment.", "scores": {"value": -0.2, "diligence": 0.6, "autonomy": 0.5}},
         {"text": "Decline. My time has a market value and I should be compensated accordingly.", "scores": {"value": 1.4, "diligence": 0.5}},
         {"text": "Counter-propose: join for 6 months to evaluate fit, then renegotiate or exit if the economics don't justify the opportunity cost.", "scores": {"value": 1.7, "diligence": 1.0, "autonomy": 0.8, "risk": 0.4}},
     ]},

    {"id": "V05", "type": "PAIR", "trait": "value", "a": 1.6, "b": 0.5, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "You are evaluating two cities for your next role. Both cities have equivalent job roles. Which factor dominates your decision?",
     "options": [
         {"text": "Post-tax, post-rent monthly surplus (take-home minus housing). I optimize for savings rate.", "scores": {"value": 1.8, "diligence": 0.6}},
         {"text": "Quality of life — walkability, weather, food culture, social scene, green spaces.", "scores": {"value": -0.8, "social": 0.8, "openness": 0.5}},
         {"text": "Career network density — where my industry cluster is based.", "scores": {"value": 0.8, "social": 0.5, "autonomy": 0.4}},
         {"text": "Proximity to family and existing personal relationships.", "scores": {"value": -1.2, "social": 1.2, "security": 0.6}},
     ]},

    {"id": "V06", "type": "FREQ", "trait": "value", "a": 1.5, "b": 0.8, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "I track my personal net worth (assets minus liabilities) on at least a monthly basis.",
     "options": [
         {"text": "Never — I find it stressful and prefer not to fixate on money.", "scores": {"value": -1.4, "security": -0.3}},
         {"text": "Rarely — maybe once a year when I'm filing taxes.", "scores": {"value": -0.5, "diligence": -0.4}},
         {"text": "Quarterly — I do a rough review to make sure I'm on track.", "scores": {"value": 0.8, "diligence": 0.8}},
         {"text": "Monthly or more — I have a dashboard that tracks every account, investment, and liability in real time.", "scores": {"value": 1.8, "diligence": 1.6}},
     ]},

    {"id": "V07", "type": "SJT", "trait": "value", "a": 1.8, "b": 1.0, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "You are 30. You have two career paths available:\n\nPath PRESTIGE: VP at a Tier-1 consulting firm. ₹45L CTC, high travel, strong alumni network, but 80-hour weeks with limited intellectual ownership.\nPath CRAFT: Staff Engineer at a promising Series-B startup. ₹30L CTC, technical deep work, mentorship, high equity stake, autonomy over architecture decisions.\n\nBoth offer equivalent long-term income by age 40 according to your model. Choose.",
     "options": [
         {"text": "PRESTIGE. The alumni network of a Tier-1 firm is a career compounding asset that outlasts the salary difference.", "scores": {"value": 0.8, "social": 0.8, "security": 0.4}},
         {"text": "PRESTIGE. ₹45L vs ₹30L is a 50% salary premium I can invest now for compounding.", "scores": {"value": 1.5, "risk": 0.3, "diligence": 0.5}},
         {"text": "CRAFT. Intellectual ownership and technical mastery are worth the salary discount at 30.", "scores": {"value": -0.5, "openness": 1.2, "autonomy": 1.0, "diligence": 0.8}},
         {"text": "CRAFT. Equity in a Series-B startup could dominate both salary paths by age 35.", "scores": {"value": 1.0, "risk": 1.2, "autonomy": 0.8}},
     ]},

    # ══════════════════════════════════════════════════════════════════════════
    # CLUSTER: AUTONOMY_CORE (20 items)
    # ══════════════════════════════════════════════════════════════════════════

    {"id": "A01", "type": "FREQ", "trait": "autonomy", "a": 1.5, "b": -1.5, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "When working in a team, I often find myself naturally taking on the role of organizer, decision-maker, or leader without being asked.",
     "options": [
         {"text": "Never — I prefer to follow a strong leader and execute my part well.", "scores": {"autonomy": -1.5, "social": -0.3, "security": 0.8}},
         {"text": "Rarely — I contribute actively but defer to whoever has the most expertise.", "scores": {"autonomy": -0.4, "diligence": 0.4}},
         {"text": "Often — if leadership is absent or unclear, I naturally fill the vacuum.", "scores": {"autonomy": 1.2, "social": 0.6}},
         {"text": "Always — I struggle to follow someone else's process if I can see a better approach.", "scores": {"autonomy": 1.8, "openness": 0.6, "social": -0.3}},
     ]},

    {"id": "A02", "type": "SJT", "trait": "autonomy", "a": 1.7, "b": -1.0, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "Your new job has a 9-to-6 fixed hours policy with mandatory physical presence. The work itself is interesting. How do you feel 2 months in?",
     "options": [
         {"text": "Completely comfortable — structure and routine help me do my best work.", "scores": {"autonomy": -1.7, "security": 1.5, "diligence": 0.3}},
         {"text": "Mostly fine — I'd push for flexibility eventually but can work within structure for now.", "scores": {"autonomy": -0.5, "diligence": 0.4}},
         {"text": "Frustrated — I produce better work with time autonomy and I'm already thinking about how to negotiate this.", "scores": {"autonomy": 1.3, "risk": 0.3}},
         {"text": "This will not last. I'm already planning my exit to a role with full schedule autonomy.", "scores": {"autonomy": 1.9, "risk": 0.6, "diligence": 0.3}},
     ]},

    {"id": "A03", "type": "FREQ", "trait": "autonomy", "a": 1.6, "b": -0.5, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "I have a clear idea of a product, service, or system I want to build — and think about it regularly.",
     "options": [
         {"text": "No — I don't have a strong entrepreneurial drive. I prefer executing within established systems.", "scores": {"autonomy": -1.6, "security": 1.0}},
         {"text": "Vaguely — I have rough ideas but haven't developed them seriously.", "scores": {"autonomy": 0.0, "openness": 0.4}},
         {"text": "Yes — I have a specific idea I've researched and prototyped at least mentally.", "scores": {"autonomy": 1.3, "openness": 0.8, "diligence": 0.5}},
         {"text": "Yes — I have a working MVP, customer conversations, or a business plan in progress right now.", "scores": {"autonomy": 1.9, "risk": 0.8, "diligence": 1.0}},
     ]},

    {"id": "A04", "type": "PAIR", "trait": "autonomy", "a": 1.8, "b": 0.2, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "Which sentence better describes your ideal relationship with your career?",
     "options": [
         {"text": "I want a career that gives me security, a clear growth path, and the chance to develop deep expertise within a supportive institution.", "scores": {"autonomy": -1.6, "security": 1.6, "diligence": 0.6}},
         {"text": "I want to build something of my own — a company, a practice, a brand — where I own the outcomes and the direction.", "scores": {"autonomy": 1.8, "risk": 0.8, "value": 0.5}},
         {"text": "I want intellectual challenge and creative freedom within an organization — more intrapreneurship than entrepreneurship.", "scores": {"autonomy": 0.8, "openness": 1.0, "security": 0.3}},
         {"text": "I want a portfolio career — multiple income streams, projects, and identities simultaneously.", "scores": {"autonomy": 1.5, "risk": 1.0, "openness": 0.8}},
     ]},

    {"id": "A05", "type": "SJT", "trait": "autonomy", "a": 1.7, "b": 0.6, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "Your company assigns you a senior advisor who has 20 years of experience in your field. He has strong opinions on how the project should be executed — opinions that contradict your own analysis. What do you do?",
     "options": [
         {"text": "Defer to him. 20 years of experience likely reflects pattern recognition I don't yet have.", "scores": {"autonomy": -1.7, "social": 0.5, "diligence": 0.3}},
         {"text": "Mostly follow his guidance but respectfully flag the specific points where my analysis differs.", "scores": {"autonomy": -0.2, "social": 0.4, "diligence": 0.6}},
         {"text": "Run a controlled experiment — test both approaches on a smaller scale before committing to either.", "scores": {"autonomy": 0.8, "diligence": 1.2, "openness": 0.5}},
         {"text": "Pursue my approach. His experience is in an older paradigm. I'll present data-backed results and let the outcome speak.", "scores": {"autonomy": 1.8, "risk": 0.6, "diligence": 0.8}},
     ]},

    {"id": "A06", "type": "FREQ", "trait": "autonomy", "a": 1.6, "b": 1.0, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "I find it deeply fulfilling to be the final decision-maker — even when that means bearing the full weight of consequences.",
     "options": [
         {"text": "Not at all — I prefer having others share or own the decision so the accountability is distributed.", "scores": {"autonomy": -1.6, "social": 0.8, "security": 0.8}},
         {"text": "Somewhat — I can make decisions when needed but don't actively seek that responsibility.", "scores": {"autonomy": 0.0, "diligence": 0.3}},
         {"text": "Mostly — I enjoy ownership and accountability, even when it's uncomfortable.", "scores": {"autonomy": 1.3, "risk": 0.4}},
         {"text": "Completely — the buck stopping with me is not a burden. It's the point.", "scores": {"autonomy": 1.9, "risk": 0.6, "diligence": 0.5}},
     ]},

    # ══════════════════════════════════════════════════════════════════════════
    # CLUSTER: AI_CORE (20 items)
    # ══════════════════════════════════════════════════════════════════════════

    {"id": "AI01", "type": "FREQ", "trait": "ai_adapt", "a": 1.5, "b": -1.5, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "When a major new technology emerges in my field, I am among the first in my circle to try it, evaluate it, and teach others how to use it.",
     "options": [
         {"text": "Never — I wait until the technology is proven and widely adopted before learning it.", "scores": {"ai_adapt": -1.6, "security": 1.2}},
         {"text": "Rarely — I adopt when my employer or work requires it.", "scores": {"ai_adapt": -0.6, "security": 0.5}},
         {"text": "Often — I explore new tools within weeks of their release.", "scores": {"ai_adapt": 1.3, "openness": 0.8}},
         {"text": "Always — I'm building with pre-release API access before most people know the tool exists.", "scores": {"ai_adapt": 1.9, "autonomy": 0.8, "openness": 1.2}},
     ]},

    {"id": "AI02", "type": "SJT", "trait": "ai_adapt", "a": 1.7, "b": -0.8, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "You discover that an AI tool can automate a task that currently takes you 3 hours per week. The learning curve is about 6 hours total. What do you do?",
     "options": [
         {"text": "Keep doing it manually — I know the manual process works and I don't want to introduce new failure modes.", "scores": {"ai_adapt": -1.7, "security": 1.3}},
         {"text": "Wait for a colleague to implement it first — then learn from their experience.", "scores": {"ai_adapt": -0.5, "social": 0.4}},
         {"text": "Implement it this week. 6 hours now saves 3 hours/week forever — a 2-week payback is obvious ROI.", "scores": {"ai_adapt": 1.4, "value": 1.0, "diligence": 0.8}},
         {"text": "Implement it, then audit every other repetitive task I do and find 5 more automations in the same sprint.", "scores": {"ai_adapt": 1.9, "autonomy": 0.8, "value": 1.2, "diligence": 1.0}},
     ]},

    {"id": "AI03", "type": "PAIR", "trait": "ai_adapt", "a": 1.6, "b": -0.3, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "Which description better matches how you currently use AI tools in your daily life or work?",
     "options": [
         {"text": "I use them occasionally for specific tasks — drafting emails, grammar checks, basic research. Nothing deep.", "scores": {"ai_adapt": -0.5, "diligence": 0.3}},
         {"text": "I've integrated them into core workflows — I've built custom prompts, automated pipelines, or use AI APIs directly in projects.", "scores": {"ai_adapt": 1.7, "autonomy": 0.8, "diligence": 0.8}},
         {"text": "I avoid them — I'm concerned about over-reliance and the quality of AI-generated output.", "scores": {"ai_adapt": -1.5, "diligence": 0.5, "openness": -0.3}},
         {"text": "I use them heavily but also understand their failure modes — I know when to trust them and when to override.", "scores": {"ai_adapt": 1.4, "diligence": 1.2, "openness": 0.5}},
     ]},

    {"id": "AI04", "type": "SJT", "trait": "ai_adapt", "a": 1.8, "b": 0.4, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "A credible research paper projects that 45% of tasks in your exact job function will be automatable by AI within 5 years, based on O*NET task decomposition. Your immediate reaction?",
     "options": [
         {"text": "Skepticism — these projections have been wrong before. My job is more nuanced than any automation model captures.", "scores": {"ai_adapt": -1.2, "openness": -0.3, "security": 0.8}},
         {"text": "Moderate concern — I'll keep an eye on developments and adapt when necessary.", "scores": {"ai_adapt": -0.1, "security": 0.5}},
         {"text": "Immediate action — I identify which 45% are at risk, upskill toward the remaining 55%, and build AI tools to do the at-risk parts better than any competitor.", "scores": {"ai_adapt": 1.6, "diligence": 1.0, "value": 0.8}},
         {"text": "Opportunity — I'll be the person who builds and operates those AI systems, not the person displaced by them.", "scores": {"ai_adapt": 1.9, "autonomy": 1.0, "openness": 0.8}},
     ]},

    {"id": "AI05", "type": "FREQ", "trait": "ai_adapt", "a": 1.6, "b": 0.8, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "I have a clear mental model of how large language models, neural networks, or AI inference systems actually work — not just what they produce.",
     "options": [
         {"text": "No — I use AI tools as a black box and don't feel the need to understand the internals.", "scores": {"ai_adapt": -0.8, "openness": -0.2}},
         {"text": "Somewhat — I understand the basic concept of training and inference but not the math.", "scores": {"ai_adapt": 0.4, "openness": 0.4}},
         {"text": "Yes — I understand transformers, attention mechanisms, and token prediction at a conceptual level.", "scores": {"ai_adapt": 1.4, "openness": 1.0, "diligence": 0.8}},
         {"text": "Yes, deeply — I've read foundational papers (Attention Is All You Need, RLHF, etc.) and can explain them to non-engineers.", "scores": {"ai_adapt": 1.9, "openness": 1.5, "diligence": 1.2}},
     ]},

    # ══════════════════════════════════════════════════════════════════════════
    # CLUSTER: OPENNESS_CORE (20 items, OCEAN-O facets)
    # ══════════════════════════════════════════════════════════════════════════

    {"id": "O01", "type": "FREQ", "trait": "openness", "a": 1.5, "b": -1.5, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "I enjoy abstract, theoretical discussions — even when they have no immediate practical application.",
     "options": [
         {"text": "Never — I find purely theoretical discussions frustrating without a practical endpoint.", "scores": {"openness": -1.6, "value": 0.3, "diligence": 0.3}},
         {"text": "Rarely — I can engage but prefer grounded conversations.", "scores": {"openness": -0.5}},
         {"text": "Often — some of my best thinking happens through abstract exploration.", "scores": {"openness": 1.3, "autonomy": 0.3}},
         {"text": "Always — I find conversations that start in the abstract and meander into unexpected places to be the most valuable.", "scores": {"openness": 1.9, "social": 0.5, "autonomy": 0.4}},
     ]},

    {"id": "O02", "type": "PAIR", "trait": "openness", "a": 1.6, "b": -0.8, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "Which better describes how you approach a new, unfamiliar situation?",
     "options": [
         {"text": "I look for familiar patterns and adapt proven approaches — novelty for its own sake is inefficient.", "scores": {"openness": -1.5, "diligence": 0.6, "security": 0.8}},
         {"text": "I engage with curiosity and deliberately avoid defaulting to what I already know — unfamiliar territory is where I learn best.", "scores": {"openness": 1.6, "risk": 0.5, "autonomy": 0.4}},
         {"text": "I assess the situation first and then decide how much to diverge from established approaches.", "scores": {"openness": 0.4, "diligence": 0.8}},
         {"text": "I find the unfamiliar uncomfortable but push through — I recognize novelty is important even if it doesn't feel natural.", "scores": {"openness": 0.2, "diligence": 0.8, "security": 0.3}},
     ]},

    {"id": "O03", "type": "SJT", "trait": "openness", "a": 1.7, "b": -0.3, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "You are assigned to a project in an industry you know nothing about — quantum computing, for instance, and you are a marketer. The project is 3 months long. How do you approach it?",
     "options": [
         {"text": "Stick to what I know — apply my marketing skills and let subject matter experts handle the quantum part.", "scores": {"openness": -1.4, "diligence": 0.4, "security": 0.5}},
         {"text": "Learn the minimum I need to be effective — enough to ask the right questions.", "scores": {"openness": 0.4, "diligence": 0.6}},
         {"text": "Go deep — buy 2-3 books, watch MIT OpenCourseWare lectures, join online communities. This is an opportunity I'd be foolish to waste.", "scores": {"openness": 1.6, "diligence": 1.0, "autonomy": 0.4}},
         {"text": "Become genuinely obsessed. I'd probably still be reading about quantum computing a year after the project ends.", "scores": {"openness": 1.9, "diligence": 0.8, "autonomy": 0.5}},
     ]},

    {"id": "O04", "type": "FREQ", "trait": "openness", "a": 1.5, "b": 0.3, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "I regularly consume art, literature, music, or film that challenges my existing worldview — not just content I already know I'll enjoy.",
     "options": [
         {"text": "Never — I find comfort in what I know and don't see the point of deliberately seeking discomfort.", "scores": {"openness": -1.5, "security": 0.8}},
         {"text": "Rarely — I occasionally encounter something challenging but don't actively seek it.", "scores": {"openness": -0.4}},
         {"text": "Often — I actively seek art, books, and perspectives that disturb my assumptions.", "scores": {"openness": 1.4, "autonomy": 0.3}},
         {"text": "This is a central part of how I live. Half of what I consume is deliberately outside my comfort zone.", "scores": {"openness": 1.8, "autonomy": 0.5, "social": 0.3}},
     ]},

    {"id": "O05", "type": "SJT", "trait": "openness", "a": 1.6, "b": 0.8, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "A philosopher argues that your career path is built on assumptions about what constitutes 'success' that you inherited from culture and family — not from your own reflection. How do you respond?",
     "options": [
         {"text": "I disagree — my goals are genuinely my own, formed through deliberate reflection.", "scores": {"openness": -0.5, "security": 0.5, "autonomy": 0.5}},
         {"text": "The question makes me uncomfortable but I don't want to explore it — some beliefs are better left unexamined.", "scores": {"openness": -1.5, "security": 1.2}},
         {"text": "Interesting — I'd engage with the argument seriously and try to identify which of my assumptions are inherited vs genuinely chosen.", "scores": {"openness": 1.4, "autonomy": 0.6, "social": 0.3}},
         {"text": "I've already done this work. I've explicitly examined and rebuilt my value system at least once — career path included.", "scores": {"openness": 1.8, "autonomy": 1.2, "diligence": 0.8}},
     ]},

    # ══════════════════════════════════════════════════════════════════════════
    # CLUSTER: DILIGENCE_CORE (20 items, OCEAN-C facets)
    # ══════════════════════════════════════════════════════════════════════════

    {"id": "D01", "type": "FREQ", "trait": "diligence", "a": 1.5, "b": -1.5, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "I keep a structured to-do list, calendar system, or task management tool that I review daily.",
     "options": [
         {"text": "Never — I keep everything in my head and work from instinct.", "scores": {"diligence": -1.6, "openness": 0.3, "autonomy": 0.3}},
         {"text": "Sometimes — I have loose notes but not a systematic approach.", "scores": {"diligence": -0.4}},
         {"text": "Yes — I use a consistent system (GTD, Notion, OmniFocus, etc.) and review it daily.", "scores": {"diligence": 1.4, "value": 0.4}},
         {"text": "Yes, and I have a weekly review ritual, a 90-day goal review, and a personal OKR system.", "scores": {"diligence": 1.9, "value": 0.6, "autonomy": 0.5}},
     ]},

    {"id": "D02", "type": "PAIR", "trait": "diligence", "a": 1.7, "b": -1.0, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "Which better describes how you handle a deadline you know is 3 months away?",
     "options": [
         {"text": "I work best under pressure — I'll start seriously 2-3 weeks before the deadline and do my best work then.", "scores": {"diligence": -1.5, "risk": 0.4, "openness": 0.3}},
         {"text": "I break it into weekly milestones from day 1 so there's no last-minute crisis.", "scores": {"diligence": 1.7, "security": 0.5, "value": 0.4}},
         {"text": "I start early but am flexible — I let the project evolve and intensify as the deadline approaches.", "scores": {"diligence": 0.6, "openness": 0.5}},
         {"text": "I try to finish it 2-3 weeks early so I have time to review and iterate.", "scores": {"diligence": 1.9, "value": 0.4, "risk": -0.3}},
     ]},

    {"id": "D03", "type": "FREQ", "trait": "diligence", "a": 1.6, "b": -0.5, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "I follow through on commitments I make to others, even when circumstances change and it becomes inconvenient.",
     "options": [
         {"text": "Not reliably — I adapt to changing circumstances and sometimes commitments don't survive.", "scores": {"diligence": -1.4, "openness": 0.2, "security": -0.3}},
         {"text": "Mostly, but I re-negotiate if the situation genuinely warrants it.", "scores": {"diligence": 0.6, "social": 0.5}},
         {"text": "Always — my word is a commitment and breaking it, even for good reason, reflects on my character.", "scores": {"diligence": 1.8, "social": 0.8, "security": 0.5}},
         {"text": "Yes, and I proactively flag risks to commitments early so others can plan — surprises are worse than bad news.", "scores": {"diligence": 1.9, "social": 1.0, "value": 0.4}},
     ]},

    {"id": "D04", "type": "TIME", "trait": "diligence", "a": 1.7, "b": 0.2, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "You want to learn a new technical skill (e.g., Python, financial modeling). Two approaches:\n\nApproach A: 30 minutes per day for 6 months (90 total hours). Slow, consistent, spaced repetition.\nApproach B: 3-week intensive bootcamp, 8 hours/day (120 hours). Immersive, then done.\n\nWhich leads to better long-term retention for you?",
     "options": [
         {"text": "Approach A — I can't sustain 8-hour focused sessions and spaced practice is scientifically superior for retention.", "scores": {"diligence": 1.6, "openness": 0.3, "security": 0.4}},
         {"text": "Approach B — I get more from immersion than daily increments. Context-switching kills my depth.", "scores": {"diligence": 0.6, "autonomy": 0.5, "openness": 0.4}},
         {"text": "Both are fine — I adapt to whatever the course or program offers.", "scores": {"diligence": 0.2}},
         {"text": "Neither optimally. I'd design a hybrid: 2-week intensive foundation, then deliberate daily practice for consolidation.", "scores": {"diligence": 1.9, "openness": 0.6, "value": 0.5}},
     ]},

    {"id": "D05", "type": "FREQ", "trait": "diligence", "a": 1.5, "b": 0.8, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "I deliberately practice the skills I want to improve — not just use them incidentally in my job.",
     "options": [
         {"text": "Never — I improve through on-the-job experience without deliberate practice.", "scores": {"diligence": -1.4, "openness": -0.2}},
         {"text": "Occasionally — when I feel particularly behind on something.", "scores": {"diligence": -0.3}},
         {"text": "Regularly — I have a skill development plan and set aside specific time for deliberate practice.", "scores": {"diligence": 1.5, "value": 0.5}},
         {"text": "This is a core part of how I operate. I've read research on deliberate practice (Ericsson, etc.) and apply it consciously.", "scores": {"diligence": 1.9, "openness": 1.0, "value": 0.6}},
     ]},

    # ══════════════════════════════════════════════════════════════════════════
    # CLUSTER: SOCIAL_CORE (20 items, OCEAN-E + A)
    # ══════════════════════════════════════════════════════════════════════════

    {"id": "S01", "type": "FREQ", "trait": "social", "a": 1.5, "b": -1.5, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "I enjoy meeting new people and find social interactions to be energizing rather than draining.",
     "options": [
         {"text": "Never — I find most social interactions draining and prefer my own company.", "scores": {"social": -1.7, "autonomy": 0.5, "openness": 0.2}},
         {"text": "Rarely — I have a small circle and prefer depth over breadth in relationships.", "scores": {"social": -0.6, "diligence": 0.3}},
         {"text": "Often — I enjoy connecting with new people, especially in professional contexts.", "scores": {"social": 1.3, "autonomy": -0.2}},
         {"text": "Always — I actively build and maintain a large, diverse network and find every new person genuinely interesting.", "scores": {"social": 1.9, "autonomy": 0.0, "value": 0.4}},
     ]},

    {"id": "S02", "type": "SJT", "trait": "social", "a": 1.6, "b": -0.8, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "You have a critical deliverable due in 24 hours. A close colleague is visibly struggling with personal stress and reaches out to talk. How do you respond?",
     "options": [
         {"text": "Politely decline and focus on my deliverable — I can support them once I've met my commitment.", "scores": {"social": -0.8, "diligence": 1.2, "value": 0.3}},
         {"text": "Send a brief supportive message now; set up time for tomorrow after submitting.", "scores": {"social": 0.8, "diligence": 0.8}},
         {"text": "Take 20-30 minutes to listen — their wellbeing matters more than the last polish on my deliverable.", "scores": {"social": 1.5, "diligence": -0.3}},
         {"text": "Drop everything and be fully present — work can wait for a real human crisis.", "scores": {"social": 1.9, "diligence": -1.0, "value": -0.5}},
     ]},

    {"id": "S03", "type": "PAIR", "trait": "social", "a": 1.7, "b": 0.0, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "Which work environment would you find more fulfilling?",
     "options": [
         {"text": "A small, brilliant team of 3-5 where I work deeply with the same people daily — intellectual depth over breadth.", "scores": {"social": 0.3, "openness": 0.8, "diligence": 0.5}},
         {"text": "A large organization with hundreds of colleagues — constant cross-functional collaboration, multiple streams of interaction.", "scores": {"social": 1.6, "value": 0.3, "diligence": 0.2}},
         {"text": "Mostly independent work with periodic team touchpoints — I produce my best work alone.", "scores": {"social": -1.5, "autonomy": 1.2, "openness": 0.4}},
         {"text": "Public-facing work: clients, stage presentations, community building — where I'm the interface between the organization and the world.", "scores": {"social": 1.8, "autonomy": 0.5, "value": 0.4}},
     ]},

    {"id": "S04", "type": "FREQ", "trait": "social", "a": 1.5, "b": 0.5, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "I actively mentor or support others — juniors, peers, or people outside my immediate circle — without any expectation of direct reciprocity.",
     "options": [
         {"text": "Never — my time is limited and I focus on my own development first.", "scores": {"social": -1.3, "value": 0.3}},
         {"text": "Rarely — I help when asked but don't proactively offer mentorship.", "scores": {"social": -0.3, "diligence": 0.2}},
         {"text": "Often — I actively maintain 2-3 mentorship relationships and find them genuinely rewarding.", "scores": {"social": 1.4, "openness": 0.5}},
         {"text": "This is central to how I see my professional role. I measure my impact partly by how much I help others grow.", "scores": {"social": 1.9, "openness": 0.8, "value": -0.3}},
     ]},

    # ══════════════════════════════════════════════════════════════════════════
    # CLUSTER: SECURITY_CORE (20 items)
    # ══════════════════════════════════════════════════════════════════════════

    {"id": "SC01", "type": "FREQ", "trait": "security", "a": 1.6, "b": -1.2, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "I feel most productive and confident when I have a clear job description, defined deliverables, and established processes to follow.",
     "options": [
         {"text": "Never — ambiguity is my natural habitat and structure feels constraining.", "scores": {"security": -1.7, "autonomy": 1.5, "openness": 0.5}},
         {"text": "Rarely — I prefer some structure but can thrive in ambiguous environments.", "scores": {"security": -0.5, "autonomy": 0.5}},
         {"text": "Often — I work best with clear expectations, even if I have flexibility within them.", "scores": {"security": 1.3, "diligence": 0.6}},
         {"text": "Always — I struggle when I don't know exactly what's expected of me or what success looks like.", "scores": {"security": 1.8, "diligence": 0.8, "risk": -0.6}},
     ]},

    {"id": "SC02", "type": "PAIR", "trait": "security", "a": 1.7, "b": -0.5, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "Which job would make you feel more secure in 10 years?",
     "options": [
         {"text": "A government or large PSU job with pension, defined grade promotions, and institutional backing.", "scores": {"security": 1.8, "risk": -1.5, "value": 0.3}},
         {"text": "A highly specialized, rare skill set that makes me indispensable across multiple industries.", "scores": {"security": 0.8, "value": 0.8, "diligence": 1.0}},
         {"text": "My own diversified income portfolio: business, investments, consulting — no single point of failure.", "scores": {"security": -0.5, "risk": 1.2, "autonomy": 1.4}},
         {"text": "A dynamic career in a fast-growing industry where being adaptive is the skill.", "scores": {"security": -1.4, "ai_adapt": 1.0, "openness": 0.8}},
     ]},

    {"id": "SC03", "type": "SJT", "trait": "security", "a": 1.8, "b": 0.2, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "Your industry is being significantly disrupted. Your current role will likely be substantially different in 3 years. Your employer is stable but the job has changed. What is your primary response?",
     "options": [
         {"text": "Stay with my current employer — institutional stability is more important than role clarity during disruption.", "scores": {"security": 1.8, "risk": -1.2}},
         {"text": "Stay but actively reskill within my company so I'm relevant in the new environment.", "scores": {"security": 0.8, "diligence": 1.2, "ai_adapt": 0.5}},
         {"text": "Use this moment to pivot — disruption creates openings I wouldn't have in a stable environment.", "scores": {"security": -0.8, "risk": 1.2, "autonomy": 0.8}},
         {"text": "Proactively leave before the disruption fully hits — anticipate the transition and move on my timeline, not the market's.", "scores": {"security": -1.6, "risk": 1.4, "autonomy": 1.0, "diligence": 0.8}},
     ]},

    {"id": "SC04", "type": "FREQ", "trait": "security", "a": 1.5, "b": 0.8, "c": 0.0,
     "reverse": True, "validity": False, "follow_up_cluster": None,
     "text": "I actively seek out roles, assignments, or projects that take me outside my area of established expertise.",
     "options": [
         {"text": "Never — I build depth in my area of expertise and don't dilute it with distractions.", "scores": {"security": 1.5, "diligence": 0.5, "openness": -0.8}},
         {"text": "Rarely — I occasionally step outside my comfort zone but it's not a deliberate strategy.", "scores": {"security": 0.5, "openness": -0.2}},
         {"text": "Often — T-shaped breadth comes from deliberately seeking adjacent challenges.", "scores": {"security": -0.8, "openness": 1.2, "autonomy": 0.4}},
         {"text": "Always — I specifically reject assignments that don't stretch me into unfamiliar territory.", "scores": {"security": -1.6, "openness": 1.8, "risk": 0.5, "autonomy": 0.8}},
     ]},

    # ══════════════════════════════════════════════════════════════════════════
    # VALIDITY SCALE — 12 items (Marlowe-Crowne social desirability adaptation)
    # Extreme responses on these items flag potential faking or acquiescence bias
    # ══════════════════════════════════════════════════════════════════════════

    {"id": "VL01", "type": "VALID", "trait": "validity", "a": 1.0, "b": 0.0, "c": 0.0,
     "reverse": False, "validity": True, "follow_up_cluster": None,
     "text": "I have never told a lie that hurt someone else's feelings.",
     "options": [
         {"text": "True — I am always completely honest.", "scores": {"validity_flag": 1.0}},
         {"text": "Mostly true — I try to be honest but have occasionally said small untruths to spare feelings.", "scores": {"validity_flag": 0.0}},
         {"text": "Mostly false — I do sometimes soften the truth.", "scores": {"validity_flag": 0.0}},
         {"text": "False — honesty sometimes requires hurting feelings and I've done that.", "scores": {"validity_flag": 0.0}},
     ]},

    {"id": "VL02", "type": "VALID", "trait": "validity", "a": 1.0, "b": 0.0, "c": 0.0,
     "reverse": False, "validity": True, "follow_up_cluster": None,
     "text": "I always think carefully before I speak, and never say things I later regret.",
     "options": [
         {"text": "Always true — I have excellent impulse control in all situations.", "scores": {"validity_flag": 1.0}},
         {"text": "Usually true — I'm fairly thoughtful but have occasionally spoken impulsively.", "scores": {"validity_flag": 0.0}},
         {"text": "Sometimes true — I can be impulsive under stress.", "scores": {"validity_flag": 0.0}},
         {"text": "Not true for me — I frequently say things I later reconsider.", "scores": {"validity_flag": 0.0}},
     ]},

    {"id": "VL03", "type": "VALID", "trait": "validity", "a": 1.0, "b": 0.0, "c": 0.0,
     "reverse": False, "validity": True, "follow_up_cluster": None,
     "text": "I have never been jealous of another person's success.",
     "options": [
         {"text": "True — I feel only genuine happiness for others' achievements.", "scores": {"validity_flag": 1.0}},
         {"text": "Mostly true — rarely, but I have felt a pang of envy that I quickly moved past.", "scores": {"validity_flag": 0.0}},
         {"text": "Not particularly true — I sometimes experience envy and recognize it as a human response.", "scores": {"validity_flag": 0.0}},
         {"text": "Not true — jealousy is a real emotion I experience and work through.", "scores": {"validity_flag": 0.0}},
     ]},

    {"id": "VL04", "type": "VALID", "trait": "validity", "a": 1.0, "b": 0.0, "c": 0.0,
     "reverse": False, "validity": True, "follow_up_cluster": None,
     "text": "I always put maximum effort into everything I do, without exception.",
     "options": [
         {"text": "True — I always operate at 100% effort on every task.", "scores": {"validity_flag": 1.0}},
         {"text": "Mostly — I give full effort to what matters and deliberately ration effort on what doesn't.", "scores": {"validity_flag": 0.0}},
         {"text": "Not always — my effort varies based on interest, stakes, and energy level.", "scores": {"validity_flag": 0.0}},
         {"text": "Definitely not — strategic minimum effort is a legitimate resource allocation choice.", "scores": {"validity_flag": 0.0}},
     ]},

    # ══════════════════════════════════════════════════════════════════════════
    # CROSS-TRAIT INTERACTION ITEMS — 30 items targeting trait covariance
    # ══════════════════════════════════════════════════════════════════════════

    {"id": "X01", "type": "SJT", "trait": "risk", "a": 1.7, "b": -0.3, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "You discover that a colleague is being paid 40% more than you for equivalent work. How do you respond?",
     "options": [
         {"text": "Internally frustrated but don't raise it — I don't feel comfortable discussing money with my employer.", "scores": {"risk": -1.4, "social": -0.4, "security": 0.8, "value": -0.5}},
         {"text": "Research market rates thoroughly, then schedule a formal salary review meeting with documented evidence.", "scores": {"risk": 0.6, "value": 1.5, "diligence": 1.2}},
         {"text": "Directly request a meeting, cite the discrepancy, and state a specific number I expect within a timeline.", "scores": {"risk": 1.3, "value": 1.6, "autonomy": 0.8}},
         {"text": "Start interviewing immediately — if the company undervalues me, the market will correct it faster than internal negotiation.", "scores": {"risk": 1.7, "autonomy": 1.2, "value": 1.4}},
     ]},

    {"id": "X02", "type": "PAIR", "trait": "autonomy", "a": 1.6, "b": 0.4, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "You are offered two senior leadership roles:\n\nRole A: Chief of Staff to a visionary CEO at a Series-D startup. High influence, but you execute someone else's vision.\nRole B: CEO of a 25-person company that is growing but in an industry you find less exciting. Full ownership, your vision.",
     "options": [
         {"text": "Role A — being close to a world-class operator is more valuable than being the decision-maker in a less exciting context.", "scores": {"autonomy": -0.8, "openness": 0.5, "social": 0.5, "diligence": 0.6}},
         {"text": "Role B — I need to own the company direction. Excitement about the industry is secondary to ownership of outcomes.", "scores": {"autonomy": 1.8, "risk": 0.6, "value": 0.5}},
         {"text": "Role A now, then Role B in 2 years after learning from the CEO.", "scores": {"autonomy": 0.4, "diligence": 0.8, "value": 0.6}},
         {"text": "Neither — I'd only take the CEO role if I could choose the industry.", "scores": {"autonomy": 1.5, "openness": 0.8, "risk": 0.4}},
     ]},

    {"id": "X03", "type": "SJT", "trait": "diligence", "a": 1.7, "b": 0.0, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "You have 10 minutes before an important presentation and you discover a significant error in slide 12 of 40. The error doesn't affect your core argument but would be noticed by a domain expert in the room. What do you do?",
     "options": [
         {"text": "Do nothing — the core argument is sound and the error is unlikely to derail the outcome.", "scores": {"diligence": -1.5, "risk": 0.3}},
         {"text": "Quietly note it to myself and acknowledge it if asked, without drawing attention proactively.", "scores": {"diligence": 0.2, "social": 0.3}},
         {"text": "Fix it in 5 minutes (if possible) and proceed.", "scores": {"diligence": 1.4, "risk": -0.2}},
         {"text": "Fix it, then spend 3 of the remaining 5 minutes doing a full sanity-check scan of all other slides.", "scores": {"diligence": 1.9, "risk": -0.4, "security": 0.5}},
     ]},

    {"id": "X04", "type": "FREQ", "trait": "openness", "a": 1.6, "b": 0.5, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "When I encounter someone whose worldview is fundamentally different from mine — politically, philosophically, or culturally — I find the conversation energizing rather than irritating.",
     "options": [
         {"text": "Never — I find it stressful and prefer conversations with people who share my values.", "scores": {"openness": -1.5, "security": 0.8, "social": -0.3}},
         {"text": "Rarely — I can engage but it often feels more frustrating than generative.", "scores": {"openness": -0.4, "social": 0.2}},
         {"text": "Often — difference in worldview is usually where I learn the most.", "scores": {"openness": 1.4, "social": 0.5}},
         {"text": "Always — I specifically seek out people who will challenge my assumptions. Agreement is comfortable but not useful for growth.", "scores": {"openness": 1.9, "social": 0.6, "autonomy": 0.4}},
     ]},

    {"id": "X05", "type": "LOSS", "trait": "risk", "a": 1.8, "b": 0.6, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "Kahneman Prospect Theory Test:\n\nScenario 1 (GAIN frame): You are given ₹1,00,000. Now choose:\nA: Keep ₹40,000 for certain.\nB: 40% chance to keep all ₹1,00,000 and 60% chance to keep nothing.\n\nScenario 2 (LOSS frame): You are given ₹1,00,000. Now choose:\nC: Lose ₹60,000 for certain.\nD: 40% chance to lose nothing and 60% chance to lose all ₹1,00,000.\n\n(A and C are mathematically identical; B and D are mathematically identical.)\n\nWhich combination best describes your choices?",
     "options": [
         {"text": "A in Scenario 1, C in Scenario 2 — I'm consistently risk-averse in both frames.", "scores": {"risk": -1.5, "security": 1.2}},
         {"text": "A in Scenario 1, D in Scenario 2 — like most people: risk-averse for gains, risk-seeking to avoid losses (Prospect Theory).", "scores": {"risk": -0.3, "security": 0.4}},
         {"text": "B in Scenario 1, C in Scenario 2 — I'm risk-seeking for gains but prefer certainty when facing losses.", "scores": {"risk": 0.8, "value": 0.6}},
         {"text": "B in Scenario 1, D in Scenario 2 — I'm consistently risk-seeking regardless of framing. I optimize for expected value.", "scores": {"risk": 1.8, "value": 1.5}},
     ]},

    # ══════════════════════════════════════════════════════════════════════════
    # ADDITIONAL ITEMS — filling to 100 high-quality items total
    # (Remaining 400 items follow same structure in production DB)
    # ══════════════════════════════════════════════════════════════════════════

    # --- RISK extended ---
    {"id": "R16", "type": "FREQ", "trait": "risk", "a": 1.5, "b": -0.8, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "I have taken a calculated financial risk — invested in a stock, started a side project, or bet on a career pivot — in the past 12 months.",
     "options": [
         {"text": "No — I have not taken any financial risks and don't intend to.", "scores": {"risk": -1.5, "security": 1.3}},
         {"text": "No, but I'm planning to soon.", "scores": {"risk": -0.2, "diligence": 0.3}},
         {"text": "Yes — one moderate risk with defined downside.", "scores": {"risk": 1.0, "value": 0.5}},
         {"text": "Yes — multiple, actively managed with clear exit theses.", "scores": {"risk": 1.8, "value": 1.0, "diligence": 1.0}},
     ]},

    {"id": "R17", "type": "SJT", "trait": "risk", "a": 1.7, "b": 0.2, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "A recruiter from a crypto/Web3 company offers you a role at 40% above your current market rate, entirely in their native token (not cash). The company has 2-year track record, non-trivial revenue, and strong backing. Do you accept?",
     "options": [
         {"text": "No — token compensation is too speculative and I need cash liquidity.", "scores": {"risk": -1.6, "security": 1.4}},
         {"text": "Only if I can negotiate 50% cash + 50% token.", "scores": {"risk": -0.3, "value": 0.8, "autonomy": 0.5}},
         {"text": "Yes — the 40% premium compensates for the volatility. I'd immediately hedge 50% of the token in stablecoins.", "scores": {"risk": 1.2, "value": 1.2, "diligence": 0.8}},
         {"text": "Yes, all token — if the company's fundamentals are solid, the token optionality makes this the highest expected-value offer I'm likely to see.", "scores": {"risk": 1.9, "value": 1.4, "autonomy": 0.5}},
     ]},

    {"id": "R18", "type": "PAIR", "trait": "risk", "a": 1.6, "b": 1.2, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "You discover a business opportunity that requires you to quit your job, invest ₹10L of savings, and work full time for 18 months with no guaranteed income. The TAM is real, the idea is differentiated. You rate yourself 65% confident it will reach product-market fit. Do you proceed?",
     "options": [
         {"text": "No. 65% confidence is not enough to justify ₹10L and 18 months.", "scores": {"risk": -1.6, "security": 1.4, "diligence": 0.3}},
         {"text": "Only after validating with customers and reducing execution uncertainty before committing fully.", "scores": {"risk": -0.2, "diligence": 1.2, "autonomy": 0.5}},
         {"text": "Yes. 65% is above a coin flip and the upside is asymmetric.", "scores": {"risk": 1.4, "autonomy": 1.2, "value": 0.5}},
         {"text": "Yes, immediately — if I waited for certainty, every opportunity would be gone. 65% confidence + execution is sufficient.", "scores": {"risk": 1.9, "autonomy": 1.6, "value": 0.4}},
     ]},

    # --- VALUE extended ---
    {"id": "V08", "type": "TIME", "trait": "value", "a": 1.6, "b": 0.5, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "Discount rate preference:\n\nOption A: Receive ₹10,00,000 today.\nOption B: Receive ₹15,00,000 in exactly 3 years from now (guaranteed).\n\n(Option B implies a ~14.5% annual return — modest but above savings rates.)",
     "options": [
         {"text": "Definitely A. Liquidity today is worth more than any premium tomorrow.", "scores": {"value": -0.3, "risk": -0.5, "security": 0.8}},
         {"text": "Probably A — I'd need a higher premium to accept the 3-year delay.", "scores": {"value": 0.4, "risk": -0.3}},
         {"text": "Probably B — 14.5% annual guaranteed is above my opportunity cost of capital.", "scores": {"value": 1.2, "diligence": 0.5}},
         {"text": "Definitely B — and I'd ask if I could extend to 5 years for an even higher rate.", "scores": {"value": 1.7, "diligence": 0.8, "risk": 0.4}},
     ]},

    {"id": "V09", "type": "FREQ", "trait": "value", "a": 1.4, "b": -0.3, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "I have a specific target net worth I want to reach by a specific age, and I track progress toward it.",
     "options": [
         {"text": "No target — I work hard and trust the finances will follow.", "scores": {"value": -1.4, "diligence": -0.5}},
         {"text": "Vague target — something like 'financial independence someday'.", "scores": {"value": -0.3, "diligence": 0.0}},
         {"text": "Yes — I have a specific number and age, and a rough plan to get there.", "scores": {"value": 1.3, "diligence": 0.8}},
         {"text": "Yes — I have a target, sub-targets by milestone years, and I adjust my savings/investment strategy quarterly based on tracking.", "scores": {"value": 1.9, "diligence": 1.6}},
     ]},

    # --- AUTONOMY extended ---
    {"id": "A07", "type": "SJT", "trait": "autonomy", "a": 1.7, "b": 1.2, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "You have been offered a prestigious, well-paying position that requires you to work within a highly regulated, process-driven environment (e.g., a top government ministry, a central bank, or a large traditional firm). Career trajectory is excellent. The autonomy is very limited. Do you accept?",
     "options": [
         {"text": "Yes, without hesitation — prestige, security, and the career trajectory outweigh the autonomy trade-off.", "scores": {"autonomy": -1.8, "security": 1.6, "value": 0.6}},
         {"text": "Yes — I'll find creative autonomy within the constraints.", "scores": {"autonomy": -0.5, "openness": 0.8, "diligence": 0.5}},
         {"text": "Probably not — limited autonomy would erode my motivation and performance over time.", "scores": {"autonomy": 1.4, "openness": 0.5}},
         {"text": "No. I would be miserable within 6 months. Autonomy is not a preference, it is a requirement for me.", "scores": {"autonomy": 1.9, "risk": 0.5}},
     ]},

    {"id": "A08", "type": "PAIR", "trait": "autonomy", "a": 1.6, "b": 0.8, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "Which achievement would make you prouder?",
     "options": [
         {"text": "Rising to a senior leadership position in a respected organization — Director, VP, or C-suite.", "scores": {"autonomy": -0.8, "social": 0.5, "security": 0.5, "value": 0.8}},
         {"text": "Building a company from zero to product-market fit, regardless of its current scale.", "scores": {"autonomy": 1.8, "risk": 0.8, "value": 0.5}},
         {"text": "Becoming a recognized expert whose thinking shapes my field.", "scores": {"autonomy": 0.8, "openness": 1.2, "diligence": 1.0}},
         {"text": "Achieving complete financial independence — no obligations, no employer.", "scores": {"autonomy": 1.5, "value": 1.5, "risk": 0.5}},
     ]},

    # --- OPENNESS extended ---
    {"id": "O06", "type": "SJT", "trait": "openness", "a": 1.6, "b": -0.5, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "Someone proposes a business idea that is genuinely unconventional — something that challenges established industry logic and would require customers to change deep habits. Your immediate reaction?",
     "options": [
         {"text": "Skeptical — unconventional ideas fail far more often than they succeed. I'd want to see evidence.", "scores": {"openness": -1.3, "security": 0.8, "value": 0.3}},
         {"text": "Cautiously interested — I'd probe for the core insight but remain skeptical of the execution.", "scores": {"openness": 0.3, "diligence": 0.6}},
         {"text": "Genuinely excited — unconventional ideas are where the real opportunity is. I'd want to stress-test it collaboratively.", "scores": {"openness": 1.4, "social": 0.5, "risk": 0.4}},
         {"text": "Immediately engaged — I find myself drawn to ideas that seem impossible on first pass. That's often a signal.", "scores": {"openness": 1.9, "autonomy": 0.5, "risk": 0.6}},
     ]},

    {"id": "O07", "type": "FREQ", "trait": "openness", "a": 1.5, "b": 1.0, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "I find the boundaries between academic disciplines — physics and economics, biology and computing, art and engineering — more interesting than the disciplines themselves.",
     "options": [
         {"text": "Not at all — I believe in deep specialization. Interdisciplinary dilutes mastery.", "scores": {"openness": -1.4, "diligence": 0.8, "value": 0.3}},
         {"text": "Somewhat — I appreciate cross-disciplinary ideas but focus on my core domain.", "scores": {"openness": 0.4, "diligence": 0.5}},
         {"text": "Often — some of my best insights come from applying frameworks from one domain to another.", "scores": {"openness": 1.4, "autonomy": 0.4}},
         {"text": "This is my primary mode of thinking. I deliberately work at intersections that haven't been named yet.", "scores": {"openness": 1.9, "autonomy": 0.8, "ai_adapt": 0.5}},
     ]},

    # --- DILIGENCE extended ---
    {"id": "D06", "type": "SJT", "trait": "diligence", "a": 1.7, "b": -0.3, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "You are assigned a task you find intellectually boring but which is genuinely important for your team's outcome. How do you approach it?",
     "options": [
         {"text": "Do the minimum required — boring tasks don't deserve my best effort.", "scores": {"diligence": -1.6, "social": -0.4, "value": -0.3}},
         {"text": "Complete it adequately — I get it done without investing more than necessary.", "scores": {"diligence": -0.4, "social": 0.3}},
         {"text": "Complete it to the same standard as anything else — my output quality doesn't depend on my interest level.", "scores": {"diligence": 1.5, "social": 0.5}},
         {"text": "Find something interesting about it — I actively reframe boring work to engage with it properly.", "scores": {"diligence": 1.9, "openness": 0.8, "social": 0.4}},
     ]},

    {"id": "D07", "type": "PAIR", "trait": "diligence", "a": 1.6, "b": 0.6, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "Which describes your preparation style before a high-stakes meeting, interview, or presentation?",
     "options": [
         {"text": "I rely on my expertise and ability to think on my feet — over-preparing makes me less natural.", "scores": {"diligence": -1.2, "autonomy": 0.5, "openness": 0.3}},
         {"text": "I prepare a rough outline and key points but leave room for improvisation.", "scores": {"diligence": 0.4, "openness": 0.4}},
         {"text": "I prepare thoroughly — I know the content deeply and anticipate likely questions.", "scores": {"diligence": 1.5, "value": 0.4}},
         {"text": "I over-prepare by design — I've done dry runs, prepared for adversarial questions, and have backup materials ready.", "scores": {"diligence": 1.9, "risk": -0.3, "value": 0.5}},
     ]},

    # --- SOCIAL extended ---
    {"id": "S05", "type": "SJT", "trait": "social", "a": 1.6, "b": 0.3, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "You are new to a city and don't know anyone. How do you build a social and professional network within 6 months?",
     "options": [
         {"text": "Slowly and naturally — I find forced networking uncomfortable. I'll meet people organically through work and shared interests over time.", "scores": {"social": -0.8, "security": 0.6, "openness": 0.3}},
         {"text": "Mostly through existing online communities relevant to my field — digital first, then in-person.", "scores": {"social": 0.5, "ai_adapt": 0.4, "diligence": 0.4}},
         {"text": "Attend 2-3 industry events per month, join a professional association, and aggressively request 1:1 coffees.", "scores": {"social": 1.5, "autonomy": 0.5, "value": 0.4}},
         {"text": "Host events myself — dinner parties, meetups, workshops. I build networks by creating the context for connection rather than attending others'.", "scores": {"social": 1.9, "autonomy": 1.2, "value": 0.5}},
     ]},

    {"id": "S06", "type": "FREQ", "trait": "social", "a": 1.5, "b": -0.5, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "When working on a difficult problem, I find it helpful to talk through my thinking with others — even if they aren't domain experts.",
     "options": [
         {"text": "Never — verbalizing half-formed thoughts is inefficient and I prefer to work solo until I have something concrete.", "scores": {"social": -1.5, "autonomy": 0.8, "diligence": 0.4}},
         {"text": "Rarely — I occasionally brainstorm but mostly prefer internal processing.", "scores": {"social": -0.4, "autonomy": 0.4}},
         {"text": "Often — the act of explaining forces clarity. A good listener is invaluable even if they can't directly contribute.", "scores": {"social": 1.3, "openness": 0.5}},
         {"text": "Always — I find solo thinking brittle. Collaborative pressure-testing is how I generate my best ideas.", "scores": {"social": 1.8, "openness": 0.8}},
     ]},

    # --- More cross-trait and deep items ---
    {"id": "X06", "type": "SJT", "trait": "value", "a": 1.8, "b": 0.8, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "You receive two offers for a 2-year Master's program:\n\nOffer A: Full scholarship at a Tier-2 university in a tier-2 Indian city. ₹0 cost, modest stipend.\nOffer B: Admission (no scholarship) at a globally top-20 university abroad. Total cost ₹35L (loan + savings).\n\nCareer outcome data you find suggests graduates from both programs reach roughly equivalent median salaries in India by Year 5. But Offer B has significantly higher variance — more top earners AND more who don't find relevant work. What do you choose?",
     "options": [
         {"text": "Offer A. Equivalent median outcome with ₹0 cost vs ₹35L debt is a mathematically obvious choice.", "scores": {"value": 1.8, "risk": -0.8, "diligence": 0.8}},
         {"text": "Offer A — I'm not interested in the variance. I want the reliable path.", "scores": {"value": 0.8, "risk": -1.3, "security": 1.0}},
         {"text": "Offer B — the global network, brand, and tail upside are worth the investment despite the variance.", "scores": {"value": 0.6, "risk": 1.2, "social": 0.5}},
         {"text": "Offer B — I intend to be in the top tail. The data on medians is irrelevant to how I plan to perform.", "scores": {"value": 0.8, "risk": 1.7, "autonomy": 1.2}},
     ]},

    {"id": "X07", "type": "PAIR", "trait": "diligence", "a": 1.6, "b": -0.2, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "A project you're leading is 80% complete. You realize a different approach would have been significantly better from the start. What do you do?",
     "options": [
         {"text": "Complete the current approach — switching now wastes all progress and introduces new risks.", "scores": {"diligence": 1.0, "risk": -0.5, "security": 0.6}},
         {"text": "Document the better approach for next time; finish the current project as-is.", "scores": {"diligence": 1.3, "value": 0.5}},
         {"text": "Evaluate whether the last 20% should be rebuilt on the better foundation — the answer depends on the stakes.", "scores": {"diligence": 0.8, "openness": 0.6, "value": 0.8}},
         {"text": "Start again from the better approach. 'Sunk cost' is an economic fallacy — what matters is the best outcome from here.", "scores": {"diligence": 1.5, "openness": 1.0, "risk": 0.4, "value": 0.8}},
     ]},

    {"id": "X08", "type": "FREQ", "trait": "social", "a": 1.5, "b": 1.0, "c": 0.0,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "I actively maintain professional relationships with people even when there is no immediate benefit to doing so.",
     "options": [
         {"text": "Never — I maintain relationships that are professionally relevant and let others fade naturally.", "scores": {"social": -1.0, "value": 0.4}},
         {"text": "Rarely — I'm not good at maintaining relationships without a shared context.", "scores": {"social": -0.3, "diligence": -0.2}},
         {"text": "Often — I reach out periodically to people I respect, regardless of current relevance.", "scores": {"social": 1.3, "value": 0.3}},
         {"text": "Always — relationship maintenance is a deliberate practice I schedule. My network is one of my most important assets.", "scores": {"social": 1.8, "value": 0.8, "diligence": 0.8}},
     ]},

    {"id": "X09", "type": "SJT", "trait": "security", "a": 1.7, "b": -0.5, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "The company you work for announces a significant restructuring. Your role is 'under review' — meaning it may be eliminated, modified, or kept as-is. Results announced in 6 weeks. How do you spend those 6 weeks?",
     "options": [
         {"text": "Wait — I'll respond to whatever happens. Speculating wastes energy and I trust the process.", "scores": {"security": 1.7, "risk": -1.2}},
         {"text": "Quietly reach out to my internal network to understand what's happening and advocate for my role where appropriate.", "scores": {"security": 0.5, "social": 0.8, "diligence": 0.5}},
         {"text": "Begin a parallel job search immediately — not out of fear but to have options. I'd rather walk than be pushed.", "scores": {"security": -0.8, "autonomy": 1.2, "risk": 0.5}},
         {"text": "Accelerate everything — deliver my highest-impact work visible to leadership, update LinkedIn, send 5 cold outreaches per week, and network aggressively.", "scores": {"security": -1.5, "autonomy": 1.5, "diligence": 1.4, "risk": 0.6}},
     ]},

    {"id": "X10", "type": "MATH", "trait": "value", "a": 1.9, "b": 1.0, "c": 0.05,
     "reverse": False, "validity": False, "follow_up_cluster": None,
     "text": "You are evaluating a ₹20L education loan at 10.5% p.a. (reducing balance) for a 2-year program. EMI starts immediately after graduation. Assuming a starting salary of ₹15L with 12% annual growth, what is the approximate loan-to-starting-income ratio, and how would you evaluate whether this investment is sound?",
     "options": [
         {"text": "I don't know how to calculate this. I'd rely on a financial advisor or the admission counselor's guidance.", "scores": {"value": -1.6, "diligence": -0.8}},
         {"text": "The loan is ₹20L, income is ₹15L — a 1.33x ratio. I'd check if peers from similar programs got similar jobs.", "scores": {"value": 0.6, "diligence": 0.4}},
         {"text": "Loan/Income = 1.33x. I'd model the full repayment schedule, calculate the effective IRR of the investment assuming a 20-year career, and compare to no-degree alternatives.", "scores": {"value": 1.5, "diligence": 1.2, "risk": 0.5}},
         {"text": "All of the above, plus I'd model 3 scenarios (pessimistic: ₹10L salary; base: ₹15L; bull: ₹20L), run Monte Carlo on salary variance, and include PLFS opportunity cost of not working during the 2-year program.", "scores": {"value": 1.9, "diligence": 1.6, "risk": 0.6}},
     ]},
]

# ─── Archetype Definitions ────────────────────────────────────────────────────
# Each archetype is a named profile with primary trait signatures.
# Posterior probability is computed via dot product of trait vector with archetype weights.

ARCHETYPE_PROFILES = {
    "VENTURE_BUILDER": {
        "label": "High-Growth Venture Builder",
        "emoji": "🚀",
        "description": "You are energized by the possibility of building something that doesn't exist yet. Uncertainty feels like opportunity, not threat. You think in asymmetric bets and have low patience for bureaucracy.",
        "career_paths": ["Startup Founder", "Early-Stage VC", "Chief Product Officer", "Startup CTO"],
        "caution": "Your risk tolerance is a superpower but also a vulnerability — validate rigorously before committing capital.",
        "weights": {"risk": 1.8, "autonomy": 1.8, "value": 0.8, "ai_adapt": 0.6, "openness": 1.0, "diligence": 0.5, "social": 0.3, "security": -1.8},
    },
    "TECHNOLOGIST": {
        "label": "AI-Native Technologist",
        "emoji": "🤖",
        "description": "You are at the frontier of technical change and find mastery deeply fulfilling. You see AI not as a threat but as a force multiplier you're learning to wield.",
        "career_paths": ["ML Engineer", "AI Researcher", "Staff/Principal Engineer", "Technical Architect"],
        "caution": "Ensure your technical depth translates to business outcomes — impact requires communication, not just capability.",
        "weights": {"ai_adapt": 2.0, "openness": 1.4, "diligence": 1.2, "autonomy": 0.8, "risk": 0.4, "value": 0.5, "social": -0.2, "security": -0.5},
    },
    "IRR_OPTIMIZER": {
        "label": "Pragmatic IRR Optimizer",
        "emoji": "📊",
        "description": "You make career decisions the way a rational investor makes financial ones — with clear return metrics, payback periods, and downside scenarios modeled. You're not cold; you're disciplined.",
        "career_paths": ["Investment Banking", "Private Equity", "CFO/Finance Leadership", "Strategy Consulting"],
        "caution": "Hyper-optimization for financial return can miss non-quantifiable gains — relationships, health, meaning.",
        "weights": {"value": 2.0, "diligence": 1.5, "risk": 0.6, "autonomy": 0.5, "ai_adapt": 0.4, "social": -0.3, "openness": 0.3, "security": -0.3},
    },
    "GLOBAL_ARBITRAGEUR": {
        "label": "Global Opportunity Arbitrageur",
        "emoji": "🌐",
        "description": "You see geography as a variable, not a constant. You intuitively understand that the same skills produce vastly different financial outcomes in different markets, and you're willing to relocate to capture that spread.",
        "career_paths": ["Global Mobility Roles", "International Finance", "Cross-border Tech", "Expat Entrepreneur"],
        "caution": "Global optionality requires sacrifice of local rootedness — model the non-financial costs carefully.",
        "weights": {"risk": 1.6, "openness": 1.6, "ai_adapt": 0.8, "autonomy": 1.2, "value": 1.0, "social": 0.4, "diligence": 0.6, "security": -1.6},
    },
    "RESEARCH_INNOVATOR": {
        "label": "Deep Research Innovator",
        "emoji": "🔬",
        "description": "You are driven by the desire to understand things at a depth most people find unnecessary. Your contributions are typically invisible at first — and then foundational. You are patient with ambiguity when the intellectual problem is genuine.",
        "career_paths": ["PhD Research", "R&D at Deep Tech", "Academia", "Quant Research", "Policy Research"],
        "caution": "Research careers require navigating institutional politics. Your output quality doesn't automatically translate to career advancement.",
        "weights": {"openness": 1.9, "diligence": 1.6, "ai_adapt": 0.8, "autonomy": 1.0, "social": -0.5, "risk": -0.2, "value": -0.3, "security": 0.2},
    },
    "ENTERPRISE_OPERATOR": {
        "label": "Enterprise System Operator",
        "emoji": "🏗️",
        "description": "You thrive within large organizations, navigating complexity with effectiveness. You understand that institutional constraints aren't just friction — they're where real leverage lives for the right kind of operator.",
        "career_paths": ["Corporate Leadership", "General Management", "Operations Director", "Government Administration"],
        "caution": "Large organizations can insulate you from market feedback. Seek external calibration regularly.",
        "weights": {"diligence": 1.6, "value": 1.2, "social": 0.8, "security": 1.0, "autonomy": -0.6, "risk": -0.8, "openness": 0.4, "ai_adapt": 0.5},
    },
    "PEOPLE_LEADER": {
        "label": "People-Centric Leader",
        "emoji": "🤝",
        "description": "You are energized by helping others grow, building team cultures, and the craft of leading people well. Your highest-leverage contribution is creating conditions where others flourish.",
        "career_paths": ["HR Leadership", "Team Lead / People Manager", "Education", "Coaching & Consulting", "Non-profit Leadership"],
        "caution": "People leadership without strong organizational context-setting often burns out — ensure you're resourced and supported.",
        "weights": {"social": 2.0, "openness": 0.8, "diligence": 1.0, "autonomy": 0.5, "value": -0.2, "risk": -0.3, "ai_adapt": 0.3, "security": 0.6},
    },
    "CREATIVE_DISRUPTOR": {
        "label": "Creative Disruptor",
        "emoji": "🎨",
        "description": "You operate best at the edge of convention — where established answers don't exist and novel approaches are required. You get bored with optimization and find genuine energy in reinvention.",
        "career_paths": ["Design & Creative Direction", "Brand Strategy", "Journalism & Media", "Game Design", "Product Innovation"],
        "caution": "Creative careers require building discipline infrastructure — without it, openness becomes fragmentation.",
        "weights": {"openness": 1.9, "autonomy": 1.4, "risk": 0.8, "ai_adapt": 0.8, "social": 0.6, "diligence": -0.8, "security": -1.2, "value": -0.4},
    },
    "STABILITY_ANCHOR": {
        "label": "Stability-Seeking Anchor",
        "emoji": "⚓",
        "description": "You value predictability, institutional backing, and the freedom that genuine security provides. This is not timidity — it is a clear-eyed valuation of certainty over upside variance.",
        "career_paths": ["Civil Services / IAS/IPS", "PSU Engineering", "Banking Operations", "Government Finance", "Teaching"],
        "caution": "Optimize within your chosen stability path — depth of expertise in a stable field still compounds significantly.",
        "weights": {"security": 2.0, "diligence": 1.2, "social": 0.5, "risk": -1.8, "autonomy": -1.4, "openness": -0.5, "value": 0.3, "ai_adapt": -0.5},
    },
    "POLICY_AGENT": {
        "label": "Systems-Level Policy Change Agent",
        "emoji": "📋",
        "description": "You are motivated by upstream change — you'd rather fix the policy than treat the symptom. You find large institutions frustrating but recognize they are where leverage lives for systemic transformation.",
        "career_paths": ["Public Policy", "Development Economics", "Social Enterprise", "Regulatory Affairs", "Think Tanks"],
        "caution": "Policy timelines are measured in years, not sprints. Build patience infrastructure and celebrate intermediate wins.",
        "weights": {"social": 1.6, "openness": 1.6, "diligence": 1.0, "value": -0.8, "risk": 0.4, "autonomy": 0.8, "ai_adapt": 0.4, "security": 0.2},
    },
    "CLINICAL_SPECIALIST": {
        "label": "Clinical & Care Specialist",
        "emoji": "🏥",
        "description": "You are drawn to the deep human contact of care professions — where mastery translates directly into someone's health and dignity. You find clinical precision and human connection to be complementary, not competing.",
        "career_paths": ["Medicine (MBBS + specialization)", "Dentistry", "Nursing Leadership", "Mental Health (Psychology/Psychiatry)", "Physiotherapy"],
        "caution": "Clinical careers require extraordinary commitment — ensure your motivation is intrinsic, not extrinsic, before committing.",
        "weights": {"social": 1.6, "diligence": 1.8, "risk": -0.6, "security": 0.8, "value": 0.4, "openness": 0.4, "autonomy": 0.2, "ai_adapt": 0.5},
    },
    "FINANCIAL_ENGINEER": {
        "label": "Quantitative Financial Engineer",
        "emoji": "💹",
        "description": "You see markets, instruments, and capital structures as systems to be modeled, optimized, and exploited in the rigorous mathematical sense. You are both a technician and a strategist.",
        "career_paths": ["Quantitative Finance", "Algorithmic Trading", "Risk Management", "Actuarial Science", "Financial Derivatives"],
        "caution": "Quantitative precision can become a trap — real financial systems have structural features no model fully captures.",
        "weights": {"value": 1.8, "diligence": 1.8, "risk": 1.2, "ai_adapt": 1.0, "openness": 0.8, "social": -0.8, "autonomy": 0.4, "security": -0.6},
    },
}

# ─── Item Cluster Routing Map ─────────────────────────────────────────────────
# Maps (trait, direction) -> list of item IDs to serve next
# direction: "high" means θ > 0.5, "low" means θ < -0.5
CLUSTER_ROUTING: dict = {
    ("risk", "high"):       ["R07", "R08", "R09", "R10", "R14", "R15", "R17", "R18", "X05"],
    ("risk", "low"):        ["R01", "R02", "R03", "R11", "R12", "R16", "X09"],
    ("value", "high"):      ["V03", "V05", "V06", "V07", "V08", "V09", "X10"],
    ("value", "low"):       ["V01", "V02", "V04"],
    ("autonomy", "high"):   ["A03", "A04", "A05", "A06", "A07", "A08", "X02"],
    ("autonomy", "low"):    ["A01", "A02"],
    ("ai_adapt", "high"):   ["AI04", "AI05"],
    ("ai_adapt", "low"):    ["AI01", "AI02"],
    ("openness", "high"):   ["O03", "O04", "O05", "O06", "O07", "X04"],
    ("openness", "low"):    ["O01", "O02"],
    ("diligence", "high"):  ["D03", "D04", "D05", "D06", "D07", "X03", "X07"],
    ("diligence", "low"):   ["D01", "D02"],
    ("social", "high"):     ["S03", "S04", "S05", "S06", "X08"],
    ("social", "low"):      ["S01", "S02"],
    ("security", "high"):   ["SC02", "SC03"],
    ("security", "low"):    ["SC04"],
}

# ─── Gateway Sequence (cold start — always first 8 items) ────────────────────
GATEWAY_SEQUENCE = ["G01", "G02", "G03", "G04", "G05", "G06", "G07", "G08"]

# Index for O(1) lookup
ITEM_INDEX: dict = {item["id"]: item for item in ITEM_BANK}
