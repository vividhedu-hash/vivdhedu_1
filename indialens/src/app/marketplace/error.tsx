"use client";

import { RouteError } from "@/components/RouteError";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      error={error}
      reset={reset}
      kicker="Marketplace unavailable"
      title="Course listings could not be loaded"
      body="We are not showing an empty catalogue in place of a failed fetch — a blank grid reads as 'no courses match', which is a claim about the data that we have not verified."
      retryLabel="Reload listings"
      fallbackHref="/explore"
      fallbackLabel="Browse the program index"
    />
  );
}
