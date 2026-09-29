"use client";

import React, { useEffect, useState } from "react";
import { Check, Loader2, HelpCircle, Cpu } from "lucide-react";
import { Notice } from "./Notice";

export interface SynthesisLoaderProps {
  /**
   * The student's own name. Accepted for call-site clarity but deliberately
   * NOT rendered: this screen previously took the prop and ignored it, showing
   * an anonymous "Building your starting point..." instead. The name now
   * appears on the report screen that follows, where it is actually persisted.
   */
  studentName?: string;
  onComplete: (token: string) => void;
  apiUrl?: string;
  profileData: Record<string, any>;
}

/**
 * The four synthesis steps, as data.
 *
 * The step list was four hand-written blocks, each with its own ternary chain
 * for the icon, the label colour, and the badge colour — twelve conditionals
 * for what is really one piece of state (`currentStep >= n`). Rendering them
 * from a list makes "is step 3 active" a single comparison per step, and means a
 * copy fix is a one-line change instead of four.
 */
const STEPS = [
  { n: 1, label: "Understanding you", done: "Your answers", pending: "Queued" },
  { n: 2, label: "Mapping your goals", done: "Calibrated", pending: "Queued" },
  { n: 3, label: "Finding your options", done: "Synthesized", pending: "Synthesizing" },
  { n: 4, label: "Building your roadmap", done: "Finalized", pending: "Queued" },
];

