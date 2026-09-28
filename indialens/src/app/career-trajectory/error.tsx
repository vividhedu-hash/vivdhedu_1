"use client";

import { RouteError } from "@/components/RouteError";

/**
 * /career-trajectory error boundary.
 *
 * Deliberately does not render a partial projection. A truncated distribution
 * — say, 8 states where the 9th silently failed — reads as "here is where you
 * will be", which is exactly the unearned claim this page exists to avoid. A
 * failed projection says so.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      error={error}
      reset={reset}
      kicker="Projection unavailable"
      title="The career chain did not run"
      body="We are not showing a partial trajectory in place of a failed one. A distribution missing states would read as a real answer."
      fallbackHref="/methodology"
      fallbackLabel="How the model works"
    />
  );
}
