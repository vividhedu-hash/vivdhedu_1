import { Skeleton, SkeletonStatus } from "@/components/Skeleton";

/**
 * /psychometric loading boundary.
 *
 * The adaptive IRT assessment is the longest-running operation in the product,
 * so this skeleton stays up noticeably longer than the others. It previews the
 * trait radar and the item stem — the two things the user stares at while the
 * first item is being selected — so the wait has a visible shape.
 */
export default function Loading() {
  return (
    <div className="t-bg t-text min-h-screen pb-24">
      <div className="container-xl pt-14">
        <Skeleton className="h-2.5 w-32" />
        <Skeleton className="mt-4 h-9 w-2/3 max-w-lg" delay={60} />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Item stem */}
          <div className="t-surface t-border t-shadow-card border rounded-2xl p-7">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-2.5 w-16" delay={50} />
            </div>
            <Skeleton className="mt-6 h-5 w-4/5" delay={100} />
            <Skeleton className="mt-3 h-5 w-3/5" delay={140} />

            <div className="mt-8 space-y-2.5">
              {["A", "B", "C", "D"].map((opt, i) => (
                <div
                  key={opt}
                  className="t-hover flex items-center gap-3 rounded-xl border p-4"
                  style={{ animationDelay: `${180 + i * 60}ms` }}
                >
                  <Skeleton className="h-6 w-6 rounded-lg" delay={180 + i * 60} />
                  <Skeleton className="h-3 flex-1" delay={200 + i * 60} />
                </div>
              ))}
            </div>
          </div>

          {/* Trait radar */}
          <aside className="t-surface t-border border rounded-2xl p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-5 h-48 w-full rounded-xl" delay={80} />
            <div className="mt-5 space-y-2.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <Skeleton className="h-2.5 w-16" delay={140 + i * 50} />
                  <Skeleton className="h-2.5 w-10" delay={160 + i * 50} />
                </div>
              ))}
            </div>
          </aside>
        </div>

        <SkeletonStatus label="Preparing your adaptive assessment" />
      </div>
    </div>
  );
}
