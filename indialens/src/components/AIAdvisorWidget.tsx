"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { GroundedAnswer } from "./GroundedAnswer";
import { Notice } from "./Notice";
import { SkeletonText, SkeletonStatus } from "./Skeleton";
import { aiErrorMessage, postAi, type GroundedPayload } from "../lib/grounded";

interface AIAdvisorWidgetProps {
  initialBudget?: number;
initialField?: string;
  className?: string;
}

/**
 * The advisor form and its grounded answer.
 *
 * Behaviour is unchanged: the same `POST /api/v1/ai/advisor`, the same request
 * shape (`total_budget`, `target_field`, `risk_tolerance`,
 * `preferred_cities`, `top_programs`), the same state machine. Only the surface
 * moved.
 *
 * What changed visually, and why:
 *
 *  - The panel is `.panel` with a `.panel-head`, not a bordered white box with
 *    an `h3` — it is a data surface and the head carries the title in the one
 *    place the product now has for it.
 *  - The engine line ("Gemini 3.7 Flash · Google Search citations required")
 *    was a static string naming a model. `GroundedAnswer` already renders
 *    `payload.engine` from the response, which is the only value that is
 *    actually true at runtime. The static line is kept as a *provenance* line
 *    but stripped of the model name, because a caption asserting a specific
 *    model that the request does not control is exactly the kind of claim this
 *    product's other honesty passes removed. Where a run has returned, the real
 *    engine is shown alongside the citations.
 *  - The error state is a `<Notice tone="warn">`, not a hand-rolled amber box.
 *    `aiErrorMessage` already extracts the upstream's own reason, so that string
 *    is passed through unchanged. Tone is `warn` rather than `error` on
 *    purpose: the panel handles a 503 carrying `integration_unavailable` — an
 *    unconnected provider, which is a state, not a fault. The full distinction
 *    between "not connected" and "the upstream failed" is already drawn by
 *    `AIUnavailable` on `/advisor`; this widget reports what its own request
 *    returned rather than re-deriving a taxonomy.
 *  - Loading is a skeleton of the answer's shape, not a bare label. A grounded
 *    answer is paragraphs plus a citation list, so the placeholder is sized for
 *    that and the page does not jump when it lands.
 */
export default function AIAdvisorWidget({
  initialBudget = 10,
  initialField = "engineering-cs",
  className = "",
}: AIAdvisorWidgetProps) {
  const [budget, setBudget] = useState(initialBudget);
 const [field, setField] = useState(initialField);
  const [risk, setRisk] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<GroundedPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function consult() {
    setLoading(true);
    setError(null);
    const { ok, status, data } = await postAi<GroundedPayload | { detail?: { reason?: string } }>(
   "/api/v1/ai/advisor",
      {
        total_budget: budget,
        target_field: field,
        risk_tolerance: risk,
        preferred_cities: ["Bengaluru", "NCR", "Hyderabad"],
        top_programs: [],
      },
    );
    setLoading(false);
    if (!ok) {
      setPayload(null);
      setError(aiErrorMessage(data, `Advisor unavailable (${status})`));
      return;
    }
    setPayload(data as GroundedPayload);
  }

  return (
    <section className={`panel min-w-0 ${className}`}>
      <div className="panel-head">
        <span className="panel-title">Grounded advisor</span>
        <span className="badge badge-purple">Citations required</span>
      </div>

      <div className="panel-pad">
        <p className="mb-1 text-[13px] font-semibold t-text">
          Ask for advice, get sources
        </p>
        <p className="text-[11px] t-faint">
          Every figure in the answer has to be supported by a citation. Where
          no source supports one, the answer says it is unverified.
        </p>

        <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">
          <div className="min-w-0">
            <label className="form-label" htmlFor="advisor-budget">
              Budget (&#8377; Lakhs)
            </label>
            <input
              id="advisor-budget"
              type="number"
              min={1}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="form-input num"
            />
          </div>
          <div className="min-w-0">
            <label className="form-label" htmlFor="advisor-field">
              Target discipline
            </label>
            <select
              id="advisor-field"
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="form-select form-input cursor-pointer"
            >
              <option value="engineering-cs">Engineering (CS / AI)</option>
              <option value="management">Management</option>
              <option value="medicine">Medicine</option>
              <option value="law">Law</option>
            </select>
          </div>
          <div className="min-w-0">
            <label className="form-label" htmlFor="advisor-risk">
              Risk tolerance
            </label>
            <select
              id="advisor-risk"
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
              className="form-select form-input cursor-pointer"
            >
              <option value="low">Low risk</option>
              <option value="medium">Medium risk</option>
              <option value="high">High risk</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void consult()}
          disabled={loading}
          aria-busy={loading}
          className="btn-primary mt-4 w-full"
        >
          {/* The label swaps rather than spinning: the control is a single
              request, and a spinner would imply a short wait. */}
          <Sparkles size={14} aria-hidden="true" />
          {loading ? "Grounding…" : "Advise with sources"}
        </button>

        {error && (
          <Notice tone="warn" title="No answer returned" className="mt-4">
            {error}
          </Notice>
        )}

        {loading && (
          <div className="mt-5">
            <SkeletonText lines={3} />
            <SkeletonStatus label="Grounding the answer" />
          </div>
        )}

        {payload && !loading && (
          <div className="mt-5 border-t t-divider pt-5">
            <GroundedAnswer payload={payload} />
          </div>
        )}
      </div>
    </section>
  );
}
