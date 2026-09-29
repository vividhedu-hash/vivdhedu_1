import { Skeleton, SkeletonStatus } from "@/components/Skeleton";

/**
 * /job-security loading boundary.
 *
 * Mirrors the page's real shape: headline, a three-control panel, then the wide
 * matrix the page exists to show. The table is what the page is, so the
 * skeleton previews a table rather than a spinner.
 */
export default function Loading() {
  return (
    <div className="page-shell">
      <div className="container-xl page-header">
        <div className="max-w-2xl">
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="mt-4 h-9 w-4/5" delay={60} />
          <Skeleton className="mt-3 h-4 w-full" delay={110} />
          <Skeleton className="mt-2 h-4 w-3/4" delay={140} />
        </div>

        <div className="panel panel-pad mt-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="metric-cell">
                <Skeleton className="h-2 w-20" delay={180 + i * 50} />
                <Skeleton className="mt-2 h-9 w-full rounded-lg" delay={210 + i * 50} />
              </div>
            ))}
          </div>
        </div>

        <div className="panel mt-8">
          <div className="panel-head">
            <div className="flex flex-1 gap-6">
              <Skeleton className="h-2.5 w-40" delay={340} />
              <Skeleton className="h-2.5 w-16" delay={370} />
              <Skeleton className="h-2.5 w-16" delay={400} />
            </div>
          </div>
          <div className="panel-pad-sm">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b py-3.5 last:border-0"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <Skeleton className="h-3 w-44" delay={430 + i * 45} />
                <Skeleton className="h-2.5 w-14" delay={450 + i * 45} />
                <Skeleton className="h-2.5 flex-1 rounded-full" delay={470 + i * 45} />
                <Skeleton className="h-2.5 w-14" delay={490 + i * 45} />
              </div>
            ))}
          </div>
        </div>

        <SkeletonStatus label="Loading exposure data" />
      </div>
    </div>
  );
}
