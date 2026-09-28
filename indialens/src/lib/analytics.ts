"use client";

import { analyticsAllowed } from "./consent";

/**
 * The only door to PostHog.
 *
 * Why this exists instead of a check at each call site: there are exactly two
 * `posthog.capture(...)` calls in the product today (WaitlistForm, ContactForm)
 * and a third would be added by someone who has never read the banner. A
 * check that lives in one place is auditable; a check that has to be remembered
 * is not.
 *
 * Three independent things have to fail before an event leaves the browser:
 *
 *   1. `analyticsAllowed()` — the person's recorded choice.
 *   2. A registered sink — which only `PostHogProvider` installs, and only
 *      after it has called `posthog.init(...)`. Before opt-in there is no sink,
 *      so there is nothing to call even if (1) were somehow bypassed.
 *   3. PostHog's own `opt_out_capturing()` for anything that bypasses this
 *      module and touches the client directly.
 *
 * `posthog-js` guards its own queue on `__loaded`, so an event captured before
 * `init` is dropped with an "uninitialized" console warning rather than
 * buffered and replayed later. That is the property that makes an event
 * captured during the first 200ms of page load non-retroactive: it is not
 * "held until consent" and then sent, it is never sent at all.
 */

type Props = Record<string, unknown>;
type Sink = (event: string, props?: Props) => void;

let sink: Sink | null = null;

/** Called by `PostHogProvider` once — and only once — PostHog is initialised. */
export function registerAnalyticsSink(next: Sink): void {
  sink = next;
}

/** Called when analytics is withdrawn, so queued-for-later sending stops. */
export function unregisterAnalyticsSink(): void {
  sink = null;
}

/**
 * Send an analytics event, if and only if the person allowed analytics and
 * PostHog is actually running. Returns whether the event was sent, so callers
 * can assert on it in tests without inspecting PostHog internals.
 */
export function capture(event: string, props?: Props): boolean {
  if (!analyticsAllowed()) return false;
  if (!sink) return false;
  sink(event, props);
  return true;
}
