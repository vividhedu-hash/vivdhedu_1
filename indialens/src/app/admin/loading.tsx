import { Skeleton, SkeletonStatus } from "@/components/Skeleton";

/**
 * /admin loading boundary.
 *
 * The console opens on the dashboard tab, so the skeleton previews the stat
 * row plus the two panels beneath it.
 *
 * Note: this boundary covers the page shell only. The two gates inside the
 * page (session via `AuthGate`, then the static admin key) render their own
 * real states, so an unauthenticated visitor sees the sign-in wall rather than
 * this skeleton sitting in front of it forever.
 */
export default function Loading() {
  return (
    <div className="page-shell">
      <div className="container-xl page-header">
        <div className="panel panel-pad">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-2.5 w-40" />
              <Skeleton className="mt-3 h-6 w-56" delay={60} />
            </div>
            <Skeleton className="h-9 w-36 rounded-full" delay={100} />
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="metric-cell">
                <Skeleton className="h-2 w-20" delay={140 + i * 50} />
                <Skeleton className="mt-2 h-7 w-16" delay={170 + i * 50} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="panel">
              <div className="panel-head">
                <Skeleton className="h-2.5 w-32" delay={340 + i * 80} />
              </div>
              <div className="panel-pad space-y-3">
                {[0, 1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center justify-between gap-3">
                    <Skeleton className="h-3 w-28" delay={380 + i * 80 + j * 40} />
                    <Skeleton className="h-3 w-14" delay={400 + i * 80 + j * 40} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <SkeletonStatus label="Loading console" />
      </div>
    </div>
  );
}
