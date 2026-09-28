"use client";

import Link from "next/link";
import { RouteError } from "@/components/RouteError";
import { FileText } from "lucide-react";

/**
 * /report/[token] error boundary.
 *
 * Scoped deliberately. A shared report link that fails to render is a
 * different failure from a full outage, so this offers only a retry and a way
 * back — it does not invite the reader to assume anything about whether the
 * report exists. Running a new analysis is offered as a second path because a
 * reader holding a dead link usually wants exactly that.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <RouteError
        error={error}
        reset={reset}
        kicker="Report unavailable"
        title="This report could not be rendered"
        body="The report link may have expired, or the data store did not respond. We are not rendering a partial report in its place."
        fallbackHref="/"
        fallbackLabel="Back to home"
      />
      <div className="flex justify-center pb-20">
        <Link href="/analyze" className="btn-ghost inline-flex items-center gap-2">
          <FileText size={13} aria-hidden="true" /> Run a new analysis
        </Link>
      </div>
    </>
  );
}
