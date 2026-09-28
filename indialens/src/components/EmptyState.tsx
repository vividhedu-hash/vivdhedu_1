import Link from "next/link";
import { type LucideIcon } from "lucide-react";

/**
 * Shared empty state.
 *
 * An empty state is a product moment, not an apology. Someone looking at an
 * empty list is at the exact point where a well-designed product either
 * explains what will fill it or gets out of the way — "No data" on its own is
 * a dead end, and it is the single most common place a commercial product
 * feels unfinished.
 *
 * Three deliberate choices:
 *
 * 1. **It always names the next action.** `action` is the one field that is
 *    genuinely required. A user who does not know what to do next closes the
 *    tab.
 * 2. **It distinguishes "nothing yet" from "nothing matched".** `hint` exists
 *    for the second case. An empty search result is not an empty account —
 *    confusing the two is what makes apps feel like they are hiding state.
 * 3. **It never implies the data is missing because of an error.** If a fetch
 *    failed, that is the route's `error.tsx` job, not this component's. An
 *    empty state shown after a failure would be a false claim.
 */

export interface EmptyStateProps {
  /** Short label naming what is absent, e.g. "No saved reports". */
  title: string;
  /**
   * One or two sentences on what will fill this and why. This is the part that
   * converts a dead end into an invitation.
   */
  hint?: string;
  /**
   * The way forward. Required — an empty state without one is a dead end.
   * Give `href` for navigation, or `onClick` when the next step is a state
   * change on the current page (clearing a filter, for instance). An `href="#"`
   * placeholder is never acceptable: it looks actionable and does nothing.
   */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /** Secondary, lower-emphasis path. */
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /** Optional icon. Keep it restrained; this is not a celebration. */
  icon?: LucideIcon;
  /**
   * `default` sits on a card surface. `inline` drops the border for use inside
   * an existing panel. `bare` drops the surface entirely.
   */
  variant?: "default" | "inline" | "bare";
  className?: string;
}

export function EmptyState({
  title,
  hint,
  action,
  secondaryAction,
  icon: Icon,
  variant = "default",
  className = "",
}: EmptyStateProps) {
  const surface =
    variant === "default"
      ? "t-surface t-border t-shadow-card border rounded-2xl p-10"
      : variant === "inline"
        ? "t-border border rounded-xl p-8"
        : "py-8";

  return (
    <div
      // `status` rather than `alert`: this is an expected state, not a fault.
      // Announcing it politely means a screen-reader user learns the list is
      // legitimately empty without being interrupted mid-sentence.
      role="status"
      className={`text-center ${surface} ${className}`}
    >
      {Icon && (
        <div
          className="w-11 h-11 rounded-xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
        >
          <Icon size={17} className="t-faint" aria-hidden="true" />
        </div>
      )}

      <h3 className="t-text text-sm font-bold">{title}</h3>

      {hint && (
        <p className="t-muted mt-2 mx-auto max-w-sm text-[13px] leading-relaxed">{hint}</p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {action &&
            (action.onClick ? (
              <button type="button" onClick={action.onClick} className="btn-primary">
                {action.label}
              </button>
            ) : (
              <Link href={action.href ?? "/"} className="btn-primary inline-flex items-center gap-2">
                {action.label}
              </Link>
            ))}
          {secondaryAction &&
            (secondaryAction.onClick ? (
              <button type="button" onClick={secondaryAction.onClick} className="btn-ghost">
                {secondaryAction.label}
              </button>
            ) : (
              <Link href={secondaryAction.href ?? "/"} className="btn-ghost inline-flex items-center gap-2">
                {secondaryAction.label}
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
