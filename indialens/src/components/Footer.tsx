"use client";

import Link from "next/link";
import { ExternalLink, ArrowRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { WaitlistForm } from "@/components/WaitlistForm";
import { openCookieSettings } from "@/lib/consent";
import { BRAND } from "@/lib/brand";

const PLATFORM_LINKS = [
  { href: "/workspace",        label: "Decision Workspace"      },
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
            <h2 className="mt-3 text-[clamp(1.4rem,3vw,1.9rem)] font-bold tracking-tight t-text">
              Get launch pricing before it goes live
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed t-muted">
              The product is free right now, with no card and no cap. Join the
              list and we will send the real prices the moment paid tiers open.
            </p>
            <Link
              href="/pricing"
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:opacity-80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
            >
              See what is free today <ArrowRight size={13} />
            </Link>
          </div>
          <WaitlistForm source="footer" compact />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-7 h-7 rounded-lg t-accent flex items-center justify-center text-white font-bold text-[11px]">
                VE
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[15px] t-text tracking-tight">{BRAND.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-sys-green inline-block animate-pulse" />
              </div>
            </div>
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

        {/* Bottom bar */}
        <div className="t-border-subtle border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-5 text-[11px] t-faint font-mono">
            <span>© 2026 {BRAND.name}. All rights reserved.</span>
            <Link href="/methodology" className="hover:t-text flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded">
              <ExternalLink size={10} aria-hidden="true" /> Epistemic Standard
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono t-faint text-[11px]">Model v4.2-active</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sys-green inline-block animate-pulse" />
              <span className="text-sys-green font-semibold text-[11px] font-mono">Telemetry Live</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
