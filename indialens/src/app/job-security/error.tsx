"use client";

import { RouteError } from "@/components/RouteError";

/**
 * /job-security error boundary.
 *
 * This page's whole claim is that it is showing priors rather than
 * measurements. A boundary that degraded to "here are some scores anyway"
 * would contradict that claim at exactly the moment the backing engine is
 * unreachable, so it refuses to render a ranking it cannot source.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      error={error}
      reset={reset}
      kicker="Model unavailable"
      title="The job-security engine did not respond"
      body="No safety scores are shown. This page ranks careers by automation exposure, and a ranking invented at read-time would be worse than no ranking at all."
      fallbackHref="/explore"
      fallbackLabel="Browse programmes"
    />
  );
}
