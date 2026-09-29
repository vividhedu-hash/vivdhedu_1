"use client";

import { ExternalLink } from "lucide-react";
import type { GroundedPayload } from "../lib/grounded";

/**
 * A grounded answer and its citations.
 *
 * Two properties are load-bearing, and both were previously obscured by
 * hardcoded colours rather than by logic:
 *
 * 1. **The grounding state is stated, not implied.** A payload with no
 *    citations is labelled "Not grounded" in amber and rendered *without* a
 *    source list. That is the honest treatment: a paragraph of answer text
 *    presented at the same weight as a cited one is how an unverified claim
 *    comes to look sourced. `grounded` is read from the payload, which both
 *    upstreams set explicitly.
 *
 * 2. **The sources are the point.** The list is a numbered ol, not a set of
 *    links, so the ordering in the answer is legible, and each entry opens in
 *    a new tab with rel="noopener noreferrer" — an external link must not be
 *    able to reach back through window.opener.
 */
export function GroundedAnswer({ payload }: { payload: GroundedPayload }) {
  const text = payload.text || payload.advice_markdown || "";
  const citations = payload.citations ?? [];
  const queries = payload.search_queries ?? [];
  const isGrounded = Boolean(payload.grounded) && citations.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className={"badge " + (isGrounded ? "badge-teal" : "badge-amber")}>
          {isGrounded ? "Web-grounded" : "Not grounded"}
        </span>
        {payload.engine && <span className="num text-[11px] t-faint">{payload.engine}</span>}
        {citations.length > 0 && (
          <span className="num text-[11px] t-faint">
            {citations.length} source{citations.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="whitespace-pre-wrap text-[14px] leading-relaxed t-text">{text}</div>

      {citations.length > 0 && (
        <div className="pt-1">
          <p className="metric-label mb-2">Sources</p>
          <ol className="space-y-1.5">
            {citations.map((c, i) => (
              <li key={c.url + "-" + i} className="flex gap-2 text-[12px] t-muted">
                <span className="num shrink-0 t-faint">{i + 1}.</span>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="t-accent inline-flex items-center gap-1 break-all hover:opacity-80"
                >
                  {c.title || c.url}
                  <ExternalLink size={11} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}

      {queries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {queries.map((q) => (
            <span
              key={q}
              className="t-chip t-border rounded-md border px-2 py-1 text-[11px] t-faint"
            >
              {q}
            </span>
          ))}
        </div>
      )}

      {payload.search_suggestions_html ? (
        <iframe
          title="Search suggestions"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          srcDoc={payload.search_suggestions_html}
          className="t-bg t-border min-h-[72px] w-full rounded-lg border"
        />
      ) : null}
    </div>
  );
}
