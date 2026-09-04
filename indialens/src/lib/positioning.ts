/**
 * Brand positioning — keep copy in one place so landing, metadata,
 * methodology, and footer do not drift back into generic “college ROI” language.
 *
 * Competitive fact (2026): NIRF, Shiksha/CollegeDunia-class aggregators, and
 * browser ROI calculators all treat the *college* as the unit of analysis and
 * a *median package* as the outcome. IndiaLens treats the *student × program*
 * as an asset with a return distribution and a risk surface.
 */

export const POSITIONING = {
  product: "The Project",
  uspName: "Student-Priced ROI",
  tagline: "Rankings measure institutions. The Project measures the student.",
  headlineLead: "Stop buying a rank.",
  headlineAccent: "Price the degree as an asset.",
  dek: "The same IIT CSE is a different investment for a ₹4L budget and a high-autonomy temperament than for a ₹25L loan and a stability-first family. We score the student–program pair: 20-year NPV, P10 downside, AI-occupation risk, and psychometric fit.",
  oneSentence:
    "India’s first college engine that prices a degree as a personal asset — not a NIRF reprint, not a brochure median, not a calculator you have to feed a salary.",
  analog:
    "What Chetty’s mobility report cards and the U.S. College Scorecard did for American higher ed: change the unit of analysis. We do that for Indian admissions, then add fit and tail risk.",
} as const;

export const USP_PILLARS = [
  {
    id: "unit",
    title: "Student is the unit",
    body: "Marks, budget, loan appetite, and an adaptive psychometric (CAT-style) diagnostic. Rankings assume every applicant is the same buyer.",
  },
  {
    id: "distribution",
    title: "Distribution, not the median",
    body: "P10 / P50 / P90 salary paths and payback under base, AI-shock, and recession cases. Brochure “average package” is a marketing statistic.",
  },
  {
    id: "risk",
    title: "Occupation risk is priced in",
    body: "Oxford O*NET automation probabilities, crosswalked to Indian roles, sit inside the score — not a blog sidebar.",
  },
] as const;

export const COMPETITIVE_CONTRAST = [
  {
    dimension: "Unit of analysis",
    others: "The college (NIRF rank, NAAC, brand)",
    us: "The student × program pair",
  },
  {
    dimension: "Outcome shown",
    others: "Highest / average package, or a payback you typed in",
    us: "20-year NPV with P10 downside and scenario stress",
  },
  {
    dimension: "Personalisation",
    others: "Filter by city, fees, exam",
    us: "Fit vectors: upside, stability, value, autonomy / WLB",
  },
  {
    dimension: "Risk",
    others: "Omitted, or a qualitative “AI will change jobs” note",
    us: "Automation + cyclicality inside the composite, not after it",
  },
  {
    dimension: "Counterfactual",
    others: "Side-by-side brochure rows",
    us: "What you give up by not picking the other program",
  },
] as const;
