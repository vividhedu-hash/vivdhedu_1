"use client";

import Link from "next/link";
import { Zap, ExternalLink } from "lucide-react";
import { POSITIONING } from "../lib/positioning";

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid #1E1E2E",
        background: "#0A0A0F",
        padding: "48px 0 32px",
        marginTop: 96,
      }}
    >
      <div className="container-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: "#1A6CF6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 12,
                  color: "#FFFFFF",
                }}
              >
                IL
              </div>
              <span
                className="font-display font-bold"
                style={{ fontSize: 18, color: "#F0F0F5" }}
              >
                IndiaLens <span style={{ color: "#1A6CF6", fontSize: 13, fontFamily: "var(--font-mono)" }}>· Student OS</span>
              </span>
            </div>
            <p style={{ color: "#8B8BA7", fontSize: 13, lineHeight: 1.7, maxWidth: 360 }}>
              The sovereign educational operating system. Pricing degrees as capital assets, evaluating AI labor displacement, and engineering verified admissions spikes.
            </p>
            <p
              className="mt-3 text-xs font-mono"
              style={{ color: "#4A4A6A" }}
            >
              Zero agency kickbacks · Fiduciary alignment · Open methodology
            </p>
          </div>

          {/* Platform */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-4"
              style={{ color: "#4A4A6A", letterSpacing: "0.08em" }}
            >
              Platform
            </p>
            <div className="flex flex-col gap-2">
              {[
                { href: "/workspace", label: "Decision Workspace" },
                { href: "/onboard", label: "Calibration Onboarding" },
                { href: "/explore", label: "Program Asset Index" },
                { href: "/psychometric", label: "3PL IRT Assessment" },
                { href: "/portfolio-builder", label: "Flagship Portfolio Studio" },
                { href: "/marketplace", label: "Course Marketplace" },
                { href: "/global", label: "Global Degree Valuation" },
                { href: "/advisor", label: "AI Mode & Search Grounding" },
                { href: "/methodology", label: "Epistemic Methodology" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    color: "#8B8BA7",
                    fontSize: 13,
                    textDecoration: "none",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "#F0F0F5")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "#8B8BA7")
                  }
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Data sources */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-4"
              style={{ color: "#4A4A6A", letterSpacing: "0.08em" }}
            >
              Data Sources
            </p>
            <div className="flex flex-col gap-2">
              {["NIRF", "AmbitionBox", "PLFS / MoSPI", "World Bank ICP", "CMIE", "Reddit API"].map(
                (src) => (
                  <span key={src} style={{ color: "#8B8BA7", fontSize: 13 }}>
                    {src}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid #1E1E2E",
            paddingTop: 24,
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div className="flex flex-wrap items-center gap-4">
            <span style={{ color: "#4A4A6A", fontSize: 12 }}>
              © 2026 IndiaLens. Sovereign Student Operating System.
            </span>
            <Link
              href="/methodology"
              style={{
                color: "#4A4A6A",
                fontSize: 12,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <ExternalLink size={10} />
              Cite this index
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-mono"
              style={{ color: "#4A4A6A" }}
            >
              Model v1.0-seed
            </span>
            <div className="flex items-center gap-1.5">
              <span className="pulse-dot" />
              <span style={{ color: "#22C55E", fontSize: 11, fontWeight: 600 }}>
                Live
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
