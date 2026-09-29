import { Skeleton, SkeletonStatus } from "@/components/Skeleton";

/**
 * /report/[token] loading boundary.
 *
 * Shaped after the report's real composition: the expiry strip, a two-column
 * title block, then the score panel beside the trajectory panels the report
 * opens with. Built from the shared `Skeleton` primitive so it themes in both
 * palettes and honours `prefers-reduced-motion`.
 */
export default function Loading() {
  return (
    <div className="page-shell">
      <div className="container-xl page-header">
        <div className="panel panel-pad-sm mb-7 flex flex-wrap items-center justify-between gap-4">
          <Skeleton className="h-3 w-56" delay={40} />
          <div className="flex gap-3">
            <Skeleton className="h-8 w-28 rounded-full" delay={80} />
            <Skeleton className="h-8 w-28 rounded-full" delay={110} />
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-start">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-2.5 w-24" delay={140} />
            <Skeleton className="mt-4 h-8 w-4/5" delay={180} />
            <Skeleton className="mt-3 h-3 w-3/5" delay={220} />
          </div>
          <Skeleton className="h-12 w-full rounded-full md:w-56" delay={250} />
        </div>
      </div>

      <div className="container-xl page-section-tight">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="w-full shrink-0 md:w-1/3">
            <div className="panel flex flex-col items-center p-6">
              <Skeleton className="h-32 w-32 rounded-full" delay={200} />
              <Skeleton className="mt-5 h-3 w-28" delay={260} />
              <div className="mt-6 w-full space-y-3">
                <Skeleton className="h-2.5 w-full rounded-full" delay={300} />
                <Skeleton className="h-2.5 w-4/5 rounded-full" delay={330} />
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-5">
            {[0, 1].map((i) => (
              <div key={i} className="panel">
                <div className="panel-head">
                  <Skeleton className="h-2.5 w-44" delay={180 + i * 100} />
                </div>
                <div className="panel-pad">
                  <Skeleton className="h-28 w-full rounded-xl" delay={230 + i * 100} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <SkeletonStatus label="Loading report" />
      </div>
    </div>
  );
}
