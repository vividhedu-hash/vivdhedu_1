"use client";

import { RouteError } from "@/components/RouteError";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      error={error}
      reset={reset}
      kicker="Comparison unavailable"
      title="These programmes could not be compared"
      body="The side-by-side was not rendered. Differences in the table are computed from live placement and cost data, so a partial table could imply a comparison that was never actually made."
      retryLabel="Retry comparison"
      fallbackHref="/explore"
      fallbackLabel="Pick different programmes"
    />
  );
}
