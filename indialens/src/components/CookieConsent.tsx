"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  OPEN_COOKIE_SETTINGS_EVENT,
  type ConsentChoice,
} from "@/lib/session-policy";
import { readConsent, writeConsent } from "@/lib/consent";

/**
 * Cookie consent.
 *
 * Accessibility decisions, and the reason for each:
 *
 *   - `role="dialog"` + `aria-modal` + `aria-labelledby`/`aria-describedby`, so
 *     a screen reader announces it as a dialog with a name rather than as
 *     loose text at the end of the document.
 *   - Moving focus into the dialog on open, and returning it to the previously
 *     focused element on close. A banner that appears without moving focus is
 *     invisible to a keyboard user; `AutofocusPolicy` on the first button
 *     means a keyboard user lands on "Necessary only", not on "Accept all".
 *   - `role="switch"` with `aria-checked` on each toggle, so the state is
 *     announced. A bare checkbox inside a label reads as "Marketing" with no
 *     indication of whether it is on.
 *   - Escape closes, as long as a decision has already been recorded. Before a
 *     first decision, Escape is suppressed: dismissing the banner by accident
 *     must not silently become a choice.
 *   - Every control is a real button or a switch, so it is in the tab order.
 *   - It is a bottom sheet, not a full-screen overlay, and it does not scroll-
 *     lock the page. The content behind it stays readable and reachable.
 */

type Categories = { functional: boolean; analytics: boolean };

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [manage, setManage] = useState(false);
  const [functional, setFunctional] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const applyExisting = useCallback((choice: ConsentChoice) => {
    setFunctional(choice.functional);
    setAnalytics(choice.analytics);
  }, []);

  useEffect(() => {
    const existing = readConsent();
    if (!existing) setVisible(true);
    else applyExisting(existing);

    const open = () => {
      const current = readConsent();
      if (current) applyExisting(current);
      setManage(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
  }, [applyExisting]);

  // Take focus when the banner appears, and hand it back when it goes away, so
  // a keyboard user is not left with focus on <body> after dismissing it.
  useEffect(() => {
    if (!visible) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const first = panelRef.current?.querySelector<HTMLElement>("[data-autofocus]");
    first?.focus();
    return () => returnFocusRef.current?.focus?.();
  }, [visible]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") return;
    // Suppressed before a first decision: an accidental Escape must not be
    // recorded as "necessary only".
    if (!readConsent()) return;
    setVisible(false);
    setManage(false);
  };

  if (!visible) return null;

  const save = (next: Categories) => {
    writeConsent(next);
    setFunctional(next.functional);
    setAnalytics(next.analytics);
    setVisible(false);
    setManage(false);
  };

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center px-3 pb-3 sm:px-4 sm:pb-4"
      onKeyDown={onKeyDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-body"
        className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-[var(--text-primary)] shadow-[var(--shadow-lg)] sm:p-5"
      >
        <h2
          id="cookie-consent-title"
          className="text-sm font-semibold tracking-tight"
        >
          Cookies and session storage
        </h2>
        <div id="cookie-consent-body" className="mt-1.5 space-y-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
          <p>
            Sign-in and the report you opened use storage that stays on. Anything
            else is off until you allow it. We run no advertising cookies and no
            cross-site profile.
          </p>
          <p>
            The full list of what is actually stored, and who can read it, is on
            the{" "}
            <Link
              href="/cookies"
              className="font-semibold text-[var(--accent)] underline underline-offset-2"
            >
              cookie page
            </Link>
            .
          </p>
        </div>

        {manage && (
          <div className="mt-4 space-y-1">
            <Toggle
              id="cc-necessary"
              label="Strictly necessary"
              hint="Sign-in, the page you were on, your report handle, and this choice. Always on — it is not a tracker."
              checked
              disabled
            />
            <Toggle
              id="cc-functional"
              label="Functional"
              hint="Remembers whether you chose the light or dark theme on this browser."
              checked={functional}
              onChange={setFunctional}
            />
            <Toggle
              id="cc-analytics"
              label="Analytics"
              hint="PostHog page views, and the two events the waitlist and contact forms send. No ads, no profiling across sites."
              checked={analytics}
              onChange={setAnalytics}
            />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {manage ? (
            <button
              type="button"
              onClick={() => save({ functional, analytics })}
              className="rounded-full bg-[var(--text-primary)] px-4 py-2 text-sm font-semibold text-[var(--bg)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-elevated)]"
            >
              Save choices
            </button>
          ) : (
            <button
              type="button"
              data-autofocus
              onClick={() => save({ functional: false, analytics: false })}
              className="rounded-full border border-[var(--border-focus)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-elevated)]"
            >
              Necessary only
            </button>
          )}

          <button
            type="button"
            onClick={() => save({ functional: true, analytics: true })}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-elevated)]"
          >
            Accept all
          </button>

          {manage ? (
            <button
              type="button"
              onClick={() => { setVisible(false); setManage(false); }}
              className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setManage(true)}
              className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              Choose categories
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({
  id,
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg px-2 py-2">
      <span className="min-w-0">
        <span className="block text-[13px] font-medium">{label}</span>
        <span className="mt-0.5 block text-[12px] leading-relaxed text-[var(--text-tertiary)]">
          {hint}
        </span>
      </span>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={[
          "relative mt-0.5 h-6 w-11 flex-shrink-0 rounded-full border transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-elevated)]",
          checked ? "bg-[var(--accent)] border-[var(--accent)]" : "bg-[var(--bg-chip)] border-[var(--border-focus)]",
          disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition-all",
            checked ? "left-[22px]" : "left-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );
}
