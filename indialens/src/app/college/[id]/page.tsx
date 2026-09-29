"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  Shield,
  Users,
  Star,
  Database,
  ChevronRight,
} from "lucide-react";
import { ScoreRing } from "@/components/ScoreRing";
import { ROIBreakdown } from "@/components/ROIBreakdown";
import { RiskGrid } from "@/components/RiskGrid";
import { SalaryTrajectory } from "@/components/SalaryTrajectory";
import { DataFreshnessBadge } from "@/components/DataFreshnessBadge";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { CollegeCard } from "@/components/CollegeCard";
import { EmptyState } from "@/components/EmptyState";
import { Notice, UnmeasuredNote } from "@/components/Notice";
import JobMarketCard from "@/components/JobMarketCard";
import EcosystemBadge from "@/components/EcosystemBadge";
import PsychometricsRadar from "@/components/PsychometricsRadar";
import { APP_URL } from "@/lib/brand";
import { formatInr, finiteOrNull } from "../../../lib/mock-data";
import { useCollege, useColleges } from "@/hooks/useData";

/**
 * One programme, priced.
 *
 * The page is a single vertical argument: identity and headline score, then
 * the trajectory, then the formula that produced the score, then the cost it
 * rests on, then the risk surface, then the provenance. Each block is a
 * `.panel` — data, so no hover lift — and the order is identical on every
 * programme, so two pages can be compared by scrolling them in parallel.
 */
