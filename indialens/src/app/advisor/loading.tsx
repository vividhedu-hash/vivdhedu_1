import { Skeleton, SkeletonStatus } from "@/components/Skeleton";

/**
 * /advisor loading boundary.
 *
 * The advisor is a chat surface, so the skeleton is a placeholder exchange
 * rather than a page header — otherwise the whole layout shifts when the
 * transcript renders.
 */
export default function Loading() {
  return (
    <div className="t-bg t-text min-h-screen pb-24">
      <div className="container-lg pt-14">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="mt-4 h-9 w-1/2" delay={60} />

        <div className="mt-10 space-y-5">
          {/* User turn */}
          <div className="flex justify-end">
            <div className="t-hover h-10 w-2/5 animate-pulse rounded-2xl" />
          </div>
          {/* Grounded answer, with a citation block */}
          <div className="t-surface t-border border rounded-2xl p-5">
            <div className="space-y-2.5">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} delay={100 + i * 60} className={`h-2.5 ${i === 3 ? "w-1/2" : "w-full"}`} />
              ))}
            </div>
            <div className="mt-5 space-y-2 border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded" delay={340 + i * 60} />
                  <Skeleton className="h-2.5 w-40" delay={360 + i * 60} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <SkeletonStatus label="Opening the advisor" />
      </div>
    </div>
  );
}
