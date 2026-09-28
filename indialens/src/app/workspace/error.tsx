"use client";

import { RouteError } from "@/components/RouteError";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      error={error}
      reset={reset}
      kicker="Workspace unavailable"
      title="Your workspace could not be loaded"
      body="We are not rendering a partial workspace or inventing placeholder results in place of a failed load. Retry, or return to onboarding to rebuild your profile from the start."
      fallbackHref="/onboard"
      fallbackLabel="Back to onboarding"
    />
  );
}
