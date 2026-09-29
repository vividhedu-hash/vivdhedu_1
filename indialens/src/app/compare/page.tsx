import type { Metadata } from "next";
import Link from "next/link";
import CollegeCompareTable from "@/components/CollegeCompareTable";
import { CsvExportButton } from "@/components/CsvExportButton";
import { PageHeader } from "@/components/PageHeader";
import { Notice } from "@/components/Notice";
import { Scale, Plus, Sparkles, ArrowRight } from "lucide-react";
import { fetchCollegeList } from "../../lib/live-colleges";
import { finiteOrNull } from "../../lib/mock-data";
import type { CollegeDegreeRecord } from "../../lib/mock-data";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Compare Colleges & Programs",
  description:
    "Compare Indian college programmes side-by-side on 20-year NPV, placement consistency, fees and AI risk exposure.",
};

/**
 * Map a live record to the comparison shape.
 *
 * Every derivation here is guarded, and the guards are the point of this
 * page: a programme with no published fee must not be rendered as "0L",
 * i.e. free, and a programme with no measured placement must not show 0%.
 * Null propagates all the way to the table, which draws an em dash for it.
 */
function toCompareItem(r: CollegeDegreeRecord) {
  const costOfDegree = finiteOrNull(r.costs?.totalCostOfDegreeInr);
  const feeLakhs = costOfDegree == null ? null : costOfDegree / 100000;
  const medianRaw = r.salary?.year1?.p50 ?? r.placement?.medianSalaryInr ?? null;
  const salaryLpa =
    finiteOrNull(medianRaw) != null ? finiteOrNull(medianRaw)! / 100000 : null;
  const rateRaw = finiteOrNull(r.placement?.rate);
  const placementPct = rateRaw == null ? null : rateRaw > 1 ? rateRaw : rateRaw * 100;
  const aiRisk = finiteOrNull(r.risk?.aiAutomationProbability);
  const payback =
    feeLakhs != null && salaryLpa != null && salaryLpa > 0
      ? Number((feeLakhs / salaryLpa).toFixed(1))
      : null;
  const npv =
    salaryLpa == null ? null : Number((salaryLpa * 8.5 - (feeLakhs ?? 0)).toFixed(1));

  return {
    id: r.id,
    name: r.degree.name,
    college: r.college.name,
    tier: String(r.college.tier),
    fee_lakhs: feeLakhs == null ? null : Number(feeLakhs.toFixed(1)),
    placement_rate_pct: placementPct == null ? null : Number(placementPct.toFixed(1)),
    median_salary_lpa: salaryLpa == null ? null : Number(salaryLpa.toFixed(1)),
    ai_risk_pct: aiRisk == null ? null : Number(aiRisk.toFixed(1)),
    payback_years: payback,
    npv_20yr_lakhs: npv,
  };
}

export default async function ComparePage() {
  let programs: ReturnType<typeof toCompareItem>[] = [];
  let isLive = false;
  // Distinguishes "the index is down" from "we are showing the demo dataset".
  // The lead paragraph below already handles the down case; without this the
  // page could not tell the reader that the rows on screen, if any, are seed
  // data rather than a real index.
  let isSeed = false;

  try {
    const listed = await fetchCollegeList({
      per_page: 4,
      sort_by: "compositeScore",
    });
    programs = listed.data.map(toCompareItem);
    isLive = listed.source === "database";
    isSeed = listed.source === "mock";
  } catch {
    // The index is unreachable. The table renders its own empty state rather
    // than being given substitute rows.
  }

  return (
    <div className="page-shell">
      <div className="container-xl page-header">
        <PageHeader
          kicker="Benchmark matrix"
          eyebrow={
            <span className="badge badge-teal">
              <Scale size={10} aria-hidden="true" />
              Side-by-side
            </span>
          }
          title="Compare colleges &amp; programmes"
          lead={
            isLive
              ? "Live programmes from the quantitative index, compared on the same four measures. A dash means the figure is not measured, not that it is zero."
              : "The index is unreachable right now, so no comparison can be built from it. Everything else on this page still works."
          }
          actions={
            <>
              <CsvExportButton />
              <Link href="/explore" className="btn-secondary inline-flex items-center gap-2">
                <Plus size={14} aria-hidden="true" />
                Browse programmes
              </Link>
            </>
          }
        />

        {/* Provenance of the rows below. A comparison matrix is the page most
            likely to be screenshotted and shared, so a reader who is looking
            at sample data needs to be told before they act on it. */}
        {isSeed && (
          <Notice tone="warn" title="Comparing the demo dataset" className="mt-5">
            The live index is unreachable, so these rows come from the bundled
            sample data. The fees, placement rates and salaries are illustrative
            and do not describe real institutions.
          </Notice>
        )}

        {/* The export covers the whole active index, not just the four rows
            above. Stating that is the difference between "download this table"
            and "download this". */}
        <Notice tone="info" className="mt-2">
          The CSV export is the backend&apos;s projection of the full active
          programme index, not a dump of the rows in this table.
        </Notice>

        <div className="mt-7">
          <CollegeCompareTable programs={programs} />
        </div>
      </div>

      <div className="container-xl page-section-tight">
        <div className="panel panel-pad-lg flex flex-col items-center justify-between gap-5 md:flex-row">
          <div className="text-center md:text-left">
            <h2 className="flex items-center justify-center gap-2 text-[16px] font-bold t-text md:justify-start">
              <Sparkles size={15} style={{ color: "var(--accent)" }} aria-hidden="true" />
              Want these judged against your own constraints?
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed t-muted">
              {BRAND.name} scores each programme against your budget and risk
              tolerance, rather than against an average student.
            </p>
          </div>
          <Link
            href="/onboard"
            className="btn-primary inline-flex flex-shrink-0 items-center gap-2"
          >
            Run my comparison
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
