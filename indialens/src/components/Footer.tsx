"use client";

import Link from "next/link";
import { ExternalLink, ArrowRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { WaitlistForm } from "@/components/WaitlistForm";
import { openCookieSettings } from "@/lib/consent";
import { BRAND } from "@/lib/brand";

const PLATFORM_LINKS = [
  { href: "/workspace",        label: "Decision Workspace"      },
  { href: "/settings",         label: "Settings & Appearance"   },
  { href: "/you",              label: "For You graph"           },
  { href: "/onboard",          label: "Calibration Onboarding"  },
  { href: "/explore",          label: "Program Asset Index"      },
  { href: "/psychometric",     label: "3PL IRT Assessment"       },
  { href: "/portfolio-builder",label: "Flagship Portfolio Studio"},
  { href: "/marketplace",      label: "Course Marketplace"       },
  { href: "/global",           label: "Global Degree Valuation"  },
  { href: "/advisor",          label: "AI Mode & Search Grounding"},
  { href: "/methodology",      label: "Epistemic Methodology"    },
];

const COMPANY_LINKS = [
  { href: "/pricing", label: "Pricing" },
  { href: "/about",   label: "About"   },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookies" },
  { href: "/terms",   label: "Terms"   },
];

const DATA_SOURCES = ["NIRF", "AmbitionBox", "PLFS / MoSPI", "World Bank ICP", "CMIE", "Reddit API"];

export function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/workspace") || pathname.startsWith("/onboard")) {
    return null;
  }

  return (
    <footer className="t-border border-t t-surface py-14 mt-16 t-muted">
      <div className="container-xl">
        {/* ── Waitlist CTA ─────────────────────────────────────────── */}
        <div className="mb-12 grid gap-6 rounded-2xl t-border border t-bg p-6 sm:p-7 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-accent">
              <span className="h-[1.5px] w-2.5 bg-accent" />
              Free during launch
            </p>
            <h3 className="mt-2 text-xl font-bold tracking-tight t-text">
              Run your degree through the decision engine.
            </h3>
            <p className="mt-1.5 text-[13px] t-muted leading-relaxed">
              Full access to NPV calculations, debt stress modeling, and AI
              displacement scoring. No payment required during our public launch.
            </p>
          </div>
          <WaitlistForm />
        </div>

        {/* ── Link Columns ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 pb-12 border-b t-divider">
          {/* Brand block */}
          <div className="md:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 mb-4 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
            >
              <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center font-bold text-white text-[12px] group-hover:scale-105 transition-transform">
                V
              </div>
              <span className="font-semibold text-base t-text">
                {BRAND.name}
              </span>
            </Link>
            <p className="t-muted text-[13px] leading-relaxed max-w-xs">
              {BRAND.tagline} Degrees valued as capital assets, AI displacement
              scored, and admissions engineered on published methodology.
            </p>
            <p className="mt-3 text-[11px] font-mono t-faint">
              No pay-to-rank · Open methodology · Not financial advice
            </p>
          </div>

          {/* Platform */}
          <nav aria-label="Platform">
            <p className="text-[10px] font-mono font-bold t-faint uppercase tracking-wider mb-5">
              Platform
            </p>
            <div className="flex flex-col gap-2.5">
              {PLATFORM_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[13px] t-muted hover:t-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>

          {/* Company + data sources */}
          <nav aria-label="Company">
            <p className="text-[10px] font-mono font-bold t-faint uppercase tracking-wider mb-5">
              Company
            </p>
            <div className="flex flex-col gap-2.5">
              {COMPANY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[13px] t-muted hover:t-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => openCookieSettings()}
                className="text-left text-[13px] t-muted hover:t-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
              >
                Cookie settings
              </button>
            </div>

            <p className="text-[10px] font-mono font-bold t-faint uppercase tracking-wider mt-7 mb-4">
              Data Sources
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {DATA_SOURCES.map((src) => (
                <span key={src} className="text-[12px] t-muted">{src}</span>
              ))}
            </div>
          </nav>
        </div>

        {/* ── Sub-footer ───────────────────────────────────────────── */}
        <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[12px] t-faint font-mono">
          <p>© {new Date().getFullYear()} {BRAND.legalEntity}. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>Operated under {BRAND.governingLaw}</span>
            <span aria-hidden="true">·</span>
            <Link
              href="/privacy"
              className="hover:t-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
            >
              DPDP compliant
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href="/terms"
              className="hover:t-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
