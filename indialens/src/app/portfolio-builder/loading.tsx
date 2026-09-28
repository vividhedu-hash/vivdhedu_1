import { Skeleton, SkeletonHeader, SkeletonStatus } from "@/components/Skeleton";

/**
 * /portfolio-builder loading boundary.
 *
 * Previews the two artefacts the studio is built around — the written record
 * and the structured evidence list — so the editor's split layout is already
 * in place when the drafts load.
 */
export default function Loading() {
  return (
    <div className="t-bg t-text min-h-screen pb-24">
      <div className="container-xl pt-14">
        <SkeletonHeader />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {[0, 1].map((col) => (
            <div
              key={col}
              className="t-surface t-border border rounded-2xl p-6"
              style={{ animationDelay: `${col * 90}ms` }}
            >
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" delay={col * 90} />
                <Skeleton className="h-3 w-32" delay={col * 90 + 40} />
              </div>
              <div className="mt-6 space-y-2.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    delay={col * 90 + 80 + i * 45}
                    className={`h-2.5 ${i % 3 === 2 ? "w-1/2" : "w-full"}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <SkeletonStatus label="Loading your portfolio" />
      </div>
    </div>
  );
}
