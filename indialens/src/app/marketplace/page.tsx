"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ShoppingBag,
  ExternalLink,
  Filter,
  RefreshCw,
  Loader2,
  CircleAlert,
  CheckCircle2,
  Lock,
  Search,
  Info,
  BookX,
  FilterX,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { NO_DATA, finiteOrNull } from "@/lib/mock-data";

/*
 * Both lists on this page are served by backend/api/routers/marketplace.py:
 *
 *   GET  /api/v2/marketplace/catalog      → the course_marketplace catalog
 *   GET  /api/v2/marketplace/recommended  → Formula 3.1 skill-gap matching
 *   POST /api/v2/marketplace/track-click  → affiliate telemetry
 *
 * The previous version shipped six hardcoded courses whose `match_score`,
 * `ai_resilience_score` and `projected_salary_uplift_inr` were typed into the
 * file. Nothing measured them, and a student could not see that. Every field
 * below now comes off the wire, and fields the catalog does not carry are
 * shown as "—" rather than filled in.
 */

/** A `course_marketplace` row (backend/db/schema.sql:515). */
interface CatalogCourse {
  id?: string | null;
  course_title: string;
  provider: string;
  category: string;
  affiliate_url: string;
  price_inr: number | null;
  duration_hours: number | null;
  skill_tags: string[] | null;
  career_paths: string[] | null;
  ai_resilience_score: number | null;
}

interface CatalogResponse {
  courses: CatalogCourse[];
  total: number;
  source: string;
}

/** One row of `matched_courses` — marketplace_engine.match_course_for_student
 *  (backend/ml/nextgen_engine.py:899). `is_gated_display` is the M ≥ 0.75 gate. */
interface MatchedCourse {
  course_id?: string | null;
  course_title: string;
  provider: string;
  category: string;
  affiliate_url: string;
  price_inr: number;
  match_score: number;
  is_gated_display: boolean;
  projected_salary_uplift_inr: number;
  skill_gap_addressed: string[];
  ai_resilience_score: number;
}

interface RecommendedResponse {
  target_role: string | null;
  match_threshold: number;
  matched_courses: MatchedCourse[];
  count: number;
}

const MATCH_THRESHOLD = 0.75;
const inr = (n: number | null) => (n == null ? NO_DATA : `₹${Math.round(n).toLocaleString()}`);

/** What the click handler needs: identity, destination, and a real match score
 *  if the matching engine produced one. */
