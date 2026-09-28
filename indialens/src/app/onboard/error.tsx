"use client";

import { RouteError } from "@/components/RouteError";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      error={error}
      reset={reset}
      kicker="Onboarding interrupted"
      title="We could not save your progress"
      body="Nothing has been submitted. Your answers stay on this device until the next step completes, so retrying is safe and you will not lose your place."
      retryLabel="Try again"
      fallbackHref="/"
      fallbackLabel="Back to home"
    />
  );
}
