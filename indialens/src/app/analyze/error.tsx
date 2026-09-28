"use client";

import { RouteError } from "@/components/RouteError";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      error={error}
      reset={reset}
      kicker="Analysis failed"
      title="We could not complete this analysis"
      body="No report was generated. Every figure in a VividhEdu report is computed from your inputs and the source data, so a partial run would produce conclusions we cannot stand behind."
      retryLabel="Run it again"
      fallbackHref="/onboard"
      fallbackLabel="Check your inputs"
    />
  );
}
