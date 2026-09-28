import { Skeleton, SkeletonStatus } from "@/components/Skeleton";

/**
 * /onboard loading boundary.
 *
 * Onboarding is a multi-step wizard, so the skeleton previews the two-column
 * step layout the user is about to enter: the question on the left, the control
 * on the right. Wizard steps that reflow on arrival feel broken even when they
 * are merely fast.
 */
export default function Loading() {
  return (
    <div className="t-bg t-text min-h-screen pb-24">
      <div className="container-xl pt-14">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-2.5 w-16" delay={60} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div>
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="mt-4 h-8 w-4/5" delay={60} />
            <Skeleton className="mt-3 h-3.5 w-3/5" delay={100} />
            <div className="mt-8 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="t-hover rounded-xl border p-4"
                  style={{ animationDelay: `${140 + i * 60}ms` }}
                >
                  <Skeleton className="h-3 w-1/2" delay={140 + i * 60} />
                </div>
              ))}
            </div>
          </div>

          <aside className="t-surface t-border border rounded-2xl p-6">
            <Skeleton className="h-3 w-28" />
            <div className="mt-5 space-y-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i}>
                  <Skeleton className="h-2.5 w-20" delay={i * 50} />
                  <Skeleton className="mt-2 h-2 w-full rounded-full" delay={i * 50 + 30} />
                </div>
              ))}
            </div>
          </aside>
        </div>

        <SkeletonStatus label="Loading onboarding" />
      </div>
    </div>
  );
}
