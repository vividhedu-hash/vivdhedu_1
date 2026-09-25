import CollegeCompareTable from "@/components/CollegeCompareTable";
import { Scale, Plus, Sparkles } from "lucide-react";
import { fetchCollegeList } from "../../lib/live-colleges";
import type { CollegeDegreeRecord } from "../../lib/mock-data";

export const metadata = {
  title: "Compare Colleges & Programs | IndiaLens · Student OS",
  description: "Compare up to 4 Indian college programs side-by-side on 20-Year NPV, placement consistency, fees, and AI risk exposure.",
};

function toCompareItem(r: CollegeDegreeRecord) {
  const feeLakhs = (r.costs?.totalCostOfDegreeInr ?? 0) / 100000;
  // Only derive salary/placement figures when they were actually measured.
  // Defaulting to 0 previously rendered unmeasured programs as "0% placement,
  // ₹0 salary, -₹X NPV", which reads as real data rather than a gap.
  const medianRaw = r.salary?.year1?.p50 ?? r.placement?.medianSalaryInr ?? null;
  const salaryLpa = medianRaw != null ? medianRaw / 100000 : null;
  const rateRaw = r.placement?.rate ?? null;
  const placementPct =
    rateRaw == null ? null : rateRaw > 1 ? rateRaw : rateRaw * 100;
  const aiRiskRaw = r.risk?.aiAutomationProbability ?? null;
  const aiRisk = aiRiskRaw == null ? null : aiRiskRaw * 100;
  const payback =
    salaryLpa != null && salaryLpa > 0
      ? Number((feeLakhs / salaryLpa).toFixed(1))
      : null;
  const npv =
    salaryLpa == null ? null : Number((salaryLpa * 8.5 - feeLakhs).toFixed(1));

  return {
    id: r.id,
    name: r.degree.name,
    college: r.college.name,
    tier: String(r.college.tier),
    fee_lakhs: Number(feeLakhs.toFixed(1)),
    placement_rate_pct: placementPct == null ? null : Number(placementPct.toFixed(1)),
    median_salary_lpa: salaryLpa == null ? null : Number(salaryLpa.toFixed(1)),
    ai_risk_pct: aiRisk == null ? null : Number(aiRisk.toFixed(1)),
    payback_years: payback,
    npv_20yr_lakhs: npv,
  };
}

export default async function ComparePage() {
  let programs: any[] = [];
  let isLive = false;

  try {
    const listed = await fetchCollegeList({ per_page: 4, sort_by: "compositeScore" });
    programs = listed.data.map(toCompareItem);
    isLive = listed.source === "database";
  } catch {
    // Graceful fallback
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-950 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-2">
              <Scale className="w-3.5 h-3.5" />
              Side-by-Side ROI Benchmark Matrix
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
              Compare Colleges & Programs
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {isLive
                ? "Live programs from IndiaLens sovereign quantitative index."
                : "Actuarial benchmark comparison — 20-year NPV, debt recovery, and AI risk."}
            </p>
          </div>

          <a href="/explore" className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <Plus className="w-4 h-4" /> Browse programs
          </a>
        </div>

        <CollegeCompareTable programs={programs} />

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-base font-bold text-slate-950 flex items-center justify-center md:justify-start gap-2">
              <Sparkles className="w-4 h-4 text-rose-600" /> Need AI Guidance on these selections?
            </h3>
            <p className="text-xs text-slate-500">
              The advisor evaluates your budget against programs in the live index using Gemini search grounding.
            </p>
          </div>
          <a
            href="/advisor"
            className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Open AI Mode →
          </a>
        </div>
      </div>
    </main>
  );
}
