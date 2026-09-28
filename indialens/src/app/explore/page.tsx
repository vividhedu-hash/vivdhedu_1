"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Lock, RefreshCw, SearchX } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import type { CollegeDegreeRecord, DegreeField } from "@/lib/mock-data";
import { finiteOrNull, compareNullableAsc, compareNullableDesc, NO_DATA } from "@/lib/mock-data";
import { GroundedAnswer } from "@/components/GroundedAnswer";
import type { GroundedPayload } from "@/lib/grounded";

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
 * Colour-code a composite score.
 *
 * Returns a CLASS, not a colour string. It used to return a raw hex applied
 * through `style={{ color }}`, which cannot respond to the theme — a dark-mode
 * visitor got the light-theme grey for "unmeasured", which does not exist on
 * black. The neutral is now `--text-tertiary` and the three tiers are the
 * system tokens, so this follows the theme.
 *
 * A null score is deliberately NOT red. Red asserts "this is the worst
 * programme on the list", when the truth is "we have not measured it". It
 * renders neutral with an explicit dash instead.
 */
function scoreToneClass(score: number | null): string {
  if (score == null) return "text-ink-3";
  if (score >= 80) return "text-sys-green";
  if (score >= 50) return "text-sys-amber";
  return "text-sys-red";
}

export default function ExplorePage() {
  const [data, setData]         = useState<CollegeDegreeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [search,      setSearch]      = useState("");
  const [fieldFilter, setFieldFilter] = useState("");
  const [sortBy,      setSortBy]      = useState("score-desc");
  const [live, setLive] = useState<GroundedPayload | null>(null);
  const [liveState, setLiveState] = useState<"idle" | "loading" | "ready" | "unavailable">("idle");
  const [liveNote, setLiveNote] = useState("");

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

  useEffect(() => {
    const query = search.trim();
    if (query.length < 3) {
      setLive(null);
      setLiveNote("");
      setLiveState("idle");
      return;
    }

    let cancelled = false;
    const handle = window.setTimeout(async () => {
      setLiveState("loading");
      setLive(null);
      try {
        const res = await fetch("/api/search/ground", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !json?.grounded || !Array.isArray(json.citations) || json.citations.length === 0) {
          setLive(null);
          setLiveNote(typeof json?.reason === "string" ? json.reason : "Live sources could not be retrieved for this search.");
          setLiveState("unavailable");
          return;
        }
        setLive({
          text: json.text,
          citations: json.citations,
          engine: json.engine,
          grounded: true,
          api: json.api,
        });
        setLiveNote(
          json.retrieved_at
            ? `Retrieved ${new Date(json.retrieved_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}.`
            : "Retrieved just now.",
        );
        setLiveState("ready");
      } catch {
        if (cancelled) return;
        setLive(null);
        setLiveNote("Live sources could not be retrieved for this search.");
        setLiveState("unavailable");
      }
    }, 600);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [search]);

  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (search) {
      const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
      filtered = filtered.filter((c) => {
        const haystack = [
          c.college.shortName,
          c.college.name,
          c.college.city,
          c.degree.shortName,
          c.degree.name,
        ].join(" ").toLowerCase();
        return terms.every((term) => haystack.includes(term));
      });
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
    <div className="min-h-screen bg-bg text-ink pb-24">

      {/* Header */}
      <div className="container-xl pt-14 pb-10">
        <p className="kicker-web mb-4">Program Asset Index</p>
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight text-ink mb-3">
          India&apos;s degrees, priced as financial assets.
        </h1>
        <p className="text-ink-2 text-sm max-w-xl mb-8 leading-relaxed">
          Every programme we have live data for, ranked by composite ROI, AI displacement risk,
          and 20-year placement trajectory. Where a source has not published a figure, the index
          says so rather than estimating one.
        </p>
        <Link href="/analyze" className="btn-primary inline-flex">
          Analyze a specific degree
        </Link>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-[58px] z-10 bg-bg/95 backdrop-blur-xl border-b border-line/10 py-3.5">
        <div className="container-xl flex flex-wrap md:flex-nowrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" size={15} />
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
            <span className="text-[11px] text-ink-3 font-mono whitespace-nowrap">
              {filteredData.length} program{filteredData.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container-xl mt-8">
        {search.trim().length >= 3 && (
          <div className="mb-8 bg-surface border border-line/10 rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-2 mb-3">
              Live sources
            </p>
            {liveState === "loading" && (
              <p className="text-sm text-ink-2">Searching the web for current sources…</p>
            )}
            {liveState === "ready" && live && (
              <>
                <GroundedAnswer payload={live} />
                <p className="mt-4 text-[11px] text-ink-3">{liveNote} The table below is the stored program index.</p>
              </>
            )}
            {liveState === "unavailable" && (
              <p className="text-sm text-ink-2">{liveNote} The programs below are from the stored index.</p>
            )}
          </div>
        )}
        {isLoading ? (
          <div className="text-center py-16 text-ink-3 font-mono text-sm">
            Loading program index…
          </div>
        ) : loadError ? (
          <div className="bg-surface border border-line/10 rounded-xl text-center py-14 px-8">
            <p className="text-ink-2 mb-5 text-sm">The program index could not be loaded. Please try again.</p>
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
            <div className="hidden md:block overflow-x-auto bg-surface border border-line/10 rounded-2xl">
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
                    const scoreTone = scoreToneClass(composite);
                    const placement = placementPct(item);
                    const tuition = tuitionInr(item);

                    return (
                      <tr key={item.id} className="transition-colors hover:bg-elevated/[0.03]">
                        <td className="p-4 font-mono text-ink-3 text-[12px]">{index + 1}</td>
                        <td className="p-4">
                          <Link href={`/college/${item.id}`} className="hover:text-ink transition group">
                            <div className="font-semibold text-ink text-[13px]">{item.college.shortName}</div>
                            <div className="text-[12px] text-ink-2 mt-0.5">{item.degree.shortName}</div>
                          </Link>
                        </td>
                        <td className="p-4">
                          {/* `.toFixed()` on a null score would throw; the dash
                              is the honest answer, not "0.0". */}
                          <span className={`font-mono font-bold text-[13px] ${scoreTone}`}>
                            {composite == null ? NO_DATA : composite.toFixed(1)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`badge ${badgeClass}`}>{item.meta.aiRiskLabel}</span>
                        </td>
                        <td className="p-4 font-mono text-ink-2 text-[13px]">
                          {placement == null ? NO_DATA : `${placement}%`}
                        </td>
                        <td className="p-4 font-mono text-ink-2 text-[13px]">
                          {tuition == null ? NO_DATA : `₹${(tuition / 100000).toFixed(1)}L`}
                        </td>
                        <td className="p-4">
                          <Lock size={14} className="text-ink-3" />
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
                const scoreTone = scoreToneClass(composite);
                const placement = placementPct(item);
                const tuition = tuitionInr(item);

                return (
                  <Link key={item.id} href={`/college/${item.id}`}>
                    <div className="bg-surface border border-line/10 rounded-xl p-4 hover:border-line/20 transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-[10px] text-ink-3 font-mono mb-1">#{index + 1}</div>
                          <h3 className="font-bold text-ink text-[13px] leading-tight">{item.college.shortName}</h3>
                          <p className="text-[11px] text-ink-2 mt-0.5">{item.degree.shortName}</p>
                        </div>
                        <span className={`font-mono text-xl font-bold ${scoreTone}`}>
                          {composite == null ? NO_DATA : composite.toFixed(0)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[9px] text-ink-3 font-mono uppercase">Tuition</div>
                          <div className="font-mono text-ink-2 text-[12px]">
                            {tuition == null ? NO_DATA : `₹${(tuition / 100000).toFixed(1)}L`}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-ink-3 font-mono uppercase">Placement</div>
                          <div className="font-mono text-ink-2 text-[12px]">
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
              /* "Nothing matched" is a different state from "nothing indexed".
                 It says what to do about it, rather than leaving the user to
                 guess whether the filters or the dataset are at fault. */
              <EmptyState
                icon={SearchX}
                title="No programs match these filters"
                hint="The index is loaded and every program in it is accounted for — none of them match the filters you have set. Try widening the score range or clearing the field of study."
                action={{ label: "Clear all filters", href: "/explore" }}
                secondaryAction={{ label: "Analyse a specific degree", href: "/analyze" }}
                variant="bare"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
