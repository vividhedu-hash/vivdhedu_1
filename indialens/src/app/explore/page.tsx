"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Lock, RefreshCw, SlidersHorizontal } from "lucide-react";
import type { CollegeDegreeRecord, DegreeField } from "@/lib/mock-data";
import { finiteOrNull, compareNullableAsc, compareNullableDesc, NO_DATA } from "@/lib/mock-data";

const FIELD_LABELS: Record<DegreeField, string> = {
  "engineering-cs":     "Engineering — CS",
  "engineering-non-cs": "Engineering — Core",
  medicine:   "Medicine",
  management: "Management",
  commerce:   "Commerce",
  design:     "Design",
  law:        "Law",
  arts:       "Arts & Humanities",
};

/** Unmeasured placement renders as null, which displays as "—" — not as 0%. */
function placementPct(record: CollegeDegreeRecord): number | null {
  const rate = finiteOrNull(record.placement?.rate);
  if (rate == null) return null;
  return Math.round(rate <= 1 ? rate * 100 : rate);
}

/**
 * Total tuition for a row, or null when unmeasured.
 *
 * Every list row reaches this page from one of two shapes: the Supabase
 * mapper (which always builds a full `costs` object) or the FastAPI list
 * endpoint. The FastAPI list rows are cast straight to `CollegeDegreeRecord`
 * in `live-colleges.ts` with no validation, so a backend that predates the
 * `costs` block — or one that omitted it for a program with no cost_data row
 * — leaves `costs` undefined. A bare `a.costs.totalTuitionInr` inside the
 * sort comparator then throws inside `useMemo` and blanks the whole page. The
 * optional chain keeps a missing field a "no data" cell instead of a crash.
 */
function tuitionInr(record: CollegeDegreeRecord): number | null {
  return finiteOrNull(record.costs?.totalTuitionInr);
}

/**
 * Colour-code a composite score. A null score is deliberately NOT red — red
 * asserts "this is the worst program on the list", when the truth is "we have
 * not measured it". It renders neutral grey with an explicit dash instead.
 */
function scoreColor(score: number | null): string {
  if (score == null) return "#6E6E73";
  if (score >= 80) return "#30D158";
  if (score >= 50) return "#FF9F0A";
  return "#FF453A";
}

