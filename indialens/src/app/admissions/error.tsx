"use client";

import { RouteError } from "@/components/RouteError";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      error={error}
      reset={reset}
      kicker="Admissions model unavailable"
      title="Admissions odds could not be shown"
      body="No substitute matrix is rendered in place of a failed load. An odds estimate is only useful if it comes from the same cut-off and rank data the rest of the site uses."
      fallbackHref="/explore"
      fallbackLabel="Browse programmes"
    />
  );
}
