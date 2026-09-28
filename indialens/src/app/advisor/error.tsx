"use client";

import { RouteError } from "@/components/RouteError";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      error={error}
      reset={reset}
      kicker="Advisor unavailable"
      title="The AI advisor is not responding"
      body="Your question has not been answered, and we will not answer it without a grounded source. Every claim this advisor makes is meant to be traceable to a citation."
      retryLabel="Ask again"
      fallbackHref="/methodology"
      fallbackLabel="How the advisor sources answers"
    />
  );
}