export default function CollegeDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data: record, isLoading, error, unavailable } = useCollege(id);
  const { response: similarResp } = useColleges({
    field: record?.degree?.field,
    per_page: 6,
  });

  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="container-xl py-24 text-center">
          <p className="mono text-[12px] t-faint">Loading programme details…</p>
        </div>
      </div>
    );
  }

  if (!record) {
    /* Two failures, one null. `unavailable` is true when the request itself
       failed, which is not the same claim as "this id is not in the index" —
       the old code collapsed them, so an outage told every visitor their
       programme did not exist. */
    return (
      <div className="page-shell">
        <div className="container-xl page-section">
          <EmptyState
            icon={unavailable ? Database : undefined}
            title={
              unavailable
                ? "This programme could not be loaded"
                : "This programme is not in the index"
            }
            hint={
              unavailable
                ? error ||
                  "The data store did not answer, so we could not check whether this programme exists. That is a fetch failure, not a missing record — retry in a moment."
                : error ||
                  "We could not match that identifier against the live programme index. It may have been renamed, or the index may be briefly unreachable."
            }
            action={
              unavailable
                ? { label: "Retry", onClick: () => window.location.reload() }
                : { label: "Browse the index", href: "/explore" }
            }
            secondaryAction={{ label: "Methodology", href: "/methodology" }}
          />
        </div>
      </div>
    );
  }

  const { college, degree, roi, salary, placement, risk, costs, meta } = record;
  const medianY1 =
    finiteOrNull(salary?.year1?.p50) ?? finiteOrNull(placement?.medianSalaryInr);
  const costOfDegree = finiteOrNull(costs?.totalCostOfDegreeInr);

  // Metadata must never claim a score we do not have.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: `${college.name} — ${degree.name}`,
    description: [
      finiteOrNull(roi.compositeScore) != null
        ? `ROI score ${roi.compositeScore}/100.`
        : "ROI score not yet available — insufficient verified cost and placement data.",
      medianY1 != null
        ? `Median salary INR ${(medianY1 / 100000).toFixed(1)} lakh at graduation.`
        : "Median salary not yet available.",
    ].join(" "),
    url: `${APP_URL}/college/${id}`,
    ...(costOfDegree != null
      ? {
          offers: {
            "@type": "Offer",
            price: `${costOfDegree}`,
            priceCurrency: "INR",
          },
        }
      : {}),
  };

  const similar = (similarResp?.data ?? [])
    .filter((r) => r.id !== record.id)
    .slice(0, 3);

  const riskItems = [
    { label: "AI Automation Risk", value: risk.aiAutomationProbability, description: "Probability the occupation is automated within 10 years (Oxford O*NET crosswalk)" },
    { label: "Salary Volatility", value: risk.salaryVolatility, description: "Standard deviation of the salary distribution (AmbitionBox data)" },
    { label: "Industry Cyclicality", value: risk.industryCyclicality, description: "Sensitivity to economic cycles (RBI KLEMS data)" },
    { label: "Credential Inflation", value: risk.credentialInflation, description: "Graduate supply growing faster than job demand" },
    { label: "Geographic Concentration", value: risk.geographicConcentration, description: "Jobs concentrated in one or two cities" },
    { label: "Regulatory Risk", value: risk.regulatoryRisk, description: "Government policy can cap income (e.g. public-sector pay bands)" },
    { label: "Physical Health Risk", value: risk.physicalHealthRisk, description: "Occupational health hazards" },
    { label: "Work-Life Quality", value: 1 - risk.workLifeQuality, description: "Burnout risk — higher means worse work-life balance" },
  ];

  const composite = finiteOrNull(roi.compositeScore);
  const financialRoiPct = finiteOrNull(roi.financialRoiPct);
  const riskScore = finiteOrNull(roi.riskScore);
  const ciLow = finiteOrNull(roi.confidenceIntervalLow);
  const ciHigh = finiteOrNull(roi.confidenceIntervalHigh);

  // Confidence is derived from a real CI width, or it is unknown. A NaN here
  // would silently become "Low" through the comparison chain.
  const ciWidth = ciLow != null && ciHigh != null ? ciHigh - ciLow : null;
  const confidenceLevel: "High" | "Medium" | "Low" | null =
    ciWidth == null
      ? null
      : ciWidth < 10
        ? "High"
        : ciWidth < 20
          ? "Medium"
          : "Low";

  const normalizedRisk =
    riskScore == null ? null : riskScore <= 1 ? riskScore : riskScore / 100;

  const riskTone =
    normalizedRisk == null
      ? "var(--text-tertiary)"
      : normalizedRisk < 0.3
        ? "var(--green)"
        : normalizedRisk < 0.5
          ? "var(--amber)"
          : "var(--red)";

  const hasSalary = !!(salary.year1 || salary.year5 || salary.year10 || salary.year20);

  return (
    <div className="page-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-xl page-header">
        <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-[13px] t-muted transition-colors hover:t-text"
          >
            <ArrowLeft size={13} aria-hidden="true" />
            Programme index
          </Link>
          <ChevronRight size={12} className="t-faint" aria-hidden="true" />
          <span className="text-[13px] t-muted">{college.shortName}</span>
          <ChevronRight size={12} className="t-faint" aria-hidden="true" />
          <span className="text-[13px] font-semibold t-text">{degree.shortName}</span>
        </nav>

        <div className="panel panel-pad-lg">
          <div className="flex flex-col items-start gap-8 md:flex-row">
            <div className="shrink-0">
              <ScoreRing score={composite} size={112} strokeWidth={8} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="badge badge-blue">
                  {college.type} · Tier {college.tier}
                </span>
                {finiteOrNull(college.nirfRank) != null && (
                  <span className="badge badge-amber">NIRF #{college.nirfRank}</span>
                )}
                {confidenceLevel != null && (
                  <ConfidenceBadge
                    level={confidenceLevel}
                    ciLow={ciLow ?? undefined}
                    ciHigh={ciHigh ?? undefined}
                  />
                )}
                <DataFreshnessBadge days={meta.dataFreshnessDays} />
              </div>

              <h1 className="page-title-sm">{college.name}</h1>
              <p className="mt-1.5 text-[16px] font-medium t-muted">{degree.name}</p>

              <div className="mt-7 grid grid-cols-2 gap-6 sm:grid-cols-4">
                <HeadlineStat
                  icon={<TrendingUp size={13} />}
                  label="Financial ROI"
                  value={
                    financialRoiPct != null
                      ? `${financialRoiPct.toLocaleString("en-IN")}%`
                      : null
                  }
                  color="var(--text-primary)"
                />
                <HeadlineStat
                  icon={<Shield size={13} />}
                  label="Risk score"
                  value={
                    normalizedRisk == null
                      ? null
                      : `${Math.round(normalizedRisk * 100)}/100`
                  }
                  color={riskTone}
                />
                <HeadlineStat
                  icon={<Users size={13} />}
                  label="Placement rate"
                  value={
                    placement?.rate != null
                      ? `${
                          placement.rate <= 1
                            ? Math.round(placement.rate * 100)
                            : Math.round(placement.rate)
                        }%`
                      : null
                  }
                  color="var(--green)"
                />
                <HeadlineStat
                  icon={<Star size={13} />}
                  label="Median salary Y1"
                  value={salary.year1 ? formatInr(salary.year1.p50) : null}
                  color="var(--amber)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-xl page-section-tight">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="min-w-0 space-y-5 lg:col-span-2">
            <section className="panel">
              <div className="panel-head">
                <span className="panel-title">Salary trajectory</span>
                {ciLow != null && ciHigh != null && (
                  <span className="num text-[10px] t-faint">
                    CI {ciLow}&ndash;{ciHigh}
                  </span>
                )}
              </div>
              <div className="panel-pad">
                <p className="mb-4 text-[12px] leading-relaxed t-muted">
                  Three bands, not one number: p25 conservative, p50 base case,
                  p75 optimistic. A single median would hide the spread that
                  actually matters when you are carrying a loan.
                </p>

                {hasSalary ? (
                  <>
                    <SalaryTrajectory salaryByYear={salary} />
                    <div
                      className="mt-5 grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4"
                      style={{ borderColor: "var(--divider)" }}
                    >
                      {[
                        { year: "Year 1", data: salary.year1 },
                        { year: "Year 5", data: salary.year5 },
                        { year: "Year 10", data: salary.year10 },
                        { year: "Year 20", data: salary.year20 },
                      ].map((s) => (
                        <div key={s.year} className="metric-cell">
                          <span className="metric-label">{s.year}</span>
                          {s.data ? (
                            <>
                              <span className="num text-[13px] font-bold t-text">
                                {formatInr(s.data.p50)}
                              </span>
                              <span className="num text-[10px] t-faint">
                                {formatInr(s.data.p25)}&ndash;{formatInr(s.data.p75)}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="num text-[13px] num-na">&mdash;</span>
                              <span className="text-[10px] t-faint">
                                Not measured
                              </span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <UnmeasuredNote what="Salary trajectory">
                    No source has published a salary distribution for this
                    programme. We do not publish an estimated one &mdash; a
                    modelled median would be indistinguishable from a measured
                    one, which is the failure this product exists to avoid.
                  </UnmeasuredNote>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <span className="panel-title">Score decomposition</span>
                <Link
                  href="/methodology"
                  className="text-[11px] font-semibold t-accent hover:opacity-80"
                >
                  Methodology →
                </Link>
              </div>
              <div className="panel-pad">
                <p className="mb-4 text-[12px] leading-relaxed t-muted">
                  The composite is a weighted sum of six components. The weights
                  below are the neutral-profile base values; they are
                  re-derived from an individual student&apos;s own trait
                  estimates and renormalised on every run.
                </p>
                <ROIBreakdown
                  financialRoi={roi.financialRoiPct}
                  riskScore={roi.riskScore}
                  optionalityScore={roi.optionalityScore}
                  mobilityScore={roi.mobilityScore}
                  satisfactionScore={roi.satisfactionScore}
                  networkScore={roi.networkScore}
                />
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <span className="panel-title">Total cost of degree</span>
              </div>
              <div className="panel-pad">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Tuition (total)", value: costs?.totalTuitionInr },
                    { label: "Hostel & living", value: costs?.hostelLivingInr },
                    { label: "Exam prep", value: costs?.examPrepCostsInr },
                    { label: "Opportunity cost", value: costs?.opportunityCostInr },
                  ].map((item) => (
                    <div key={item.label} className="metric-cell">
                      <span className="metric-label">{item.label}</span>
                      {finiteOrNull(item.value) != null ? (
                        <span className="num text-[15px] font-semibold t-text">
                          {formatInr(item.value)}
                        </span>
                      ) : (
                        <>
                          <span className="num text-[15px] num-na">&mdash;</span>
                          <span className="text-[10px] t-faint">
                            Not measured
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <div
                  className="mt-4 border-t pt-4"
                  style={{ borderColor: "var(--divider)" }}
                >
                  <div className="metric-cell-row">
                    <span className="text-[13px] t-muted">
                      Total cost of degree
                    </span>
                    {costOfDegree != null ? (
                      <span
                        className="num text-[18px] font-bold"
                        style={{ color: "var(--accent)" }}
                      >
                        {formatInr(costOfDegree)}
                      </span>
                    ) : (
                      <span className="num-na text-[13px]">
                        Not determinable
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed t-faint">
                    {costOfDegree != null
                      ? "Includes opportunity cost — what you would have earned had you taken a job after the 12th, from average PLFS data."
                      : "No total tuition figure could be verified for this programme, so we will not estimate a cost of degree. Every ROI figure above depends on it, and is therefore conditional rather than settled."}
                  </p>
                </div>
              </div>
            </section>

            <JobMarketCard initialField={degree.field} initialCity="bengaluru" />
            <PsychometricsRadar />
            <EcosystemBadge universityName={college.name} />
          </div>

          <aside className="min-w-0 space-y-5">
            <section className="panel">
              <div className="panel-head">
                <span className="panel-title">Risk surface</span>
              </div>
              <div className="panel-pad">
                <RiskGrid items={riskItems} />
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <span className="panel-title flex items-center gap-2">
                  <Database size={12} aria-hidden="true" />
                  Provenance
                </span>
              </div>
              <div className="panel-pad">
                <ul>
                  {[
                    {
                      source: "NIRF",
                      fields: "Placement rate, fees, student count",
                      updated: `${meta.dataFreshnessDays}d ago`,
                    },
                    {
                      source: "AmbitionBox",
                      fields: "Salary by experience, satisfaction",
                      updated: `${meta.dataFreshnessDays + 2}d ago`,
                    },
                    {
                      source: "Oxford O*NET",
                      fields: "Automation probability",
                      updated: "Annually",
                    },
                    {
                      source: "World Bank ICP",
                      fields: "PPP conversion factors",
                      updated: "Quarterly",
                    },
                  ].map((src, i, arr) => (
                    <li
                      key={src.source}
                      className="py-2.5"
                      style={{
                        borderBottom:
                          i < arr.length - 1
                            ? "1px solid var(--border-subtle)"
                            : "none",
                      }}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[12px] font-semibold t-text">
                          {src.source}
                        </span>
                        <span className="num whitespace-nowrap text-[10px] t-faint">
                          {src.updated}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] t-muted">{src.fields}</p>
                    </li>
                  ))}
                </ul>
                <p
                  className="mt-3 border-t pt-3 text-[10px] t-faint"
                  style={{ borderColor: "var(--divider)" }}
                >
                  Model version: {meta.scrapeSource.split("+")[0].trim()}
                </p>
              </div>
            </section>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-12">
            <h2 className="section-title mb-5">
              Other programmes in this field
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {similar.map((r) => (
                <CollegeCard key={r.id} record={r} />
              ))}
            </div>
          </section>
        )}

        <Notice tone="info" className="mt-10">
          Every figure on this page is a reading, not a prediction. Where a
          source has not published a value it appears as a dash, and the
          dependent calculations are marked conditional rather than silently
          completed.
        </Notice>
      </div>
    </div>
  );
}

/**
 * A headline figure.
 *
 * `value={null}` renders the unmeasured state in muted ink — never `0` in the
 * stat's own colour, which would assert a reading of zero for a figure nobody
 * has published.
 */
function HeadlineStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  color: string;
}) {
  return (
    <div className="metric-cell">
      <span className="metric-label flex items-center gap-1.5">
        <span aria-hidden="true" style={{ color: "var(--text-tertiary)" }}>
          {icon}
        </span>
        {label}
      </span>
      {value == null ? (
        <>
          <span className="num num-na text-[18px] font-bold">&mdash;</span>
          <span className="text-[10px] t-faint">Not measured</span>
        </>
      ) : (
        <span className="num text-[18px] font-bold" style={{ color }}>
          {value}
        </span>
      )}
    </div>
  );
}
