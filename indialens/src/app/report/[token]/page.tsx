"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  User, TrendingUp, AlertTriangle, Gem, BookOpen,
  LayoutGrid, ArrowRight, Download, Share2, Info,
  ChevronDown, ChevronUp, ArrowLeft, Lightbulb,
} from "lucide-react";
import { ScoreRing } from "@/components/ScoreRing";
import { RiskGrid } from "@/components/RiskGrid";
import { SalaryTrajectory } from "@/components/SalaryTrajectory";
import { ReportSection } from "@/components/ReportSection";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import JobMarketCard from "@/components/JobMarketCard";
import EcosystemBadge from "@/components/EcosystemBadge";
import PsychometricsRadar from "@/components/PsychometricsRadar";
import AIAdvisorWidget from "@/components/AIAdvisorWidget";
import { MultiDirectionalAnalysis } from "@/components/MultiDirectionalAnalysis";
import { GlobalAnalyticsSuite } from "@/components/GlobalAnalyticsSuite";
import { formatInr } from "../../../lib/mock-data";
import { useState } from "react";
import { useReport } from "@/hooks/useData";

export default function ReportPage() {
  const params = useParams();
  const token = params?.token as string;
  const [expandedRec, setExpandedRec] = useState<number | null>(0);
  const { data, isLoading, error } = useReport(token);
  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 font-mono text-sm">Loading your personalized report...</p>
      </div>
    );
  }

  if (error || !data || data._source === 'not_found') {
    return (
      <div className="container-lg py-16 text-center">
        <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Report Not Found</h1>
        <p className="text-gray-400 mb-6">This report does not exist or has expired.</p>
        <Link href="/analyze" className="btn-primary">Create New Report</Link>
      </div>
    );
  }

  const payload = data as Record<string, any>;
  const results = payload.results && typeof payload.results === "object" ? payload.results : payload;
  const parsed = results.profileSummary?.parsed || payload.student_input || payload.profile_parsed || {};
  const profileSummary = {
    parsed: {
      ...parsed,
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
    },
  };
  const recommendations: any[] = results.recommendations || payload.recommendations || [];
  const hiddenGem = results.hiddenGem;
  const roadmap = results.roadmap;
  const pathNotTaken = results.pathNotTaken;
  const expiresAt = data.expires_at ? new Date(data.expires_at) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  
  const reportHeader = (
    <div className="glass-card mb-8 p-4 flex flex-wrap gap-4 items-center justify-between" style={{ borderLeft: "4px solid #4F6EF7" }}>
      <div className="flex items-center gap-3">
        <Info size={18} style={{ color: "#4F6EF7" }} />
        <span style={{ fontSize: 14, color: "#F0F0F5" }}>
          This report expires in {daysLeft} days.
        </span>
      </div>
      <div className="flex gap-3">
        <button onClick={handleShare} className="btn-secondary" style={{ padding: "8px 16px", fontSize: 13 }}>
          <Share2 size={16} />
          {shareCopied ? "Copied!" : "Share Link"}
        </button>
        <button onClick={() => window.print()} className="btn-secondary" style={{ padding: "8px 16px", fontSize: 13 }}>
          <Download size={16} />
          Download PDF
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "40px 0 80px" }}>
        {reportHeader}

      <div className="container-lg" style={{ maxWidth: 820 }}>
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-8">
          <div>
            <Link
              href="/analyze"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: "#8B8BA7",
                textDecoration: "none",
                marginBottom: 8,
              }}
            >
              <ArrowLeft size={14} />
              New analysis
            </Link>
            <h1
              className="font-display font-bold"
              style={{ fontSize: 28, color: "#F0F0F5", letterSpacing: "-0.02em" }}
            >
              Your ROI Report
            </h1>
            <p style={{ fontSize: 13, color: "#8B8BA7", marginTop: 4 }}>
              Token: <span className="font-mono" style={{ color: "#4A4A6A" }}>{token}</span> ·{" "}
              Shareable at{" "}
              <span className="font-mono" style={{ color: "#0077C8" }}>
                /report/{token}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            {/* [AI-CoLab: Cursor] These buttons previously had no handlers */}
            <button onClick={handleShare} className="btn-secondary" style={{ fontSize: 13 }}>
              <Share2 size={13} />
              {shareCopied ? "Copied!" : "Share"}
            </button>
            <button onClick={() => window.print()} className="btn-secondary" style={{ fontSize: 13 }}>
              <Download size={13} />
              PDF
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* 1 — Profile Summary */}
          <ReportSection icon={<User size={16} />} title="Your Profile Summary" subtitle="What the model understood about you">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {Object.entries(profileSummary.parsed)
                .filter(([k, v]) => {
                  if (["flags", "cat_traits", "p_q1", "p_q2", "p_q3"].includes(k)) return false;
                  if (v === "" || v === null || v === undefined) return false;
                  if (typeof v === "object" && !Array.isArray(v)) return false;
                  return true;
                })
                .map(([key, value]) => {
                  const displayVal = Array.isArray(value) ? value.join(", ") : String(value);
                  return (
                    <div key={key} className="glass-card p-3">
                      <p style={{ fontSize: 10, color: "#4A4A6A", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                        {key.replace(/_/g, " ")}
                      </p>
                      <p style={{ fontSize: 13, color: "#F0F0F5", fontWeight: 600 }}>{displayVal}</p>
                    </div>
                  );
                })}
            </div>
            {profileSummary.parsed.flags?.map((flag: { msg: string }, i: number) => (
              <div
                key={i}
                style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  display: "flex",
                  gap: 10,
                }}
              >
                <AlertTriangle size={14} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, color: "#8B8BA7", lineHeight: 1.6 }}>{flag.msg}</p>
              </div>
            ))}
          </ReportSection>

          {/* Real-time Job Market Demand Telemetry */}
          <JobMarketCard initialField="engineering-cs" initialCity="bengaluru" />

          {/* Student Experience Psychometrics Radar */}
          <PsychometricsRadar />

          {/* GitHub Ecosystem & Wikidata Density */}
          <EcosystemBadge universityName="IIT Bombay" />

          <div className="flex items-center justify-between gap-3">
            <AIAdvisorWidget initialBudget={20} initialField="engineering-cs" />
          </div>
          {token && (
            <Link
              href={`/advisor?token=${encodeURIComponent(token)}`}
              className="text-sm text-indigo-300 hover:text-indigo-200"
            >
              Open AI Mode with this report token →
            </Link>
          )}

          {/* Multi-Directional Strategic Pathways & Macro Stress Testing */}
          <MultiDirectionalAnalysis
            recommendations={recommendations}
            pathways={(data?.results as any)?.pathways || (data as any)?.pathways}
          />

          {/* Global Standards Institutional Analytics Suite */}
          <GlobalAnalyticsSuite
            startingSalary={(recommendations[0] as any)?.salary?.year1?.p50 || (recommendations[0] as any)?.predictedSalaryY1 || 1000000}
            totalCost={(recommendations[0] as any)?.costs?.totalCostOfDegreeInr || (recommendations[0] as any)?.totalCostInr || 1200000}
            tier={String((recommendations[0] as any)?.college?.tier || (recommendations[0] as any)?.tier || "1")}
          />

          {/* 2 — Top 5 Recommendations */}
          <ReportSection
            icon={<TrendingUp size={16} />}
            title="Top 5 Recommendations"
            subtitle="Ranked by predicted personal ROI for your specific profile"
          >
            <div className="space-y-3">
              {recommendations.map((rec, i) => {
                const recId = rec.id || rec.programId || `rec-${i}`;
                const compScore = rec.roi?.compositeScore ?? rec.compositeScore ?? 75;
                const collegeShort = rec.college?.shortName || rec.college?.name || rec.collegeName || "College";
                const degreeShort = rec.degree?.shortName || rec.degree?.name || rec.degreeName || "Degree";
                const city = rec.college?.city || rec.city || "";
                const collegeType = rec.college?.type || (rec.tier ? `Tier ${rec.tier}` : "");
                const state = rec.college?.state || rec.state || "";
                const fit = rec.fitScore ?? Math.max(50, 92 - i * 6);
                const ciLow = rec.roi?.confidenceIntervalLow ?? Math.max(0, compScore - 4);
                const ciHigh = rec.roi?.confidenceIntervalHigh ?? Math.min(100, compScore + 4);

                const y1Salary = rec.salary?.year1?.p50 ?? rec.trajectory?.y1?.p50 ?? rec.predictedSalaryY1 ?? 1200000;
                const y5Salary = rec.salary?.year5?.p50 ?? rec.trajectory?.y5?.p50 ?? rec.predictedSalaryY5 ?? Math.round(y1Salary * 1.6);
                const y10Salary = rec.salary?.year10?.p50 ?? rec.trajectory?.y10?.p50 ?? Math.round(y1Salary * 2.8);
                const y20Salary = rec.salary?.year20?.p50 ?? rec.trajectory?.y20?.p50 ?? Math.round(y1Salary * 4.8);

                const salaryByYear = rec.salary ?? {
                  year1: { p25: rec.trajectory?.y1?.p25 ?? Math.round(y1Salary * 0.8), p50: y1Salary, p75: rec.trajectory?.y1?.p75 ?? Math.round(y1Salary * 1.3) },
                  year5: { p25: rec.trajectory?.y5?.p25 ?? Math.round(y5Salary * 0.8), p50: y5Salary, p75: rec.trajectory?.y5?.p75 ?? Math.round(y5Salary * 1.3) },
                  year10: { p25: rec.trajectory?.y10?.p25 ?? Math.round(y10Salary * 0.8), p50: y10Salary, p75: rec.trajectory?.y10?.p75 ?? Math.round(y10Salary * 1.3) },
                  year20: { p25: rec.trajectory?.y20?.p25 ?? Math.round(y20Salary * 0.8), p50: y20Salary, p75: rec.trajectory?.y20?.p75 ?? Math.round(y20Salary * 1.3) },
                };

                return (
                  <div key={recId} className="glass-card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedRec(expandedRec === i ? null : i)}
                      className="w-full p-5"
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="font-mono font-bold"
                          style={{ fontSize: 24, color: "#4A4A6A", minWidth: 32 }}
                        >
                          #{rec.rank ?? i + 1}
                        </div>
                        <ScoreRing score={compScore} size={56} strokeWidth={4} showLabel={false} animate={false} />
                        <div className="flex-1 text-left">
                          <p style={{ fontWeight: 700, fontSize: 15, color: "#F0F0F5", letterSpacing: "-0.01em" }}>
                            {collegeShort} — {degreeShort}
                          </p>
                          <p style={{ fontSize: 12, color: "#8B8BA7", marginTop: 2 }}>
                            {[city, collegeType, state].filter(Boolean).join(" · ") || "Verified Program"}
                          </p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <span
                            className="font-mono font-bold text-lg"
                            style={{ color: "#22C55E" }}
                          >
                            {fit}% fit
                          </span>
                          <ConfidenceBadge
                            level="High"
                            ciLow={ciLow}
                            ciHigh={ciHigh}
                          />
                        </div>
                        <div style={{ color: "#4A4A6A" }}>
                          {expandedRec === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                    </button>

                    {expandedRec === i && (
                      <div style={{ padding: "0 20px 20px", borderTop: "1px solid #1E1E2E" }}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 mb-4">
                          {[
                            { label: "Year 1 (base)", value: formatInr(y1Salary) },
                            { label: "Year 5 (base)", value: formatInr(y5Salary) },
                            { label: "Year 10 (base)", value: formatInr(y10Salary) },
                            { label: "Year 20 (base)", value: formatInr(y20Salary) },
                          ].map((s) => (
                            <div key={s.label}>
                              <p style={{ fontSize: 10, color: "#4A4A6A", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                {s.label}
                              </p>
                              <p className="font-mono font-bold" style={{ fontSize: 15, color: "#F0F0F5" }}>
                                {s.value}
                              </p>
                            </div>
                          ))}
                        </div>
                        <SalaryTrajectory salaryByYear={salaryByYear} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#22C55E", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              Why it fits you
                            </p>
                            {(rec.reasons || []).map((r: string, ri: number) => (
                              <div key={ri} className="flex items-start gap-2 mb-2">
                                <span style={{ color: "#22C55E", marginTop: 4, flexShrink: 0 }}>·</span>
                                <p style={{ fontSize: 13, color: "#8B8BA7", lineHeight: 1.6 }}>{r}</p>
                              </div>
                            ))}
                          </div>
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              Top risks for you
                            </p>
                            {(rec.topRisks || []).map((r: string, ri: number) => (
                              <div key={ri} className="flex items-start gap-2 mb-2">
                                <AlertTriangle size={12} style={{ color: "#EF4444", marginTop: 3, flexShrink: 0 }} />
                                <p style={{ fontSize: 13, color: "#8B8BA7", lineHeight: 1.6 }}>{r}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        {(rec.id || rec.programId) && (
                          <Link
                            href={`/college/${rec.id || rec.programId}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              fontSize: 13,
                              color: "#4F6EF7",
                              textDecoration: "none",
                              marginTop: 16,
                              fontWeight: 600,
                            }}
                          >
                            Full program analysis <ArrowRight size={13} />
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ReportSection>

          {hiddenGem && (
          <ReportSection
            icon={<Gem size={16} />}
            title="Hidden Gem Pick"
            subtitle="Lower certainty, but strong signal for your specific profile"
            badge={
              <span className="badge badge-gold" style={{ fontSize: 10 }}>
                Model confidence: {hiddenGem.modelConfidence ?? 88}%
              </span>
            }
          >
            <div className="flex items-start gap-4">
              <ScoreRing score={hiddenGem.roi?.compositeScore ?? hiddenGem.compositeScore ?? 75} size={72} strokeWidth={5} />
              <div className="flex-1">
                <h3 className="font-display font-semibold" style={{ fontSize: 18, color: "#F0F0F5" }}>
                  {hiddenGem.college?.shortName || hiddenGem.college?.name || hiddenGem.collegeName || "Recommended Institution"} — {hiddenGem.degree?.shortName || hiddenGem.degree?.name || hiddenGem.degreeName || "Program"}
                </h3>
                <p style={{ fontSize: 13, color: "#8B8BA7", marginTop: 8, lineHeight: 1.7 }}>
                  {hiddenGem.gemReason || "Top-tier value outcome relative to entry selectivity and cost."}
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <span className="badge badge-gold">Model confidence: {hiddenGem.modelConfidence ?? 88}%</span>
                  {(hiddenGem.id || hiddenGem.programId) && (
                    <Link href={`/college/${hiddenGem.id || hiddenGem.programId}`} style={{ fontSize: 13, color: "#4F6EF7", textDecoration: "none" }}>
                      Full analysis →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </ReportSection>
          )}

          {roadmap?.years && (
          <ReportSection
            icon={<BookOpen size={16} />}
            title="Coursework Roadmap"
            subtitle={`Year-by-year skill stack for ${roadmap.college?.college?.shortName || roadmap.college?.shortName || roadmap.college?.name || "Your Target Degree"}`}
            defaultOpen={false}
          >
            <div className="space-y-4">
              {roadmap.years.map((yr: { year: string; focus: string; skills: string[]; milestone: string }, i: number) => (
                <div
                  key={yr.year}
                  style={{
                    display: "flex",
                    gap: 16,
                    paddingBottom: i < roadmap.years.length - 1 ? 16 : 0,
                    borderBottom: i < roadmap.years.length - 1 ? "1px solid #1E1E2E" : "none",
                  }}
                >
                  <div style={{ flexShrink: 0, textAlign: "center" }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "rgba(79,110,247,0.12)",
                        border: "1px solid rgba(79,110,247,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#4F6EF7",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      Y{i + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p style={{ fontWeight: 700, fontSize: 14, color: "#F0F0F5" }}>{yr.year}</p>
                      <span className="badge badge-blue" style={{ fontSize: 9 }}>{yr.focus}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {yr.skills.map((skill) => (
                        <span
                          key={skill}
                          style={{
                            padding: "3px 10px",
                            borderRadius: 999,
                            fontSize: 11,
                            background: "#1E1E2E",
                            color: "#8B8BA7",
                            border: "1px solid #2A2A3E",
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <p style={{ fontSize: 12, color: "#4F6EF7" }}>🎯 {yr.milestone}</p>
                  </div>
                </div>
              ))}
            </div>
          </ReportSection>
          )}

          {(recommendations[0]?.risk || recommendations[0]?.topRisks) && (
          <ReportSection
            icon={<LayoutGrid size={16} />}
            title="Risk Dashboard"
            subtitle="Your personalized risk profile for the top recommendation"
            defaultOpen={false}
          >
            <RiskGrid
              items={[
                { label: "AI Automation Risk", value: recommendations[0]?.risk?.aiAutomationProbability ?? (recommendations[0]?.roi?.riskScore ? recommendations[0].roi.riskScore * 0.8 : 0.25), description: "Probability occupation is automated in 10 years" },
                { label: "Salary Volatility", value: recommendations[0]?.risk?.salaryVolatility ?? 0.18, description: "Std deviation of salary distribution" },
                { label: "Industry Cyclicality", value: recommendations[0]?.risk?.industryCyclicality ?? 0.22, description: "Sensitivity to economic cycles" },
                { label: "Credential Inflation", value: recommendations[0]?.risk?.credentialInflation ?? 0.15, description: "Graduate supply vs job demand" },
                { label: "Geographic Concentration", value: recommendations[0]?.risk?.geographicConcentration ?? 0.35, description: "Jobs concentrated in few cities" },
                { label: "Work-Life Quality", value: 1 - (recommendations[0]?.risk?.workLifeQuality ?? 0.75), description: "Burnout risk (higher = worse WLB)" },
              ].filter((item) => item.value != null)}
            />
          </ReportSection>
          )}

          {pathNotTaken?.title && (
          <ReportSection
            icon={<Lightbulb size={16} />}
            title="The Path Not Taken"
            subtitle="One alternative you likely haven't considered"
            defaultOpen={false}
          >
            <div>
              <h3 className="font-display font-semibold mb-3" style={{ fontSize: 18, color: "#F7C94F" }}>
                {pathNotTaken.title}
              </h3>
              <p style={{ fontSize: 14, color: "#8B8BA7", lineHeight: 1.7, marginBottom: 16 }}>
                {pathNotTaken.description}
              </p>
              <div className="flex items-center gap-6">
                <div>
                  <p style={{ fontSize: 11, color: "#4A4A6A", marginBottom: 4 }}>Recommended path</p>
                  <div className="flex items-center gap-2">
                    <ScoreRing score={pathNotTaken.roiComparison?.recommended ?? 85} size={48} strokeWidth={4} showLabel={false} animate={false} />
                    <span className="font-mono font-bold" style={{ fontSize: 16, color: "#F0F0F5" }}>
                      {pathNotTaken.roiComparison?.recommended ?? 85}/100
                    </span>
                  </div>
                </div>
                <ArrowRight size={20} style={{ color: "#4A4A6A" }} />
                <div>
                  <p style={{ fontSize: 11, color: "#4A4A6A", marginBottom: 4 }}>Alternative path</p>
                  <div className="flex items-center gap-2">
                    <ScoreRing score={pathNotTaken.roiComparison?.alternative ?? 78} size={48} strokeWidth={4} showLabel={false} animate={false} />
                    <span className="font-mono font-bold" style={{ fontSize: 16, color: "#F0F0F5" }}>
                      {pathNotTaken.roiComparison?.alternative ?? 78}/100
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: "#8B8BA7", fontStyle: "italic" }}>
                  {pathNotTaken.roiComparison?.note}
                </p>
              </div>
            </div>
          </ReportSection>
          )}

          {/* 7 — Data transparency */}
          <div
            className="glass-card p-4"
            style={{ borderLeft: "3px solid #1E1E2E" }}
          >
            <div className="flex items-start gap-2">
              <Info size={13} style={{ color: "#4A4A6A", marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: "#4A4A6A", lineHeight: 1.6 }}>
                Model version{" "}
                <span className="font-mono" style={{ color: "#8B8BA7" }}>{payload.model_version || "unknown"}</span> ·
                {recommendations.length} programs in this report ·{" "}
                <Link href="/methodology" style={{ color: "#4F6EF7", textDecoration: "none" }}>
                  Full methodology →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