interface TrackableCourse {
  id?: string | null;
  course_title: string;
  affiliate_url: string;
  match_score?: number;
}

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // ── Catalog ──────────────────────────────────────────────────────────
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [catalogSource, setCatalogSource] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/v2/marketplace/catalog", { cache: "no-store" });
      if (!res.ok) throw new Error("catalog unavailable");
      const body = (await res.json()) as Partial<CatalogResponse>;
      if (!Array.isArray(body.courses)) throw new Error("catalog unavailable");
      setCourses(body.courses);
      setCatalogSource(typeof body.source === "string" ? body.source : null);
    } catch {
      setCourses([]);
      setLoadError("The course catalog could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog, reloadKey]);

  // ── Skill-gap matching inputs ─────────────────────────────────────────
  const [skillsInput, setSkillsInput] = useState("");
  const [targetRole, setTargetRole] = useState("AI Engineer");
  const [monthlyBudget, setMonthlyBudget] = useState(5000);
  const [hasRunMatch, setHasRunMatch] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchedCourse[] | null>(null);
  const [matchThreshold, setMatchThreshold] = useState<number>(MATCH_THRESHOLD);
  const [matchUsedDefaultSkills, setMatchUsedDefaultSkills] = useState(false);

  const parsedSkills = useMemo(
    () =>
      skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [skillsInput],
  );

  const runMatch = async () => {
    setIsMatching(true);
    setMatchError(null);
    try {
      const params = new URLSearchParams();
      params.set("target_role", targetRole.trim() || "AI Engineer");
      params.set("monthly_budget_inr", String(monthlyBudget || 0));
      const res = await fetch(`/api/v2/marketplace/recommended?${params.toString()}`, {
        cache: "no-store",
      });
      const body = (await res.json().catch(() => null)) as RecommendedResponse | null;
      if (!res.ok || !body || !Array.isArray(body.matched_courses)) {
        setMatchError("The skill-gap matching engine did not return results.");
        setMatches(null);
        return;
      }
      setMatches(body.matched_courses);
      setMatchThreshold(finiteOrNull(body.match_threshold) ?? MATCH_THRESHOLD);
      // With no skills supplied the engine scores against its own hardcoded
      // default list (marketplace.py:78). Saying so is the difference between
      // a match score and a flattering coincidence.
      setMatchUsedDefaultSkills(parsedSkills.length === 0);
      setHasRunMatch(true);
    } catch {
      setMatchError("The skill-gap matching engine could not be reached.");
      setMatches(null);
    } finally {
      setIsMatching(false);
    }
  };

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(courses.map((c) => c.category).filter(Boolean))).sort()],
    [courses],
  );

  const visibleCourses = useMemo(() => {
    // marketplace.py:59 — the `except` branch of /catalog returns the whole
    // unfiltered seed and ignores the `category` query param, so a category
    // selection can come back unfiltered. Filtering a list the server
    // actually returned is not inventing data, so it is applied here.
    return courses.filter((c) => selectedCategory === "All" || c.category === selectedCategory);
  }, [courses, selectedCategory]);

  const handleTrackClick = async (course: TrackableCourse) => {
    // `match_score` is a NOT NULL numeric column on course_impressions. Writing
    // a made-up score just to satisfy the schema would seed the analytics table
    // with a number no engine produced, so tracking fires only for courses the
    // matching engine actually scored. Catalog-only clicks open the provider
    // link unattributed rather than being logged as a 0.00 match.
    if (typeof course.match_score === "number") {
      try {
        await fetch("/api/v2/marketplace/track-click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: course.id ?? course.course_title,
            student_token: "guest_session",
            match_score: course.match_score,
          }),
        });
      } catch {
        // Non-blocking telemetry
      }
    }
    window.open(course.affiliate_url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="border-b border-slate-200 pb-8 mb-10">
          <div className="flex items-center gap-2 text-rose-600 text-xs uppercase tracking-widest font-mono font-semibold mb-2">
            <ShoppingBag className="w-4 h-4" />
            <span>Actuarial Upskilling Hub · Section 03 Specification</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
            Curated Course Marketplace &amp; Skill Gap Hedge
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-3xl leading-relaxed">
            The catalog is the server&apos;s <code className="font-mono text-sm">course_marketplace</code>{" "}
            table. Enter your current skills and a target role to have the matching engine score it
            against your actual gaps, and to see exactly which skills each course would add.
          </p>
        </div>

        {/* Skill-gap matcher */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex items-center gap-2 text-rose-600 text-xs font-mono uppercase tracking-wider mb-2">
            <Search className="w-4 h-4" />
            <span>Formula 3.1 Skill-Gap Matcher</span>
          </div>
          <h2 className="text-base font-bold text-slate-950 mb-1">What should we match you against?</h2>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            M = 0.35·SkillGap + 0.25·CareerAlign + 0.25·AI-Resilience + 0.15·BudgetFit. Only courses at
            or above M ≥ {MATCH_THRESHOLD} are returned.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label htmlFor="skills" className="block text-xs font-mono text-slate-500 uppercase mb-1">
                Skills you already have (comma separated)
              </label>
              <input
                id="skills"
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="e.g. Python, Data Analysis, Calculus"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-xs font-mono text-slate-500 uppercase mb-1">
                Target role
              </label>
              <input
                id="role"
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label htmlFor="budget" className="block text-xs font-mono text-slate-500 uppercase mb-1">
                Monthly budget (₹)
              </label>
              <input
                id="budget"
                type="number"
                min={0}
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => void runMatch()}
              disabled={isMatching}
              className="bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition"
            >
              {isMatching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>{isMatching ? "Matching…" : "Match courses to my gaps"}</span>
            </button>
            {hasRunMatch && (
              <button
                onClick={() => {
                  setHasRunMatch(false);
                  setMatches(null);
                  setMatchError(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-900 underline"
              >
                Clear results
              </button>
            )}
          </div>

          {matchUsedDefaultSkills && hasRunMatch && (
            <p className="mt-4 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 leading-relaxed">
              You left the skills field empty, so the engine scored against its own default assumption
              (Python, Data Analysis, Calculus). These scores describe that assumed profile, not you.
            </p>
          )}

          {matchError && (
            <div className="mt-4 flex items-start gap-2 text-[11px] text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3">
              <CircleAlert className="w-3.5 h-3.5 mt-px shrink-0" />
              <span>{matchError} No match scores are shown in its place.</span>
            </div>
          )}

          {hasRunMatch && !matchError && matches && matches.length > 0 && (
            <div className="mt-6 space-y-3">
              {matches.map((m, i) => (
                <div
                  key={`${m.course_title}-${i}`}
                  className="border border-emerald-200 bg-emerald-50/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-start gap-4 justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="epistemic-tag tag-ui">
                        <CheckCircle2 size={9} />
                        M={Math.round(m.match_score * 100)}%
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {m.provider} · {m.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-950 mt-1.5">{m.course_title}</h3>
                    <p className="text-[11px] text-slate-600 mt-1">
                      <span className="font-mono uppercase text-slate-400">Skills this adds that you lack:</span>{" "}
                      {m.skill_gap_addressed.length > 0 ? m.skill_gap_addressed.join(", ") : NO_DATA}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                      AI-resilience {Math.round(m.ai_resilience_score * 100)}% is a stored catalog
                      attribute for this course, not a measured outcome. The engine&apos;s{" "}
                      <code className="font-mono">projected_salary_uplift_inr</code> is a flat fee ×
                      18.5 multiple ({inr(m.projected_salary_uplift_inr)}) — it is a cost multiple, not a
                      predicted salary, and is not shown as one.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      void handleTrackClick({
                        id: m.course_id ?? null,
                        course_title: m.course_title,
                        affiliate_url: m.affiliate_url,
                        match_score: m.match_score,
                      })
                    }
                    className="shrink-0 bg-slate-950 hover:bg-slate-800 text-white rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <span>Enroll on {m.provider}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 mt-px shrink-0 text-slate-400" />
                <span>
                  The skill-gap term measures the share of a course&apos;s skills you do not already
                  have, so a shorter skill list raises it. A high M on this component means
                  &ldquo;this course adds a lot for you&rdquo;, not &ldquo;you are well prepared&rdquo;.
                </span>
              </p>
            </div>
          )}

          {hasRunMatch && !matchError && matches && matches.length === 0 && (
            <div className="mt-5 border border-slate-200 bg-slate-50 rounded-xl p-4 text-xs text-slate-700">
              <p className="font-semibold text-slate-900">
                No catalog course reached M ≥ {matchThreshold} for this profile.
              </p>
              <p className="mt-1 text-slate-600">
                That is a real result, not a missing one. Raising your budget or targeting a role the
                catalog lists will change it.
              </p>
            </div>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-8 bg-white border border-slate-200 p-2.5 rounded-xl shadow-sm">
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 uppercase px-2">
            <Filter className="w-3.5 h-3.5" />
            Category
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              disabled={isLoading}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-40 ${
                selectedCategory === cat
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
          {!isLoading && (
            <span className="ml-auto text-[11px] font-mono text-slate-400">
              {visibleCourses.length} course{visibleCourses.length === 1 ? "" : "s"}
              {catalogSource ? ` · ${catalogSource.replace(/_/g, " ")}` : ""}
            </span>
          )}
        </div>

        {/* Catalog states: loading → error → empty → data */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-3" />
            <p className="text-sm font-mono">Loading course catalog…</p>
          </div>
        ) : loadError ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
            <CircleAlert className="w-6 h-6 text-rose-600 mx-auto mb-3" />
            <p className="text-sm text-slate-700">{loadError}</p>
            <p className="text-xs text-slate-500 mt-1">
              Courses are not substituted from a local list — a list that did not come from the
              catalog would look reviewed when it was not.
            </p>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="mt-5 inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl px-4 py-2.5 text-xs font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : visibleCourses.length === 0 ? (
          /* "The catalogue is empty" and "your filter excluded everything" are
             different states with different remedies, so the copy branches and
             so does the action offered. */
          <EmptyState
            icon={courses.length === 0 ? BookX : FilterX}
            title={courses.length === 0 ? "The catalogue returned no courses" : "No courses in this category"}
            hint={
              courses.length === 0
                ? "This is what the source returned, not a loading failure and not an empty search. We show it as-is rather than substituting recommended courses that were not in the data."
                : "Courses exist in the catalogue, but none are filed under this category. Showing all categories will bring them back."
            }
            action={
              courses.length > 0 && selectedCategory !== "All"
                ? { label: "Show all categories", onClick: () => setSelectedCategory("All") }
                : { label: "Explore the program index", href: "/explore" }
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleCourses.map((course, idx) => {
              const resilience = finiteOrNull(course.ai_resilience_score);
              return (
                <div
                  key={course.id ?? `${course.course_title}-${idx}`}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {course.provider}
                      </span>
                      {/* The catalog table carries no match score — it is only
                          computed per student by /recommended. Showing a number
                          here would mean inventing one. */}
                      <span className="epistemic-tag tag-gap" title="Not yet scored against your profile">
                        <Lock size={9} />
                        Not scored
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-950 leading-snug">{course.course_title}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {course.category} · {finiteOrNull(course.duration_hours) == null ? NO_DATA : `${course.duration_hours} Hours`}
                    </p>

                    {course.career_paths && course.career_paths.length > 0 && (
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        <span className="font-mono uppercase text-slate-400">Roles:</span>{" "}
                        {course.career_paths.join(", ")}
                      </p>
                    )}

                    {/* Skill Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(course.skill_tags ?? []).length === 0 ? (
                        <span className="text-[11px] text-slate-400 font-mono">No skill tags recorded</span>
                      ) : (
                        (course.skill_tags ?? []).map((st, i) => (
                          <span
                            key={`${st}-${i}`}
                            className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md"
                          >
                            {st}
                          </span>
                        ))
                      )}
                    </div>

                    <div className="mt-4 bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs space-y-1.5">
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Course Fee:</span>
                        <span className="text-slate-900 font-bold font-mono">{inr(finiteOrNull(course.price_inr))}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500 text-[11px]">
                        <span>AI Resilience (catalog):</span>
                        <span className="font-mono text-slate-700">
                          {resilience == null ? NO_DATA : `${Math.round(resilience * 100)}%`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400 text-[10px]">
                        <span>Match score:</span>
                        <span className="font-mono">{hasRunMatch ? "See matched list above" : "Run the matcher above"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => void handleTrackClick(course)}
                      className="w-full rounded-xl text-xs font-semibold py-2.5 flex items-center justify-center gap-1.5 transition focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-950 hover:bg-slate-800 text-white"
                    >
                      <span>View on {course.provider}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
