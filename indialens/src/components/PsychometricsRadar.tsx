"use client";

import React, { useState } from "react";
import { Smile } from "lucide-react";

interface PsychometricsRadarProps {
  initialReviews?: string[];
}

/**
 * The four sub-scores of the student-experience psychometrics, drawn as
 * meters rather than as a radar.
 *
 * Two things are worth stating plainly about this component, because they
 * govern what the restyle was allowed to change:
 *
 * 1. **The scores are seeded, not fetched.** `useState` below carries the same
 *    literals the component has always had: α 0.82, validity "High", and
 *    78/74/80/76. There is no request in this file and there never was, so the
 *    header reads "Sample figures" rather than implying a validated
 *    measurement is arriving. Restyling is not a licence to wire up a new
 *    source, and it is not a licence to quietly present a seeded number as
 *    though the engine had produced it — which is the specific failure the
 *    other honesty passes in this repo were written to fix. If a real source is
 *    ever wired in, the badge and the caveat below are the two things that
 *    should change.
 *
 * 2. **The α is a coefficient, not a score.** It is rendered through `.metric`
 *    with an explicit format rather than as a bare `0.82`, and the validity
 *    label is a separate badge rather than being coloured into the number.
 *
 * The `initialReviews` prop is unused by the rendered output and was unused
 * before; it is kept so the exported signature is unchanged.
 */

/** A sub-score, and the token role its meter is drawn in. */
const SUB_SCORES: Array<{
  key: "campus_life" | "work_life_balance" | "faculty_mentorship" | "infrastructure";
  label: string;
  /** CSS custom property, so the meter themes with the panel around it. */
  color: string;
}> = [
  { key: "faculty_mentorship", label: "Faculty & Mentorship", color: "var(--green)" },
  { key: "work_life_balance", label: "Work-Life Balance", color: "var(--blue)" },
  { key: "campus_life", label: "Campus Life & Peer Network", color: "var(--amber)" },
  { key: "infrastructure", label: "Hostel & Infrastructure", color: "var(--teal)" },
];

export default function PsychometricsRadar({
  initialReviews = [
    "Faculty is approachable and supportive during project work.",
    "Decent hostel infrastructure and active placement cell.",
    "Work-life balance is good during regular semesters.",
  ],
}: PsychometricsRadarProps) {
  const [data, setData] = useState<any>({
    cronbach_alpha: 0.82,
    psychometric_validity: "High",
    sub_scores: {
      campus_life: 78.0,
      work_life_balance: 74.0,
      faculty_mentorship: 80.0,
      infrastructure: 76.0,
    },
  });
  void initialReviews;
  void setData;

  const subScores = (data?.sub_scores ?? {}) as Record<string, number | null>;

  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title flex items-center gap-2">
          <Smile size={12} aria-hidden="true" />
          Student experience psychometrics
        </span>
        {/* The honest label. These four scores and the α are seeded constants in
            this file, so the panel says so rather than implying a validated
            instrument has been run. */}
        <span className="badge badge-amber">Sample figures</span>
      </div>

      <div className="panel-pad space-y-4">
        <dl className="grid grid-cols-2 gap-3">
          <div className="metric-cell">
            <dt className="metric-label">Cronbach&apos;s α</dt>
            <dd>
              {data?.cronbach_alpha != null ? (
                <span className="metric num">{Number(data.cronbach_alpha).toFixed(2)}</span>
              ) : (
                <span className="metric num-na">&mdash;</span>
              )}
            </dd>
          </div>
          <div className="metric-cell">
            <dt className="metric-label">Validity</dt>
            <dd>
              {data?.psychometric_validity ? (
                <span className="badge badge-green mt-0.5">
                  {data.psychometric_validity}
                </span>
              ) : (
                <span className="num text-[13px] num-na">&mdash;</span>
              )}
            </dd>
          </div>
        </dl>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SUB_SCORES.map((sub) => {
            const raw = subScores[sub.key];
            const value =
              typeof raw === "number" && Number.isFinite(raw) ? raw : null;
            return (
              <div key={sub.key} className="min-w-0">
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="metric-label">{sub.label}</span>
                  {value == null ? (
                    <span className="num text-[12px] num-na">&mdash;</span>
                  ) : (
                    <span
                      className="num text-[12px] font-bold"
                      style={{ color: sub.color }}
                    >
                      {value.toFixed(0)}%
                    </span>
                  )}
                </div>
                {/* `.ci-track` / `.ci-fill` rather than a hand-rolled track. A
                    score with no value renders an empty track and a dash: an
                    empty bar is the "not measured" geometry, and a zero-width
                    fill would read as a 0% score. */}
                <div className="ci-track">
                  {value != null && (
                    <div
                      className="ci-fill"
                      style={{
                        width: `${Math.max(0, Math.min(100, value))}%`,
                        background: sub.color,
                        opacity: 0.85,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] leading-relaxed t-faint">
          α is internal consistency, not accuracy: it says the four sub-scores
          move together, not that they are right. The figures above are
          constants held in this component &mdash; they are not read from a
          measured review corpus, so treat the shape of the profile as a layout
          demonstration and not as a finding about this institution.
        </p>
      </div>
    </section>
  );
}
