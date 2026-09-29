import type { ReactNode } from "react";
import {
  Info, AlertTriangle, CheckCircle2, XCircle, Sparkles, type LucideIcon,
} from "lucide-react";

/**
 * The notice — the one way this product states a caveat, a formula, a limit, or
 * a state.
 *
 * It exists because the pages were each inventing their own version of "here is
 * a caveat", using a different colour each time: `bg-blue-50 border-blue-100`
 * on one page, `bg-amber-50 border-amber-200` on the next, and on the advisor
 * page a rose block for what was actually an informational note. None of them
 * survived a theme change.
 *
 * The tone vocabulary is deliberately narrow, and the mapping is semantic
 * rather than decorative:
 *
 *   `info`    neutral. A caveat, a formula, a "this is what we did not do".
 *   `accent`  the product making a claim about itself that matters.
 *   `ok`      something verifiably present.
 *   `warn`    degraded but usable — a fallback source, a slow dependency.
 *   `error`   something failed. Never used for "not configured"; that is
 *             `warn`, because an unconnected optional integration is a state,
 *             not a fault. Conflating the two is how a user concludes their
 *             question was unanswerable when in fact nothing was switched on.
 */
type Tone = "info" | "accent" | "ok" | "warn" | "error";

const TONE_ICON: Record<Tone, LucideIcon> = {
  info: Info,
  accent: Sparkles,
  ok: CheckCircle2,
  warn: AlertTriangle,
  error: XCircle,
};

/** Colour per tone, as a CSS var. Only used for the icon; the box is a token. */
const TONE_COLOR: Record<Tone, string> = {
  info: "var(--blue)",
  accent: "var(--accent)",
  ok: "var(--green)",
  warn: "var(--amber)",
  error: "var(--red)",
};

export function Notice({
  tone = "info",
  title,
  children,
  icon,
  className = "",
  action,
}: {
  tone?: Tone;
  /** Optional short label. Bold, primary ink — not a heading. */
  title?: string;
  children?: ReactNode;
  /** Override the tone's default icon. Pass `null` for no icon. */
  icon?: LucideIcon | null;
  className?: string;
  action?: ReactNode;
}) {
  const Icon = icon === null ? null : (icon ?? TONE_ICON[tone]);
  const toneClass =
    tone === "accent" ? "notice-accent" :
    tone === "ok"     ? "notice-ok" :
    tone === "warn"   ? "notice-warn" :
    tone === "error"  ? "notice-err" : "";

  return (
    <div className={`notice ${toneClass} ${className}`}>
      {Icon && (
        <Icon
          size={15}
          className="notice-icon"
          style={{ color: TONE_COLOR[tone] }}
          aria-hidden="true"
        />
      )}
      <div className="min-w-0 flex-1">
        {title && (
          <p className="mb-0.5 font-semibold t-text">{title}</p>
        )}
        {children && <div className="[&_a]:underline [&_a]:underline-offset-2 [&_a]:font-medium">{children}</div>}
        {action && <div className="mt-3 flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  );
}

/**
 * "Not measured" — the state this product is most particular about, so it gets
 * its own component rather than being spelled out per page.
 *
 * The copy is fixed on purpose. A surface that has no data for a figure must
 * say so in the same words everywhere, or "unavailable" and "not applicable"
 * and "we don't have this" start to read as three different claims. It also
 * has to avoid saying anything about *why* — an unmeasured figure is unmeasured
 * because no source published one, and the interface does not know whether that
 * source will publish next term.
 */
export function UnmeasuredNote({
  what,
  className = "",
  children,
}: {
  /** What is missing, e.g. "placement rate" or "mobility index". */
  what: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`notice ${className}`}>
      <span
        aria-hidden="true"
        className="num-na mt-px select-none text-[13px] leading-none"
      >
        &mdash;
      </span>
      <div className="min-w-0 flex-1">
        <p className="t-text text-[12px] font-semibold">
          {what} not measured
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--text-tertiary)]">
          {children ??
            "No source has published this figure, so it is left blank rather than estimated. A dash here means the data is absent, not zero."}
        </p>
      </div>
    </div>
  );
}
