import { Skeleton, SkeletonHeader, SkeletonStatus } from "@/components/Skeleton";

/**
 * /workspace loading boundary.
 *
 * The workspace is the signed-in home: a greeting band, the student's own saved
 * reports, and the decision telemetry sidebar. The skeleton mirrors that
 * arrangement so the transition does not rearrange the page around the user.
 */
export default function Loading() {
  return (
    <div className="t-bg t-text min-h-screen pb-24">
      <div className="container-xl pt-14">
        <SkeletonHeader />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main column: the student's saved reports */}
          <div className="space-y-4">
            <Skeleton className="h-3 w-32" />
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="t-surface t-border border rounded-2xl p-5"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/5" delay={i * 80} />
                    <Skeleton className="h-2.5 w-1/4" delay={i * 80 + 50} />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-lg" delay={i * 80 + 50} />
                </div>
              </div>
            ))}
          </div>

          {/* Telemetry sidebar */}
          <aside className="t-surface t-border border rounded-2xl p-5">
            <Skeleton className="h-3 w-24" />
            <div className="mt-5 space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <Skeleton className="h-2.5 w-20" delay={i * 60} />
                  <Skeleton className="h-2.5 w-12" delay={i * 60 + 30} />
                </div>
              ))}
            </div>
          </aside>
        </div>

        <SkeletonStatus label="Loading your workspace" />
      </div>
    </div>
  );
}
