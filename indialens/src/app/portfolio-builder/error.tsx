"use client";

import { RouteError } from "@/components/RouteError";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      error={error}
      reset={reset}
      kicker="Portfolio unavailable"
      title="Your portfolio could not be loaded"
      body="Your drafts are stored separately and have not been lost. We are not showing a blank portfolio, because an empty editor looks like work you have thrown away."
      retryLabel="Reload portfolio"
      fallbackHref="/workspace"
      fallbackLabel="Back to workspace"
    />
  );
}
