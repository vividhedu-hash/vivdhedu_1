"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  Shield,
  Globe,
  Star,
  Users,
  AlertTriangle,
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
import JobMarketCard from "@/components/JobMarketCard";
import EcosystemBadge from "@/components/EcosystemBadge";
import PsychometricsRadar from "@/components/PsychometricsRadar";
import AIAdvisorWidget from "@/components/AIAdvisorWidget";
import { formatInr, finiteOrNull, NO_DATA } from "../../../lib/mock-data";
import { useCollege, useColleges } from "@/hooks/useData";

export default function CollegeDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data: record, isLoading, error } = useCollege(id);
  const { response: similarResp } = useColleges({
    field: record?.degree?.field,
    per_page: 6,
  });

  if (isLoading) {
    return (
      <div style={{ padding: "120px 24px", textAlign: "center" }}>
        <p style={{ color: "#8B8BA7" }}>Loading program details…</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center" }}>
        <p style={{ color: "#8B8BA7" }}>{error || "Program not found."}</p>
        <Link href="/explore" className="btn-primary mt-4 inline-flex">
          Back to Index
        </Link>
      </div>
    );
  }

  const medianY1 = finiteOrNull(record.salary?.year1?.p50) ?? finiteOrNull(record.placement?.medianSalaryInr);
  const costOfDegree = finiteOrNull(record.costs?.totalCostOfDegreeInr);

  // Metadata must never claim a score we do not have.
  const jsonLd = record ? {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": `${record.college.name} — ${record.degree.name}`,
    "description": [
      finiteOrNull(record.roi.compositeScore) != null
        ? `ROI score ${record.roi.compositeScore}/100.`
        : "ROI score not yet available — insufficient verified cost and placement data.",
      medianY1 != null
        ? `Median salary ₹${(medianY1 / 100000).toFixed(1)}L at graduation.`
        : "Median salary not yet available.",
    ].join(" "),
    "url": `${process.env.NEXT_PUBLIC_APP_URL || "https://theproject.edu.in"}/college/${id}`,
    ...(costOfDegree != null
      ? { offers: { "@type": "Offer", price: `${costOfDegree}`, priceCurrency: "INR" } }
      : {}),
  } : null;


  const similar = (similarResp?.data ?? [])
    .filter((r) => r.id !== record.id)
    .slice(0, 3);

  const { college, degree, roi, salary, placement, risk, costs, meta } = record;

  const riskItems = [
    { label: "AI Automation Risk", value: risk.aiAutomationProbability, description: "Probability occupation is automated in 10 years (Oxford O*NET crosswalk)" },
    { label: "Salary Volatility", value: risk.salaryVolatility, description: "Std deviation of salary distribution (AmbitionBox data)" },
    { label: "Industry Cyclicality", value: risk.industryCyclicality, description: "Sensitivity to economic cycles (RBI KLEMS data)" },
    { label: "Credential Inflation", value: risk.credentialInflation, description: "Graduate supply growing faster than job demand" },
    { label: "Geographic Concentration", value: risk.geographicConcentration, description: "Jobs concentrated in 1–2 cities" },
    { label: "Regulatory Risk", value: risk.regulatoryRisk, description: "Government policy can cap income (e.g. public sector pay bands)" },
    { label: "Physical Health Risk", value: risk.physicalHealthRisk, description: "Occupational health hazards" },
    { label: "Work-Life Quality", value: 1 - risk.workLifeQuality, description: "Burnout risk (higher = worse WLB)" },
  ];

  const composite = finiteOrNull(roi.compositeScore);
  const financialRoiPct = finiteOrNull(roi.financialRoiPct);
  const riskScore = finiteOrNull(roi.riskScore);
  const ciLow = finiteOrNull(roi.confidenceIntervalLow);
  const ciHigh = finiteOrNull(roi.confidenceIntervalHigh);

  // Confidence is derived from a real CI width, or it is unknown. A NaN here
  // would silently become "Low" via the comparison chain.
  const ciWidth = ciLow != null && ciHigh != null ? ciHigh - ciLow : null;
  const confidenceLevel: "High" | "Medium" | "Low" | null =
    ciWidth == null ? null : ciWidth < 10 ? "High" : ciWidth < 20 ? "Medium" : "Low";

  const normalizedRisk = riskScore == null ? null : (riskScore <= 1 ? riskScore : riskScore / 100);

  return (
    <div style={{ padding: "40px 0 80px" }}>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <div className="container-lg">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8">
          <Link
            href="/explore"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "#64748B",
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={14} />
            ROI Index
          </Link>
          <ChevronRight size={12} style={{ color: "#94A3B8" }} />
          <span style={{ fontSize: 13, color: "#64748B" }}>{college.shortName}</span>
          <ChevronRight size={12} style={{ color: "#94A3B8" }} />
          <span style={{ fontSize: 13, color: "#09090B", fontWeight: 600 }}>{degree.shortName}</span>
        </div>

        {/* Header */}
        <div className="glass-card p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <ScoreRing score={composite} size={120} strokeWidth={8} />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="badge badge-blue">
                  {college.type} · Tier {college.tier}
                </span>
                {finiteOrNull(college.nirfRank) != null && (
                  <span className="badge badge-gold">
                    NIRF #{college.nirfRank}
                  </span>
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
              <h1
                className="font-display font-bold mb-1"
                style={{ fontSize: 28, color: "#09090B", letterSpacing: "-0.025em" }}
              >
                {college.name}
              </h1>
              <h2
                style={{ fontSize: 18, color: "#64748B", fontWeight: 500, marginBottom: 20 }}
              >
                {degree.name}
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  {
                    icon: <TrendingUp size={14} />,
                    label: "Financial ROI",
                    // `roi.financialRoiPct.toLocaleString()` used to throw on null.
                    value:
                      financialRoiPct != null
                        ? `${financialRoiPct.toLocaleString()}%`
                        : NO_DATA,
                    color: "#09090B",
                  },
                  {
                    icon: <Shield size={14} />,
                    label: "Risk Score",
                    value:
                      normalizedRisk == null
                        ? NO_DATA
                        : `${Math.round(normalizedRisk * 100)}/100`,
                    color:
                      normalizedRisk == null
                        ? "#94A3B8"
                        : normalizedRisk < 0.3
                          ? "#10B981"
                          : normalizedRisk < 0.5
                            ? "#F59E0B"
                            : "#E11D48",
                  },
                  {
                    icon: <Users size={14} />,
                    label: "Placement Rate",
                    value: placement?.rate != null
                      ? `${placement.rate <= 1 ? Math.round(placement.rate * 100) : Math.round(placement.rate)}%`
                      : NO_DATA,
                    color: "#10B981",
                  },
                  {
                    icon: <Star size={14} />,
                    label: "Median Salary Y1",
                    value: salary.year1 ? formatInr(salary.year1.p50) : "No data",
                    color: "#D97706",
                  },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div
                      className="flex items-center gap-1.5 mb-1"
                      style={{ color: "#64748B" }}
                    >
                      {stat.icon}
                      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        {stat.label}
                      </span>
                    </div>
                    <span
                      className="font-mono font-bold"
                      style={{ fontSize: 18, color: stat.color }}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: ROI Breakdown + Salary trajectory */}
          <div className="lg:col-span-2 space-y-6">
            {/* Salary Trajectory */}
            <div className="glass-card p-6">
              <h3
                className="font-display font-semibold mb-1"
                style={{ fontSize: 18, color: "#09090B" }}
              >
                Salary Trajectory
              </h3>
              <p style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>
                Conservative (p25) / Base Case (p50) / Optimistic (p75)
                {ciLow != null && ciHigh != null
                  ? ` · Confidence Interval: ${ciLow}–${ciHigh}`
                  : ""}
              </p>
              {salary.year1 || salary.year5 || salary.year10 || salary.year20 ? (
                <SalaryTrajectory salaryByYear={salary} />
              ) : (
                <div
                  style={{
                    padding: 24,
                    textAlign: "center",
                    color: "#64748B",
                    fontSize: 13,
                    background: "#F8FAFC",
                    borderRadius: 8,
                  }}
                >
                  No measured salary data for this program yet. We do not publish
                  estimated figures — check back once the next placement scrape lands.
                </div>
              )}
              <div
                className="grid grid-cols-4 gap-4 mt-4 pt-4"
                style={{ borderTop: "1px solid #E2E8F0" }}
              >
                {[
                  { year: "Year 1", data: salary.year1 },
                  { year: "Year 5", data: salary.year5 },
                  { year: "Year 10", data: salary.year10 },
                  { year: "Year 20", data: salary.year20 },
                ].map((s) => (
                  <div key={s.year}>
                    <p style={{ fontSize: 10, color: "#64748B", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {s.year}
                    </p>
                    {s.data ? (
                      <>
                        <p className="font-mono font-bold" style={{ fontSize: 13, color: "#09090B" }}>
                          {formatInr(s.data.p50)}
                        </p>
                        <p style={{ fontSize: 10, color: "#94A3B8" }}>
                          {formatInr(s.data.p25)}–{formatInr(s.data.p75)}
                        </p>
                      </>
                    ) : (
                      <p style={{ fontSize: 12, color: "#94A3B8" }}>No data</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ROI Breakdown */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="font-display font-semibold"
                  style={{ fontSize: 18, color: "#09090B" }}
                >
                  ROI Formula Breakdown
                </h3>
                <Link
                  href="/methodology"
                  style={{ fontSize: 12, color: "#09090B", textDecoration: "none", fontWeight: 600 }}
                >
                  Methodology →
                </Link>
              </div>
              <ROIBreakdown
                financialRoi={roi.financialRoiPct}
                riskScore={roi.riskScore}
                optionalityScore={roi.optionalityScore}
                mobilityScore={roi.mobilityScore}
                satisfactionScore={roi.satisfactionScore}
                networkScore={roi.networkScore}
              />
            </div>

            {/* Cost breakdown */}
            <div className="glass-card p-6">
              <h3
                className="font-display font-semibold mb-4"
                style={{ fontSize: 18, color: "#09090B" }}
              >
                Total Cost of Degree
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Tuition (total)", value: costs.totalTuitionInr },
                  { label: "Hostel & Living", value: costs.hostelLivingInr },
                  { label: "Exam Prep (JEE etc)", value: costs.examPrepCostsInr },
                  { label: "Opportunity Cost", value: costs.opportunityCostInr },
                ].map((item) => (
                  <div key={item.label}>
                    <p style={{ fontSize: 11, color: "#64748B", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {item.label}
                    </p>
                    <p className="font-mono font-bold" style={{ fontSize: 15, color: "#09090B" }}>
                      {formatInr(item.value)}
                    </p>
                  </div>
                ))}
              </div>
              <div
                style={{ borderTop: "1px solid #E2E8F0", paddingTop: 12, marginTop: 12 }}
              >
                <div className="flex justify-between items-center">
                  <span style={{ fontSize: 13, color: "#64748B" }}>Total Cost of Degree</span>
                  <span
                    className="font-mono font-bold"
                    style={{ fontSize: 18, color: costOfDegree != null ? "#E11D48" : "#94A3B8" }}
                  >
                    {costOfDegree != null ? formatInr(costOfDegree) : "Not determinable"}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
                  {costOfDegree != null
                    ? "Includes opportunity cost — what you'd earn if you'd taken a job after 12th (avg PLFS data)"
                    : "We could not verify a total tuition figure for this program, so we will not estimate a cost of degree. Every ROI figure on this page depends on it."}
                </p>
              </div>
            </div>

            {/* City Job Market Demand Telemetry */}
            <JobMarketCard initialField={degree.field} initialCity="bengaluru" />

            {/* Student Experience Psychometrics Radar */}
            <PsychometricsRadar />

            {/* GitHub & Wikidata Ecosystem Badge */}
            <EcosystemBadge universityName={college.name} />

            {/* AI Advisor Floating Consultation Widget */}
            <AIAdvisorWidget
              initialBudget={costOfDegree != null ? Math.round(costOfDegree / 100000) : undefined}
              initialField={degree.field}
            />
          </div>

          {/* Right: Risk grid + raw data + similar */}
          <div className="space-y-6">
            {/* Risk grid */}
            <div className="glass-card p-6">
              <h3
                className="font-display font-semibold mb-4"
                style={{ fontSize: 18, color: "#09090B" }}
              >
                Risk Dashboard
              </h3>
              <RiskGrid items={riskItems} />
            </div>

            {/* Data provenance */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Database size={14} style={{ color: "#64748B" }} />
                <h3
                  className="font-display font-semibold"
                  style={{ fontSize: 16, color: "#09090B" }}
                >
                  Data Sources
                </h3>
              </div>
              {[
                { source: "NIRF 2024", fields: "Placement %, fees, student count", updated: `${meta.dataFreshnessDays}d ago` },
                { source: "AmbitionBox", fields: "Salary by experience, satisfaction", updated: `${meta.dataFreshnessDays + 2}d ago` },
                { source: "Oxford O*NET", fields: "Automation probability", updated: "Annually" },
                { source: "World Bank ICP", fields: "PPP conversion factors", updated: "Quarterly" },
              ].map((src) => (
                <div
                  key={src.source}
                  style={{
                    paddingBottom: 10,
                    marginBottom: 10,
                    borderBottom: "1px solid #E2E8F0",
                  }}
                >
                  <div className="flex justify-between items-start">
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#09090B" }}>
                      {src.source}
                    </p>
                    <span style={{ fontSize: 10, color: "#94A3B8" }}>{src.updated}</span>
                  </div>
                  <p style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                    {src.fields}
                  </p>
                </div>
              ))}
              <p style={{ fontSize: 10, color: "#94A3B8" }}>
                Model version: {meta.scrapeSource.split("+")[0].trim()}
              </p>
            </div>
          </div>
        </div>

        {/* Similar programs */}
        {similar.length > 0 && (
          <div className="mt-8">
            <h2
              className="font-display font-semibold mb-4"
              style={{ fontSize: 22, color: "#09090B" }}
            >
              Similar Programs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {similar.map((r) => (
                <CollegeCard key={r.id} record={r} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
