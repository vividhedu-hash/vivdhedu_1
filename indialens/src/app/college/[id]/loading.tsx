import { Skeleton, SkeletonStatus } from "@/components/Skeleton";

/**
 * /college/[id] loading boundary.
 *
 * Mirrors the detail page's real composition: breadcrumb, then the identity
 * block with the score ring beside it, then the two panels it actually opens
 * with. It is built from the shared `Skeleton` primitive rather than
 * hand-rolled `animate-pulse` divs, so it themes in both palettes and honours
 * `prefers-reduced-motion` (the shared primitive pins blocks at their resting
 * opacity instead of leaving an empty rectangle).
 */
export default function Loading() {
  return (
    <div className="page-shell">
      <div className="container-xl page-header">
        <Skeleton className="h-3 w-52" />

        <div className="mt-8 flex flex-col items-start gap-8 md:flex-row">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-8 w-3/4 max-w-md" delay={40} />
            <Skeleton className="mt-3 h-4 w-1/2 max-w-xs" delay={90} />
            <div className="mt-5 flex flex-wrap gap-2">
              <Skeleton className="h-5 w-24 rounded-full" delay={140} />
              <Skeleton className="h-5 w-20 rounded-full" delay={170} />
              <Skeleton className="h-5 w-16 rounded-full" delay={200} />
            </div>
            <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="metric-cell">
                  <Skeleton className="h-2 w-20" delay={220 + i * 50} />
                  <Skeleton className="mt-2 h-5 w-16" delay={250 + i * 50} />
                </div>
              ))}
            </div>
          </div>

          <div className="w-full shrink-0 md:w-40">
            <div className="t-surface t-border flex flex-col items-center rounded-2xl border p-6">
              <Skeleton className="h-28 w-28 rounded-full" delay={120} />
              <Skeleton className="mt-5 h-3 w-24" delay={200} />
              <Skeleton className="mt-2 h-2.5 w-16" delay={240} />
            </div>
          </div>
        </div>
      </div>

      <div className="container-xl page-section-tight">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="min-w-0 space-y-5 lg:col-span-2">
            {[0, 1].map((i) => (
              <div key={i} className="panel">
                <div className="panel-head">
                  <Skeleton className="h-2.5 w-40" delay={120 + i * 100} />
                </div>
                <div className="panel-pad space-y-4">
                  {[0, 1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center gap-3">
                      <Skeleton className="h-2.5 w-28" delay={160 + i * 100 + j * 40} />
                      <Skeleton
                        className="h-2 flex-1 rounded-full"
                        delay={180 + i * 100 + j * 40}
                      />
                      <Skeleton className="h-2.5 w-10" delay={200 + i * 100 + j * 40} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="min-w-0 space-y-5">
            <div className="panel">
              <div className="panel-head">
                <Skeleton className="h-2.5 w-28" delay={220} />
              </div>
              <div className="panel-pad space-y-3">
                {[0, 1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Skeleton className="h-2.5 w-32" delay={260 + j * 40} />
                    <Skeleton className="h-2 flex-1 rounded-full" delay={280 + j * 40} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <SkeletonStatus label="Loading programme details" />
      </div>
    </div>
  );
}
