"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { usePathname } from "next/navigation";

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

const DATA_SOURCES = ["NIRF", "AmbitionBox", "PLFS / MoSPI", "World Bank ICP", "CMIE", "Reddit API"];

export function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/workspace") || pathname.startsWith("/onboard")) {
    return null;
  }

  return (
    <footer className="border-t border-white/[0.06] bg-black py-14 mt-16">
      <div className="container-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-7 h-7 rounded-lg bg-[#E11D48] flex items-center justify-center text-white font-bold text-xs">
                IL
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[15px] text-[#F5F5F7] tracking-tight">IndiaLens</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] inline-block animate-pulse" />
              </div>
            </div>
            <p className="text-[#86868B] text-[13px] leading-relaxed max-w-xs">
              The sovereign educational operating system. Pricing degrees as capital assets,
              evaluating AI labor displacement, and engineering verified admissions spikes.
            </p>
            <p className="mt-3 text-[11px] font-mono text-[#48484A]">
              Zero agency kickbacks · Fiduciary alignment · Open methodology
            </p>
          </div>

          {/* Platform */}
          <div>
            <p className="text-[10px] font-mono font-bold text-[#48484A] uppercase tracking-wider mb-5">
              Platform
            </p>
            <div className="flex flex-col gap-2.5">
              {PLATFORM_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[13px] text-[#86868B] hover:text-[#F5F5F7] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Data sources */}
          <div>
            <p className="text-[10px] font-mono font-bold text-[#48484A] uppercase tracking-wider mb-5">
              Data Sources
            </p>
            <div className="flex flex-col gap-2.5">
              {DATA_SOURCES.map((src) => (
                <span key={src} className="text-[13px] text-[#86868B]">{src}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-5 text-[11px] text-[#48484A] font-mono">
            <span>© 2026 IndiaLens · Student OS. All rights reserved.</span>
            <Link href="/methodology" className="hover:text-[#86868B] flex items-center gap-1 transition-colors">
              <ExternalLink size={10} /> Epistemic Standard
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[#48484A] text-[11px]">Model v4.2-active</span>
            <div className="flex items-center gap-1.5">
              <span className="pulse-dot" />
              <span className="text-[#30D158] font-semibold text-[11px] font-mono">Telemetry Live</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