export const SynthesisLoader: React.FC<SynthesisLoaderProps> = ({
  studentName,
  onComplete,
  profileData,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [apiError, setApiError] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    let active = true;

    // Step progression (1 -> 2 -> 3 -> 4)
    const t1 = setTimeout(() => active && setCurrentStep(2), 700);
    const t2 = setTimeout(() => active && setCurrentStep(3), 1400);
    const t3 = setTimeout(() => active && setCurrentStep(4), 2200);

    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 1));
    }, 800);

    // Call /api/analyze
    const makeApiCall = async () => {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileData),
          signal: AbortSignal.timeout(10_000),
        });
        if (res.ok) {
          const data = await res.json();
          if (active && data?.token) {
            setApiToken(data.token);
            return;
          }
        }
        throw new Error("Local analyze fallback");
      } catch (err) {
        // A real failure. The previous fallback minted `demo-${Date.now()}`,
        // which is not a report — no such row exists, so the "report ready"
        // screen that follows was opening a token guaranteed to 404. It also
        // looked like a success, because it produced a token-shaped string.
        // So a failure now stays a failure and is reported as one.
        if (active) setApiError(true);
      }
    };
    makeApiCall();

    return () => {
      active = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(interval);
    };
  }, [profileData]);

  // When steps are done and a real token exists, wait briefly and complete.
  // `apiError` is checked because without a token this never fires, which is
  // the point: the caller must not be handed a token that resolves to nothing.
  useEffect(() => {
    if (currentStep === 4 && apiToken && !apiError) {
      const finishTimer = setTimeout(() => {
        onComplete(apiToken);
      }, 1000);
      return () => clearTimeout(finishTimer);
    }
  }, [currentStep, apiToken, apiError, onComplete]);

  return (
    <div className="t-bg t-text flex min-h-screen flex-col font-sans">
      {/* Top bar */}
      <header
        className="t-surface flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3"
        style={{ borderColor: "var(--divider)" }}
      >
        <div className="flex items-center gap-2">
          <span className="pulse-dot-rose" aria-hidden="true" />
          <span className="mono text-[11px] font-semibold t-muted">
            Building your profile
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="badge badge-rose">Engine v4.2 active</span>
          <span className="hidden items-center gap-1.5 text-[11px] t-faint sm:flex">
            <HelpCircle size={12} aria-hidden="true" />
            <span>Support</span>
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        {/* Progress geometry. The three concentric rings are a static target,
            not a spinner — they do not loop, so they say "this is a fixed
            process with a fixed end" rather than "an indeterminate wait". The
            single `animate-ping` dot is the one permitted indefinite motion:
            it is the live status dot. */}
        <div className="relative mb-6 flex h-16 w-16 items-center justify-center" aria-hidden="true">
          <div
            className="absolute inset-0 rounded-full border"
            style={{ borderColor: "color-mix(in srgb, var(--accent) 28%, transparent)" }}
          />
          <div
            className="absolute inset-2.5 rounded-full border"
            style={{ borderColor: "color-mix(in srgb, var(--accent) 45%, transparent)" }}
          />
          <div className="relative h-3 w-3">
            <span
              className="absolute inset-0 animate-ping rounded-full opacity-70"
              style={{ background: "var(--accent)" }}
            />
            <span
              className="relative block h-3 w-3 rounded-full"
              style={{ background: "var(--accent)" }}
            />
          </div>
        </div>

        <p className="kicker-web mb-3 justify-center">Synthesis</p>
        <h1 className="page-title-sm text-balance">
          Building your starting point
        </h1>
        <p className="section-lead mt-3 text-center">
          Combining the answers you gave with the programme data we hold into a
          deterministic roadmap.
        </p>

        {/* Step list */}
        <div className="panel mt-8 w-full text-left">
          <div className="panel-head">
            <span className="panel-title flex items-center gap-2">
              <Cpu size={12} aria-hidden="true" />
              Analysis steps
            </span>
            <span className="num text-[10px] t-faint" aria-live="polite">
              Step {currentStep} of 4
            </span>
          </div>

          <ol className="panel-pad space-y-3.5">
            {STEPS.map((step) => {
              const reached = currentStep >= step.n;
              // Step 3 is the one in flight until step 4 lands, so it gets the
              // spinner while running and the check once complete.
              const inFlight = step.n === 3 && currentStep === 3;
              return (
                <li
                  key={step.n}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={`num flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
                        reached
                          ? "border-line/10 bg-accent-dim text-accent"
                          : "border-line/10 bg-chip text-ink-3"
                      }`}
                    >
                      {inFlight ? (
                        <Loader2 size={11} className="animate-spin text-accent" aria-hidden="true" />
                      ) : reached ? (
                        <Check size={11} aria-hidden="true" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      )}
                    </span>
                    <span
                      className={`num text-[12px] ${reached ? "font-semibold t-text" : "t-faint"}`}
                    >
                      {step.n}. {step.label}
                    </span>
                  </span>

                  <span
                    className={`epistemic-tag flex-shrink-0 ${
                      reached ? "tag-match" : "tag-ui"
                    }`}
                  >
                    {reached ? step.done : step.pending}
                  </span>
                </li>
              );
            })}
          </ol>

          {/* Subcard.
              This said "Processed 4,200 program outcomes across 18 cohorts"
              beside a hardcoded 98.4%. Neither number came from anywhere: the
              database holds 73 programmes, and nothing was processed, counted
              or scored here. A percentage presented next to a volume reads as
              a measured pass rate, so a student would conclude their report was
              built from 4,200 outcomes. It now states which inputs were used. */}
          <div
            className="flex items-center justify-between gap-3 border-t px-4 py-3"
            style={{ borderColor: "var(--divider)" }}
          >
            <span className="flex min-w-0 items-center gap-1.5 text-[11px] t-muted">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                style={{
                  background: apiError ? "var(--red)" : "var(--text-tertiary)",
                }}
              />
              <span className="truncate">
                {apiError
                  ? "Could not reach the analysis service"
                  : "Matching your answers against the programme data we hold"}
              </span>
            </span>
            <span className={`num flex-shrink-0 text-[11px] font-semibold ${apiError ? "num-na" : "t-text"}`}>
              {apiError ? "—" : "1 request"}
            </span>
          </div>
        </div>

        {/* An honest failure state. There is no report to open without a token,
            so continuing into a "report ready" screen would be a lie. */}
        {apiError && (
          <Notice tone="error" className="mt-4 w-full max-w-md text-left">
            We could not build your report just now. Your answers have not been
            lost. Go back and try again, and if it keeps happening the service
            is genuinely down rather than silently producing an empty report.
          </Notice>
        )}

        {/* Countdown. Suppressed once the request has already failed — counting
            down to something that will not arrive is a promise this screen
            cannot keep. */}
        {!apiError && (
          <p className="mono mt-5 flex items-center gap-1.5 text-[11px] t-faint">
            <span>Finishing in {countdown}s</span>
          </p>
        )}
        <span className="sr-only" role="status" aria-live="polite">
          {apiError
            ? "Report generation failed."
            : `Building your profile. Step ${currentStep} of 4.`}
        </span>
      </main>

      {/* Bottom telemetry bar.
          This claimed "Deterministic Synthesis Protocol · Zero Synthetic
          Hallucination Threshold" and "Session ID: OS-90214-EXEC · Secure
          Enclave 256-bit". The session id was a literal — identical for every
          student, every run, forever — presented as a unique audit handle in a
          "secure enclave" that does not exist. A "Zero Synthetic Hallucination
          Threshold" is not a quantity, and this very screen sits in a codebase
          full of synthetic values. Both are replaced with the request's real
          correlation id, shown only once the server has issued one. */}
      <footer
        className="t-surface mono flex flex-wrap items-center justify-between gap-3 border-t px-5 py-2.5 text-[10px] t-faint"
        style={{ borderColor: "var(--divider)" }}
      >
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: apiError ? "var(--red)" : "var(--accent)" }}
          />
          <span>Analysis request sent to /api/analyze</span>
        </span>
        <span className="num">
          {apiToken ? `Report ${apiToken.slice(0, 8)}…` : "No report id yet"}
        </span>
      </footer>
    </div>
  );
};
