"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ShoppingBag,
  ExternalLink,
  Filter,
  RefreshCw,
  CheckCircle2,
  Lock,
  Search,
  Info,
  BookX,
  FilterX,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { NO_DATA, finiteOrNull } from "@/lib/mock-data";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { Notice } from "@/components/Notice";
import { Skeleton, SkeletonStatus, SkeletonCards } from "@/components/Skeleton";

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
    <div className="page-shell">
      <div className="container-xl page-header">
        <PageHeader
          kicker="Actuarial upskilling hub · Section 03"
          eyebrow={
            <span className="badge badge-rose">
              <ShoppingBag size={10} aria-hidden="true" />
              Formula 3.1 skill-gap matching
            </span>
          }
          title="Curated Course Marketplace & Skill Gap Hedge"
          lead="The catalogue is the server's own course_marketplace table. Enter your current skills and a target role to have the matching engine score it against your actual gaps, and to see exactly which skills each course would add."
        />
      </div>

      <div className="container-xl pb-16">
        {/* Skill-gap matcher */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title flex items-center gap-2">
              <Search size={12} aria-hidden="true" />
              Formula 3.1 skill-gap matcher
            </span>
            {hasRunMatch && (
              <button
                type="button"
                onClick={() => {
                  setHasRunMatch(false);
                  setMatches(null);
                  setMatchError(null);
                }}
                className="btn-ghost"
              >
                Clear results
              </button>
            )}
          </div>

          <div className="panel-pad">
            <h2 className="text-[15px] font-semibold t-text">
              What should we match you against?
            </h2>
            <p className="body-p mt-1.5">
              M = 0.35·SkillGap + 0.25·CareerAlign + 0.25·AI-Resilience + 0.15·BudgetFit. Only
              courses at or above M ≥ <span className="num">{MATCH_THRESHOLD}</span> are returned.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="md:col-span-2">
                <label htmlFor="skills" className="form-label">
                  Skills you already have
                </label>
                <input
                  id="skills"
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="Comma separated — e.g. Python, Data Analysis, Calculus"
                  className="form-input text-[13px]"
                />
              </div>
              <div>
                <label htmlFor="role" className="form-label">
                  Target role
                </label>
                <input
                  id="role"
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="form-input text-[13px]"
                />
              </div>
              <div>
                <label htmlFor="budget" className="form-label">
                  Monthly budget (₹)
                </label>
                <input
                  id="budget"
                  type="number"
                  min={0}
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                  className="form-input text-[13px]"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void runMatch()}
                disabled={isMatching}
                className="btn-primary"
              >
                {isMatching ? (
                  <span className="spinner" aria-hidden="true" />
                ) : (
                  <Search size={14} aria-hidden="true" />
                )}
                <span>{isMatching ? "Matching…" : "Match courses to my gaps"}</span>
              </button>
            </div>

            {isMatching && (
              <div className="mt-5 space-y-2.5" role="status" aria-live="polite">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <span className="sr-only">Scoring the catalog against your profile…</span>
              </div>
            )}

            {matchUsedDefaultSkills && hasRunMatch && (
              <Notice tone="warn" className="mt-4" title="Scored against a default profile">
                You left the skills field empty, so the engine scored against its own default
                assumption (Python, Data Analysis, Calculus). These scores describe that assumed
                profile, not you.
              </Notice>
            )}

            {matchError && (
              <div role="alert" className="mt-4">
                <Notice tone="error" title="No match scores">
                  {matchError} No match scores are shown in its place.
                </Notice>
              </div>
            )}

            {hasRunMatch && !matchError && matches && matches.length > 0 && (
              <div className="mt-6">
                <ul className="space-y-3">
                  {matches.map((m, i) => (
                    <li key={`${m.course_title}-${i}`}>
                      <div className="panel">
                        <div className="panel-pad-sm">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="epistemic-tag tag-ui">
                                  <CheckCircle2 size={9} aria-hidden="true" />
                                  M=<span className="num">{Math.round(m.match_score * 100)}</span>%
                                </span>
                                <span className="num text-[11px] t-faint">
                                  {m.provider} · {m.category}
                                </span>
                              </div>
                              <h3 className="mt-1.5 text-[14px] font-bold t-text">
                                {m.course_title}
                              </h3>
                              <p className="mt-1 text-[11px] t-muted">
                                <span className="metric-label mr-1.5 inline">
                                  Skills this adds that you lack
                                </span>
                                {m.skill_gap_addressed.length > 0
                                  ? m.skill_gap_addressed.join(", ")
                                  : NO_DATA}
                              </p>
                              <p className="mt-1.5 text-[10px] leading-relaxed t-faint">
                                AI-resilience{" "}
                                <span className="num">{Math.round(m.ai_resilience_score * 100)}</span>
                                % is a stored catalog attribute for this course, not a measured
                                outcome. The engine&apos;s{" "}
                                <code className="mono">projected_salary_uplift_inr</code> is a flat
                                fee × 18.5 multiple (
                                <span className="num">{inr(m.projected_salary_uplift_inr)}</span>)
                                — it is a cost multiple, not a predicted salary, and is not shown
                                as one.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                void handleTrackClick({
                                  id: m.course_id ?? null,
                                  course_title: m.course_title,
                                  affiliate_url: m.affiliate_url,
                                  match_score: m.match_score,
                                })
                              }
                              className="btn-primary shrink-0"
                            >
                              <span>Enroll on {m.provider}</span>
                              <ExternalLink size={13} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <Notice tone="info" className="mt-4" icon={Info}>
                  The skill-gap term measures the share of a course&apos;s skills you do not
                  already have, so a shorter skill list raises it. A high M on this component
                  means &ldquo;this course adds a lot for you&rdquo;, not &ldquo;you are well
                  prepared&rdquo;.
                </Notice>
              </div>
            )}

            {hasRunMatch && !matchError && matches && matches.length === 0 && (
              <div className="mt-5">
                <Notice tone="info" title={`No course reached M ≥ ${matchThreshold}`}>
                  That is a real result, not a missing one. Raising your budget or targeting a
                  role the catalogue lists will change it.
                </Notice>
              </div>
            )}
          </div>
        </div>

        {/* Category filters */}
        <div className="panel mt-6">
          <div className="panel-head">
            <span className="panel-title flex items-center gap-2">
              <Filter size={12} aria-hidden="true" />
              Category
            </span>
            {!isLoading && (
              <span className="num text-[11px] t-faint">
                {visibleCourses.length} course{visibleCourses.length === 1 ? "" : "s"}
                {catalogSource ? ` · ${catalogSource.replace(/_/g, " ")}` : ""}
              </span>
            )}
          </div>
          <div className="panel-pad-sm">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={selectedCategory === cat}
                  onClick={() => setSelectedCategory(cat)}
                  disabled={isLoading}
                  className={`domain-chip ${selectedCategory === cat ? "selected" : ""}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Catalog states: loading → error → empty → data */}
        {isLoading ? (
          <div className="mt-6">
            <SkeletonCards count={6} />
            <SkeletonStatus label="Loading course catalog" />
          </div>
        ) : loadError ? (
          <div className="panel mt-6">
            <div className="panel-head">
              <span className="panel-title">Catalog unavailable</span>
            </div>
            <div className="panel-pad">
              <Notice tone="error" title="The catalog could not be loaded">
                {loadError} Courses are not substituted from a local list — a list that did not
                come from the catalog would look reviewed when it was not.
              </Notice>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="btn-secondary mt-4"
              >
                <RefreshCw size={13} aria-hidden="true" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        ) : visibleCourses.length === 0 ? (
          /* "The catalogue is empty" and "your filter excluded everything" are
             different states with different remedies, so the copy branches and
             so does the action offered. */
          <div className="mt-6">
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
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visibleCourses.map((course, idx) => {
              const resilience = finiteOrNull(course.ai_resilience_score);
              return (
                <div
                  key={course.id ?? `${course.course_title}-${idx}`}
                  className="panel flex flex-col"
                >
                  <div className="panel-pad flex-1">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="badge badge-blue">{course.provider}</span>
                      {/* The catalog table carries no match score — it is only
                          computed per student by /recommended. Showing a number
                          here would mean inventing one. */}
                      <span
                        className="epistemic-tag tag-gap"
                        title="Not yet scored against your profile"
                      >
                        <Lock size={9} aria-hidden="true" />
                        Not scored
                      </span>
                    </div>

                    <h3 className="text-[15px] font-bold leading-snug t-text">
                      {course.course_title}
                    </h3>
                    <p className="num mt-1 text-[12px] t-muted">
                      {course.category} ·{" "}
                      {finiteOrNull(course.duration_hours) == null ? (
                        <span className="num-na">{NO_DATA}</span>
                      ) : (
                        <>{course.duration_hours} hours</>
                      )}
                    </p>

                    {course.career_paths && course.career_paths.length > 0 && (
                      <p className="mt-1.5 text-[11px] t-muted">
                        <span className="metric-label mr-1.5 inline">Roles</span>
                        {course.career_paths.join(", ")}
                      </p>
                    )}

                    {/* Skill tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(course.skill_tags ?? []).length === 0 ? (
                        <span className="num-na text-[11px]">No skill tags recorded</span>
                      ) : (
                        (course.skill_tags ?? []).map((st, i) => (
                          <span
                            key={`${st}-${i}`}
                            className="t-chip rounded border px-2 py-0.5 text-[10px] t-muted"
                            style={{ borderColor: "var(--border-subtle)" }}
                          >
                            {st}
                          </span>
                        ))
                      )}
                    </div>

                    <dl
                      className="t-chip mt-4 space-y-1.5 rounded-lg border p-3.5"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      <div className="metric-cell-row">
                        <dt className="metric-label">Course fee</dt>
                        <dd className="num text-[13px] font-bold t-text">
                          {inr(finiteOrNull(course.price_inr))}
                        </dd>
                      </div>
                      <div className="metric-cell-row">
                        <dt className="metric-label">AI resilience · catalog</dt>
                        <dd className="num text-[12px] t-muted">
                          {resilience == null ? (
                            <span className="num-na">{NO_DATA}</span>
                          ) : (
                            <>{Math.round(resilience * 100)}%</>
                          )}
                        </dd>
                      </div>
                      <div className="metric-cell-row">
                        <dt className="metric-label">Match score</dt>
                        <dd className="num text-[11px] t-faint">
                          {hasRunMatch ? "See matched list above" : "Run the matcher above"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div
                    className="border-t px-[22px] py-3"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <button
                      type="button"
                      onClick={() => void handleTrackClick(course)}
                      className="btn-primary w-full"
                    >
                      <span>View on {course.provider}</span>
                      <ExternalLink size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10">
          <SectionHeader
            kicker="Provenance"
            title="Nothing on this page is scored in the browser"
            lead="Match scores, AI-resilience attributes and fee multiples all come off the wire. A figure the catalogue does not carry is drawn as a dash, and the match score is deliberately withheld until the matcher has run."
          />
        </div>
      </div>
    </div>
  );
}
