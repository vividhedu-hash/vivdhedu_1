"use client";

import { RouteError } from "@/components/RouteError";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      error={error}
      reset={reset}
      kicker="Index unavailable"
      title="The program index could not be loaded"
      body="We are not showing a partial index in place of a failed one — a shorter list that looks complete is worse than an explicit error."
    />
  );
}
