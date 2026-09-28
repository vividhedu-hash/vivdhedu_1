import { Skeleton, SkeletonHeader, SkeletonStatus } from "@/components/Skeleton";

/**
 * /global loading boundary.
 *
 * Previews the comparison table shape — region columns with a cost and outcome
 * row each. This route is table-first, so a card skeleton would be misleading.
 */
export default function Loading() {
  return (
    <div className="t-bg t-text min-h-screen pb-24">
      <div className="container-xl pt-14">
        <SkeletonHeader />

        <div className="t-surface t-border mt-10 overflow-hidden rounded-2xl border">
          <div className="flex gap-6 border-b px-5 py-3.5" style={{ borderColor: "var(--border)" }}>
            <Skeleton className="h-2.5 w-32" />
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} delay={i * 60} className="h-2.5 w-20" />
            ))}
          </div>
          {["Tuition", "Living cost", "Post-study work", "Payback"].map((row, r) => (
            <div
              key={row}
              className="flex items-center gap-6 border-b px-5 py-4 last:border-b-0"
              style={{ borderColor: "var(--border-subtle)", animationDelay: `${100 + r * 70}ms` }}
            >
              <Skeleton className="h-3 w-32" delay={100 + r * 70} />
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} delay={120 + r * 70 + i * 50} className="h-3 w-20" />
              ))}
            </div>
          ))}
        </div>

        <SkeletonStatus label="Loading global programme data" />
      </div>
    </div>
  );
}
