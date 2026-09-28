import { Skeleton, SkeletonHeader, SkeletonCards, SkeletonStatus } from "@/components/Skeleton";

/**
 * /marketplace loading boundary.
 *
 * The marketplace is a card grid, so the skeleton is a card grid of the same
 * density. Matching the count matters: six arriving cards where eight were
 * promised causes a visible reflow on load.
 */
export default function Loading() {
  return (
    <div className="t-bg t-text min-h-screen pb-24">
      <div className="container-xl pt-14">
        <SkeletonHeader />
        <SkeletonCards count={6} className="mt-10" />
        <SkeletonStatus label="Loading course listings" />
      </div>
    </div>
  );
}
