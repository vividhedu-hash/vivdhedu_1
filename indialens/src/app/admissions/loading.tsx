import { Skeleton, SkeletonStatus } from "@/components/Skeleton";

/**
 * /admissions loading boundary.
 *
 * The page is an input form followed by a tiered result matrix, so the
 * skeleton is a form preview followed by three placeholder tier groups.
 */
export default function Loading() {
  return (
    <div className="page-shell">
      <div className="container-xl page-header">
        <div className="max-w-2xl">
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="mt-4 h-9 w-3/4" delay={60} />
          <Skeleton className="mt-3 h-4 w-full" delay={110} />
          <Skeleton className="mt-2 h-4 w-2/3" delay={140} />
        </div>

        <div className="panel panel-pad mt-9">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="metric-cell">
                <Skeleton className="h-2 w-20" delay={180 + i * 50} />
                <Skeleton className="mt-2 h-9 w-full rounded-lg" delay={210 + i * 50} />
              </div>
            ))}
          </div>
          <Skeleton className="mt-6 h-10 w-40 rounded-full" delay={380} />
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="panel">
              <div className="panel-head">
                <Skeleton className="h-2.5 w-24" delay={420 + i * 80} />
              </div>
              <div className="panel-pad space-y-3">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="flex items-center justify-between gap-3">
                    <Skeleton className="h-3 w-32" delay={460 + i * 80 + j * 40} />
                    <Skeleton className="h-3 w-12" delay={480 + i * 80 + j * 40} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <SkeletonStatus label="Loading admissions data" />
      </div>
    </div>
  );
}
