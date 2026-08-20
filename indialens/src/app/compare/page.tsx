import CollegeCompareTable from "@/components/CollegeCompareTable";
import { Scale, Plus, Sparkles } from "lucide-react";
import { fetchCollegeList } from "../../lib/live-colleges";
import type { CollegeDegreeRecord } from "../../lib/mock-data";

export const metadata = {
  title: "Compare Colleges & Degrees | IndiaLens",
  description: "Compare up to 4 Indian college programs side-by-side on 20-Year NPV, placement consistency, fees, and AI risk exposure.",
};

function toCompareItem(r: CollegeDegreeRecord) {
  const feeLakhs = (r.costs?.totalCostOfDegreeInr ?? 0) / 100000;
  const salaryLpa = (r.salary?.year1?.p50 ?? r.placement?.medianSalaryInr ?? 0) / 100000;
  const placementPct = (r.placement?.rate ?? 0) > 1 ? r.placement.rate : (r.placement?.rate ?? 0) * 100;
  const aiRisk = (r.risk?.aiAutomationProbability ?? 0) * 100;
  const payback = salaryLpa > 0 ? Number((feeLakhs / salaryLpa).toFixed(1)) : 0;
  const npv = Number((salaryLpa * 8.5 - feeLakhs).toFixed(1));

  return {
    id: r.id,
    name: r.degree.name,
    college: r.college.name,
    tier: String(r.college.tier),
    fee_lakhs: Number(feeLakhs.toFixed(1)),
    placement_rate_pct: Number(placementPct.toFixed(1)),
    median_salary_lpa: Number(salaryLpa.toFixed(1)),
    ai_risk_pct: Number(aiRisk.toFixed(1)),
    payback_years: payback,
    npv_20yr_lakhs: npv,
  };
}

export default async function ComparePage() {
  const listed = await fetchCollegeList({ per_page: 4, sort_by: "compositeScore" });
  const programs = listed.data.map(toCompareItem);

  return (
    <main className="min-h-screen bg-slate-950 text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
              <Scale className="w-3.5 h-3.5" />
              Side-by-Side ROI Benchmark Matrix
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Compare Colleges & Programs
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {listed.source === "database"
                ? "Live programs from the IndiaLens index."
                : "Local demo data — set FASTAPI_URL to load the live index."}
            </p>
          </div>

          <a href="/explore" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg transition-all">
            <Plus className="w-4 h-4" /> Browse programs
          </a>
        </div>

        <CollegeCompareTable programs={programs} />

        <div className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-base font-bold text-white flex items-center justify-center md:justify-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Need AI Guidance on these selections?
            </h3>
            <p className="text-xs text-slate-300">
              The advisor evaluates your budget against programs in the live index.
            </p>
          </div>
          <a
            href="/advisor"
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-emerald-400 text-slate-950 font-bold text-xs rounded-xl hover:opacity-90 transition-all shrink-0"
          >
            Consult AI Advisor
          </a>
        </div>
      </div>
    </main>
  );
}
