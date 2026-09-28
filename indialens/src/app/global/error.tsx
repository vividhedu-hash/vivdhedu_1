"use client";

import { RouteError } from "@/components/RouteError";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      error={error}
      reset={reset}
      kicker="Comparison unavailable"
      title="Global programme data could not be loaded"
      body="No cost or outcome comparison was computed. We do not substitute a default conversion rate or a regional average when the underlying series is missing."
      retryLabel="Reload comparison"
      fallbackHref="/explore"
      fallbackLabel="Back to the program index"
    />
  );
}
