/**
 * Skeleton primitives.
 *
 * A skeleton is a promise about the shape of what is coming. A generic spinner
 * promises nothing, which is why a page that swaps a spinner for content still
 * feels like it jumps: the user has no idea what to expect, so the content
 * arriving is always a surprise. Matching the real layout removes the jump.
 *
 * Every primitive is theme-driven through the `.t-*` token classes, so a
 * skeleton renders correctly in both the light and dark palettes without a
 * second set of hardcoded colours.
 *
 * Colour note: `--bg-hover` is the intended fill for inert placeholder blocks.
 * On light it is `rgba(0,0,0,0.04)`; on dark it is the equivalent lightening
 * value. Using a token rather than `bg-white/10` is what lets these survive a
 * theme change.
 */

/** A single inert placeholder block. */
export function Skeleton({
  className = "",
  delay = 0,
}: {
  className?: string;
  /** Stagger in ms. Small values (40–80) read as depth, not as lag. */
  delay?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={`t-hover rounded bg-current/[0.06] animate-pulse ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    />
  );
}

/**
 * A stack of text-line placeholders sized like a paragraph. `lines` should
 * approximate the real copy length — a skeleton that is noticeably shorter
 * than the content it becomes still causes a jump.
 */
export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          delay={i * 60}
          className={`h-3 ${i === lines - 1 && lines > 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

/** A row of rounded placeholder cards, matching a card-grid layout. */
export function SkeletonCards({
  count = 6,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="t-surface t-border t-shadow-card border rounded-2xl p-5"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-2.5 w-16" delay={i * 70} />
              <Skeleton className="h-4 w-3/4" delay={i * 70 + 40} />
              <Skeleton className="h-2.5 w-1/2" delay={i * 70 + 80} />
            </div>
            <Skeleton className="h-9 w-9 rounded-xl" delay={i * 70 + 40} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Skeleton className="h-10" delay={i * 70 + 120} />
            <Skeleton className="h-10" delay={i * 70 + 140} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Page-level header block: kicker, headline, and a short lead. Repeated across
 * most routes, so it is worth having once.
 */
export function SkeletonHeader({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Skeleton className="h-2.5 w-28" />
      <Skeleton className="mt-4 h-9 w-3/4 max-w-xl" delay={60} />
      <SkeletonText lines={2} className="mt-4 max-w-lg" />
    </div>
  );
}

/**
 * The status line under a skeleton. It carries `role="status"` so assistive
 * technology announces that loading is in progress — a purely visual pulse is
 * silent to a screen-reader user, who would otherwise get no signal at all.
 */
export function SkeletonStatus({ label = "Loading" }: { label?: string }) {
  return (
    <p role="status" aria-live="polite" className="t-faint mono mt-10 text-center text-[11px]">
      <span className="sr-only">{label}. </span>
      {label}…
    </p>
  );
}
