import { Skeleton, SkeletonStatus } from "@/components/Skeleton";

/**
 * /career-trajectory loading boundary.
 *
 * Mirrors the real page shape: headline, a four-control bar, then the two
 * headline stat cards and the wide year-by-year distribution the page exists to
 * show. The route is client-rendered, so this is the only thing on screen
 * between navigation and the first matrix result — a generic spinner would be a
 * full repaint rather than a fill-in.
 */
export default function Loading() {
  return (
    <div className="page-shell">
      <div className="container-xl page-header">
        <div className="max-w-2xl">
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="mt-4 h-9 w-4/5" delay={60} />
          <Skeleton className="mt-3 h-4 w-full" delay={110} />
        </div>

        <div className="panel panel-pad mt-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="metric-cell">
                <Skeleton className="h-2 w-20" delay={180 + i * 50} />
                <Skeleton className="mt-2 h-9 w-full rounded-lg" delay={210 + i * 50} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="panel">
              <div className="panel-head">
                <Skeleton className="h-2.5 w-32" delay={360 + i * 70} />
              </div>
              <div className="panel-pad">
                <Skeleton className="h-8 w-24" delay={400 + i * 70} />
                <div
                  className="mt-5 flex items-center gap-3 border-t pt-4"
                  style={{ borderColor: "var(--divider)" }}
                >
                  <Skeleton className="h-2.5 w-28" delay={440 + i * 70} />
                  <Skeleton className="h-2.5 w-16" delay={465 + i * 70} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="panel mt-8">
          <div className="panel-head">
            <Skeleton className="h-2.5 w-40" delay={500} />
          </div>
          <div className="panel-pad-sm">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b py-3.5 last:border-0"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <Skeleton className="h-3 w-12" delay={540 + i * 45} />
                <Skeleton className="h-2.5 w-40" delay={560 + i * 45} />
                <Skeleton className="h-2.5 flex-1 rounded-full" delay={580 + i * 45} />
              </div>
            ))}
          </div>
        </div>

        <SkeletonStatus label="Loading trajectory model" />
      </div>
    </div>
  );
}
