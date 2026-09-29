import { Skeleton, SkeletonStatus } from "@/components/Skeleton";

/**
 * /compare loading boundary.
 *
 * /compare is a server component that awaits `fetchCollegeList`, so this
 * boundary is what the user actually sees during the real load. It previews
 * the page's real composition — the header, then the comparison matrix with
 * its programme columns, then the closing panel — rather than a spinner.
 */
export default function Loading() {
  return (
    <div className="page-shell">
      <div className="container-xl page-header">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-5 w-44 rounded-full" />
            <Skeleton className="mt-5 h-9 w-80 max-w-full" delay={60} />
            <Skeleton className="mt-3 h-4 w-64 max-w-full" delay={110} />
          </div>
          <div className="flex shrink-0 gap-2.5">
            <Skeleton className="h-10 w-32 rounded-full" delay={140} />
            <Skeleton className="h-10 w-36 rounded-full" delay={170} />
          </div>
        </div>

        <div className="mt-7">
          <div className="panel">
            <div className="panel-head">
              <div className="flex flex-1 gap-3">
                <Skeleton className="h-8 flex-1" delay={200} />
                <Skeleton className="h-8 flex-1" delay={230} />
                <Skeleton className="h-8 flex-1" delay={260} />
                <Skeleton className="h-8 flex-1" delay={290} />
              </div>
            </div>
            <div className="panel-pad space-y-4">
              {[
                "Total cost of degree",
                "20-year discounted NPV",
                "Debt recovery period",
                "AI automation exposure",
              ].map((row, i) => (
                <div key={row} className="flex items-center gap-4">
                  <Skeleton className="h-3 w-40" delay={320 + i * 50} />
                  <div className="flex flex-1 justify-end gap-4">
                    <Skeleton className="h-3 w-16" delay={340 + i * 50} />
                    <Skeleton className="h-3 w-16" delay={360 + i * 50} />
                    <Skeleton className="h-3 w-16" delay={380 + i * 50} />
                    <Skeleton className="h-3 w-16" delay={400 + i * 50} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <SkeletonStatus label="Loading benchmark matrix" />
      </div>
    </div>
  );
}
