"use client";

import { RouteError } from "@/components/RouteError";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      error={error}
      reset={reset}
      kicker="Assessment unavailable"
      title="The adaptive assessment could not start"
      body="No trait profile was computed. An incomplete IRT session would produce a score we cannot report a standard error for, so we are not showing one."
      retryLabel="Restart assessment"
      fallbackHref="/"
      fallbackLabel="Back to home"
    />
  );
}
