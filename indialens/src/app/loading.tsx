import { BRAND } from "@/lib/brand";
import { Skeleton, SkeletonCards, SkeletonStatus } from "@/components/Skeleton";

/**
 * Root loading boundary.
 *
 * App Router: this renders during a server-component navigation inside the
 * layout, so it is the *only* thing on screen for the transition. It is
 * therefore shaped like a page — a heading, a lead, a block of content cards —
 * rather than a centred spinner, so the arrival of real content is a fill-in
 * rather than a full repaint.
 *
 * It now uses the shared `Skeleton*` primitives rather than hand-rolled
 * `animate-pulse` divs, which is what makes the shimmer respect
 * `prefers-reduced-motion`: the shared primitives pin the blocks at their
 * resting opacity instead of leaving an empty rectangle.
 */
export default function Loading() {
  return (
    <div className="page-shell">
      <div className="container-xl page-section">
        <div className="max-w-2xl">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="mt-5 h-10 w-2/3" delay={60} />
          <Skeleton className="mt-3 h-4 w-1/2" delay={110} />
        </div>

        <div className="mt-12">
          <SkeletonCards count={3} />
        </div>

        <SkeletonStatus label={`Loading ${BRAND.name}`} />
      </div>
    </div>
  );
}
