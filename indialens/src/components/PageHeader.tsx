import type { ReactNode } from "react";

/**
 * The page header — one component, every route.
 *
 * The single strongest signal that a site is a product rather than a set of
 * pages is that every page opens the same way. Before this existed, each route
 * hand-rolled its own kicker / headline / lead block: different top padding
 * (`pt-10`, `pt-14`, `pt-24`, `pt-32`), different headline sizes
 * (`text-3xl`, `text-5xl`, `text-[clamp(2.8rem,5.5vw,4.5rem)]`), and — on
 * `/advisor` and `/career-trajectory` — a `font-serif` that appears nowhere
 * else in the product. Reading two pages felt like reading two websites.
 *
 * The four slots are deliberate and are the same on every page:
 *
 *   kicker   — mono uppercase eyebrow with the accent rule. Names the surface
 *              ("Program Asset Index"), never sells it.
 *   title    — one `clamp()`, `text-wrap: balance`, so it never breaks to four
 *              lines on a 360px phone.
 *   lead     — one sentence, `.section-lead`, max 62ch. If it needs two
 *              sentences it is body copy, not a lead.
 *   actions  — at most two. Three or more buttons on a page header is a
 *              toolbar, and this is a page header.
 *
 * `eyebrow` is for a genuine status ("Free during launch", "Not yet built"),
 * which is a factual claim about the product. It is deliberately not for
 * marketing adjectives.
 */
export function PageHeader({
  kicker,
  eyebrow,
  title,
  lead,
  actions,
  align = "start",
  size = "lg",
  className = "",
  children,
}: {
  kicker?: string;
  /** A factual status chip. Status, not slogan. */
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  align?: "start" | "center";
  size?: "lg" | "sm";
  className?: string;
  /** Anything that belongs under the lead — a filter bar, a stat row. */
  children?: ReactNode;
}) {
  const centered = align === "center";
  return (
    <header className={`${centered ? "text-center" : ""} ${className}`}>
      <div
        className={
          centered
            ? "flex flex-col items-center"
            : "flex flex-col items-start"
        }
      >
        {kicker && <p className="kicker-web mb-4">{kicker}</p>}

        {eyebrow && <div className="mb-5">{eyebrow}</div>}

        <h1 className={size === "lg" ? "page-title" : "page-title-sm"}>{title}</h1>

        {lead && (
          <div
            className={
              centered
                ? "mt-4 flex flex-col items-center"
                : "mt-4 flex flex-col items-start"
            }
          >
            {typeof lead === "string" ? (
              <p className="section-lead">{lead}</p>
            ) : (
              <div className="section-lead">{lead}</div>
            )}
          </div>
        )}

        {actions && (
          <div
            className={
              centered
                ? "mt-8 flex flex-wrap items-center justify-center gap-2.5"
                : "mt-8 flex flex-wrap items-center gap-2.5"
            }
          >
            {actions}
          </div>
        )}
      </div>

      {children && <div className="mt-8">{children}</div>}
    </header>
  );
}

/**
 * A section header, for the second and subsequent bands on a page.
 *
 * `divider` is on by default because a second `h2` with no separation from the
 * one above it is the other thing that makes a long page feel undifferentiated.
 */
export function SectionHeader({
  kicker,
  title,
  lead,
  actions,
  align = "start",
  className = "",
}: {
  kicker?: string;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  align?: "start" | "center";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div
      className={`mb-9 flex flex-col gap-5 ${
        centered
          ? "items-center text-center"
          : "md:flex-row md:items-end md:justify-between"
      } ${className}`}
    >
      <div className={centered ? "flex flex-col items-center" : ""}>
        {kicker && (
          <p className="kicker-accent mb-3">{kicker}</p>
        )}
        <h2 className="section-title">{title}</h2>
        {lead && (
          typeof lead === "string" ? (
            <p className={`section-lead mt-3 ${centered ? "mx-auto" : ""}`}>{lead}</p>
          ) : (
            <div className="section-lead mt-3">{lead}</div>
          )
        )}
      </div>
      {actions && (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2.5">
          {actions}
        </div>
      )}
    </div>
  );
}

/**
 * A hairline rule between two sections, for when a band boundary is wanted
 * without the padding of a whole `.page-band`.
 */
export function SectionRule({ label }: { label?: string }) {
  if (!label) return <div className="separator" />;
  return (
    <div className="flex items-center gap-4" role="presentation">
      <div className="h-px flex-1" style={{ background: "var(--divider)" }} />
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
        {label}
      </span>
      <div className="h-px flex-1" style={{ background: "var(--divider)" }} />
    </div>
  );
}
