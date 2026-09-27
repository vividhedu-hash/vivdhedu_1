import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Home, Search, Brain, TrendingUp, Scale } from "lucide-react";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Page not found",
  description: "That page does not exist on VividhEdu.",
  // A 404 should never be indexed as if it were content.
  robots: { index: false, follow: true },
};

/**
 * 404.
 *
 * This is the page most often reached by ordinary navigation — a stale bookmark,
 * a mistyped URL, a dead link in a shared report — so it is styled in the light
 * "Student OS" system the landing page, navbar and footer use, rather than the
 * dark "actuarial" system that /explore, /college and /report carry.
 *
 * The links below are the routes that actually have working backing data, so a
 * dead end becomes a re-entry point rather than another dead end.
 */
export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-[#F8FAFC] text-zinc-950">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-6xl sm:text-7xl font-bold tracking-tight text-slate-200">
            404
          </span>
          <span className="kicker-web">Not found</span>
        </div>

        <h1 className="mt-6 text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
          There is nothing at this address
        </h1>
        <p className="mt-3 text-slate-500 text-base leading-relaxed max-w-xl">
          The page may have been renamed or removed. Nothing you have saved is affected — your
          analyses and profiles live in your {BRAND.name} account, not in the link.
        </p>

        <div className="mt-8 flex flex-wrap gap-2.5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl transition"
          >
            <Home size={15} /> Back to home
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-zinc-800 text-sm font-semibold rounded-xl transition"
          >
            <Compass size={15} /> Browse programs
          </Link>
        </div>

        <div className="mt-14 pt-8 border-t border-slate-200">
          <p className="kicker-web mb-4">Try one of these</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                href: "/explore",
                icon: <Search size={15} />,
                title: "Program index",
                body: "Every programme with live cost, placement and salary data.",
              },
              {
                href: "/compare",
                icon: <Scale size={15} />,
                title: "Compare",
                body: "Side-by-side ROI benchmark matrix across up to four programmes.",
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
                className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <span className="mt-0.5 w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-zinc-600 group-hover:bg-zinc-950 group-hover:text-white transition-colors">
                  {item.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-zinc-950">{item.title}</span>
                  <span className="block text-[13px] text-slate-500 mt-0.5 leading-relaxed">
                    {item.body}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