export default function ExplorePage() {
  const [data, setData]         = useState<CollegeDegreeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [search,      setSearch]      = useState("");
  const [fieldFilter, setFieldFilter] = useState("");
  const [sortBy,      setSortBy]      = useState("score-desc");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setLoadError(false);
      try {
        const res  = await fetch("/api/colleges?per_page=100", { cache: "no-store" });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(Array.isArray(json.data) ? json.data : []);
      } catch (err) {
        console.error(err);
        if (!cancelled) { setData([]); setLoadError(true); }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [reloadKey]);

  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.college.shortName.toLowerCase().includes(q) ||
          c.college.name.toLowerCase().includes(q) ||
          c.college.city.toLowerCase().includes(q) ||
          c.degree.shortName.toLowerCase().includes(q) ||
          c.degree.name.toLowerCase().includes(q),
      );
    }

    if (fieldFilter) {
      filtered = filtered.filter((c) => c.degree.field === fieldFilter);
    }

    // Programs with no measured score always sort last, in both directions —
    // otherwise `null - 90` is NaN and an unscored row jumps to the top of the
    // "Lowest Score" list, or to the bottom of "Highest Score" as if it were 0.
    filtered.sort((a, b) => {
      if (sortBy === "score-desc")
        return compareNullableDesc(
          finiteOrNull(a.roi.compositeScore),
          finiteOrNull(b.roi.compositeScore),
        );
      if (sortBy === "score-asc")
        return compareNullableAsc(
          finiteOrNull(a.roi.compositeScore),
          finiteOrNull(b.roi.compositeScore),
        );
      if (sortBy === "tuition-asc")
        return compareNullableAsc(tuitionInr(a), tuitionInr(b));
      if (sortBy === "tuition-desc")
        return compareNullableDesc(tuitionInr(a), tuitionInr(b));
      return 0;
    });

    return filtered;
  }, [data, search, fieldFilter, sortBy]);

  const uniqueFields = Array.from(new Set(data.map((d) => d.degree.field)));

  return (
    <div className="min-h-screen bg-black text-[#F5F5F7] pb-24">

      {/* Header */}
      <div className="container-xl pt-14 pb-10">
        <p className="kicker-web mb-4">Program Asset Index</p>
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight text-[#F5F5F7] mb-3">
          India&apos;s degrees, priced as financial assets.
        </h1>
        <p className="text-[#86868B] text-sm max-w-xl mb-8 leading-relaxed">
          1,420+ institutional programs ranked by composite ROI, AI displacement risk, and 20-year placement trajectory.
        </p>
        <Link href="/analyze" className="btn-primary inline-flex">
          Analyze a specific degree
        </Link>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-[58px] z-10 bg-black/95 backdrop-blur-xl border-b border-white/[0.06] py-3.5">
        <div className="container-xl flex flex-wrap md:flex-nowrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#48484A]" size={15} />
            <input
              type="text"
              placeholder="Search institutions, programs, or cities…"
              className="form-input pl-9 text-[13px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-input form-select text-[13px] w-auto"
            value={fieldFilter}
            onChange={(e) => setFieldFilter(e.target.value)}
          >
            <option value="">All Fields</option>
            {uniqueFields.map((f) => (
              <option key={f} value={f}>{FIELD_LABELS[f] ?? f}</option>
            ))}
          </select>

          <select
            className="form-input form-select text-[13px] w-auto"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="score-desc">Highest Score</option>
            <option value="score-asc">Lowest Score</option>
            <option value="tuition-asc">Lowest Tuition</option>
            <option value="tuition-desc">Highest Tuition</option>
          </select>

          {!isLoading && (
            <span className="text-[11px] text-[#48484A] font-mono whitespace-nowrap">
              {filteredData.length} program{filteredData.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container-xl mt-8">
        {isLoading ? (
          <div className="text-center py-16 text-[#48484A] font-mono text-sm">
            Loading program index…
          </div>
        ) : loadError ? (
          <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl text-center py-14 px-8">
            <p className="text-[#86868B] mb-5 text-sm">The program index could not be loaded. Please try again.</p>
            <button
              className="btn-secondary inline-flex items-center gap-2"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto bg-[#0A0A0A] border border-white/[0.08] rounded-2xl">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th className="p-4 text-left rounded-tl-2xl">Rank</th>
                    <th className="p-4 text-left">Institution & Program</th>
                    <th className="p-4 text-left">Score</th>
                    <th className="p-4 text-left">AI Risk</th>
                    <th className="p-4 text-left">Placement</th>
                    <th className="p-4 text-left">Tuition</th>
                    <th className="p-4 text-left rounded-tr-2xl">Audit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => {
                    const badgeClass =
                      item.meta.aiRiskLabel === "Low"    ? "badge-green" :
                      item.meta.aiRiskLabel === "Medium" ? "badge-amber" : "badge-red";

                    const composite = finiteOrNull(item.roi.compositeScore);
                    const scoreTone = scoreColor(composite);
                    const placement = placementPct(item);
                    const tuition = tuitionInr(item);

                    return (
                      <tr key={item.id} className="transition-colors hover:bg-white/[0.03]">
                        <td className="p-4 font-mono text-[#48484A] text-[12px]">{index + 1}</td>
                        <td className="p-4">
                          <Link href={`/college/${item.id}`} className="hover:text-[#F5F5F7] transition group">
                            <div className="font-semibold text-[#F5F5F7] text-[13px]">{item.college.shortName}</div>
                            <div className="text-[12px] text-[#86868B] mt-0.5">{item.degree.shortName}</div>
                          </Link>
                        </td>
                        <td className="p-4">
                          {/* `.toFixed()` on a null score would throw; the dash
                              is the honest answer, not "0.0". */}
                          <span className="font-mono font-bold text-[13px]" style={{ color: scoreTone }}>
                            {composite == null ? NO_DATA : composite.toFixed(1)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`badge ${badgeClass}`}>{item.meta.aiRiskLabel}</span>
                        </td>
                        <td className="p-4 font-mono text-[#86868B] text-[13px]">
                          {placement == null ? NO_DATA : `${placement}%`}
                        </td>
                        <td className="p-4 font-mono text-[#86868B] text-[13px]">
                          {tuition == null ? NO_DATA : `₹${(tuition / 100000).toFixed(1)}L`}
                        </td>
                        <td className="p-4">
                          <Lock size={14} className="text-[#48484A]" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden grid gap-3 grid-cols-1 sm:grid-cols-2">
              {filteredData.map((item, index) => {
                const composite = finiteOrNull(item.roi.compositeScore);
                const scoreTone = scoreColor(composite);
                const placement = placementPct(item);
                const tuition = tuitionInr(item);

                return (
                  <Link key={item.id} href={`/college/${item.id}`}>
                    <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-4 hover:border-white/[0.14] transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-[10px] text-[#48484A] font-mono mb-1">#{index + 1}</div>
                          <h3 className="font-bold text-[#F5F5F7] text-[13px] leading-tight">{item.college.shortName}</h3>
                          <p className="text-[11px] text-[#86868B] mt-0.5">{item.degree.shortName}</p>
                        </div>
                        <span className="font-mono text-xl font-bold" style={{ color: scoreTone }}>
                          {composite == null ? NO_DATA : composite.toFixed(0)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[9px] text-[#48484A] font-mono uppercase">Tuition</div>
                          <div className="font-mono text-[#86868B] text-[12px]">
                            {tuition == null ? NO_DATA : `₹${(tuition / 100000).toFixed(1)}L`}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-[#48484A] font-mono uppercase">Placement</div>
                          <div className="font-mono text-[#86868B] text-[12px]">
                            {placement == null ? NO_DATA : `${placement}%`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {filteredData.length === 0 && (
              <div className="text-center py-14 text-[#48484A] font-mono text-sm">
                No programs found matching your filters.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
