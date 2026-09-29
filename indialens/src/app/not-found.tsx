import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Home, Search, Brain, TrendingUp, Scale } from "lucide-react";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Page not found",
  description: `That page does not exist on ${BRAND.name}.`,
  // A 404 should never be indexed as if it were content.
  robots: { index: false, follow: true },
};

/**
 * 404.
 *
 * This is the page most often reached by ordinary navigation — a stale
 * bookmark, a mistyped URL, a dead link in a shared report — so it is built
 * from the same `page-shell` / `page-title` / `panel` vocabulary as every other
 * route rather than carrying its own visual system.
 *
 * The links below are routes that have working backing data, so a dead end
 * becomes a re-entry point rather than another dead end.
 */
export default function NotFound() {
  return (
    <div className="page-shell">
      <div className="container-xl page-section">
        <div className="max-w-3xl">
          <div className="flex items-baseline gap-3">
            <span className="num text-6xl font-bold tracking-tight t-faint sm:text-7xl">
              404
            </span>
            <span className="kicker-web">Not found</span>
          </div>

          <h1 className="page-title mt-6">
            There is nothing at this address
          </h1>
          <p className="section-lead mt-4">
            The page may have been renamed or removed. Nothing you have saved is
            affected — your analyses and profiles live in your {BRAND.name}{" "}
            account, not in the link.
          </p>

          <div className="mt-8 flex flex-wrap gap-2.5">
            <Link href="/" className="btn-primary">
              <Home size={15} aria-hidden="true" />
              Back to home
            </Link>
            <Link href="/explore" className="btn-secondary">
              <Compass size={15} aria-hidden="true" />
              Browse programmes
            </Link>
          </div>

          <div className="mt-14 border-t pt-8" style={{ borderColor: "var(--divider)" }}>
            <p className="kicker-web mb-4">Try one of these</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  href: "/explore",
                  icon: <Search size={15} />,
                  title: "Programme index",
                  body: "Every programme with live cost, placement and salary data.",
                },
                {
                  href: "/compare",
                  icon: <Scale size={15} />,
                  title: "Compare",
                  body: "Side-by-side benchmark matrix across up to four programmes.",
                },
                {
                  href: "/psychometric",
                  icon: <Brain size={15} />,
                  title: "Psychometric",
                  body: "Adaptive IRT diagnostic that estimates your trait vector.",
                },
                {
                  href: "/methodology",
                  icon: <TrendingUp size={15} />,
                  title: "Methodology",
                  body: "What we model, what we do not, and where the gaps are.",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="card-interactive group flex items-start gap-3"
                >
                  <span
                    className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border t-muted transition-colors"
                    style={{ background: "var(--bg-chip)", borderColor: "var(--border)" }}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold t-text">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-relaxed t-muted">
                      {item.body}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
