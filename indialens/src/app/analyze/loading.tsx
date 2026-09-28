import { Skeleton, SkeletonStatus } from "@/components/Skeleton";

/**
 * /analyze loading boundary.
 *
 * Analysis runs the full pipeline — psychometrics, ROI, displacement — so this
 * previews the report's section structure rather than a generic panel. The
 * page already has its own in-page synthesis loader for the long tail; this
 * boundary covers the initial mount only.
 */
export default function Loading() {
  return (
    <div className="t-bg t-text min-h-screen pb-24">
      <div className="container-lg pt-14">
        <Skeleton className="h-2.5 w-28" />
        <Skeleton className="mt-4 h-9 w-2/3" delay={60} />

        {/* Headline score ring */}
        <div className="mt-10 flex flex-col items-center">
          <Skeleton className="h-44 w-44 rounded-full" delay={100} />
          <Skeleton className="mt-5 h-3 w-40" delay={150} />
        </div>

        {/* Report sections */}
        <div className="mt-12 space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="t-surface t-border border rounded-2xl p-6"
              style={{ animationDelay: `${180 + i * 80}ms` }}
            >
              <Skeleton className="h-3 w-28" delay={180 + i * 80} />
              <div className="mt-4 space-y-2.5">
                {[0, 1, 2].map((j) => (
                  <Skeleton key={j} delay={220 + i * 80 + j * 50} className="h-2.5 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>

        <SkeletonStatus label="Computing your report" />
      </div>
    </div>
  );
}
