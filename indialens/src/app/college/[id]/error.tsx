"use client";

import { RouteError } from "@/components/RouteError";

/**
 * /college/[id] error boundary.
 *
 * Note the distinction this page has to keep: a *render* failure (this
 * boundary) is different from a *missing* program. The page handles the
 * latter itself with a "Program not found" state, so anything arriving here is
 * an actual fault, and it is reported as one.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      error={error}
      reset={reset}
      kicker="Program page failed"
      title="This program page failed to load"
      body="The underlying data store did not answer. We would rather show this than render a detail page with invented cost or salary figures."
      fallbackHref="/explore"
      fallbackLabel="Back to the index"
    />
  );
}
