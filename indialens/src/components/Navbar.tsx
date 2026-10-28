"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass, Brain, Zap, ShoppingBag, Sparkles,
  Menu, X, UserRound, LogOut, Lock, Route, Shield, GraduationCap,
  MoreHorizontal, ChevronDown, Fingerprint, Settings, Sun, Search,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { BRAND } from "@/lib/brand";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Nav model.
 *
 * The bar used to render all nine of these as permanent icon+label links, which
 * needs roughly 1360px — about 400px more than the 960px of content width
 * available at a 1024px viewport. That overage is what made the links wrap onto
 * a second line and pushed the "Get started" CTA off the right edge. Tightening
 * the padding could not fix it; the row was structurally too wide.
 *
 * So each link now carries a `priority` instead: 1–4 are shown permanently, and
 * the rest move into an overflow "More" menu as width falls. The demoted routes
 * are not hidden or downgraded — they keep their icons, their descriptions and
 * their auth locks, and the footer still links every one of them.
 */
type NavLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
  desc: string;
  highlight?: boolean;
  requiresAuth?: boolean;
  priority: number;
};

const NAV_LINKS: NavLink[] = [
  { href: "/explore",      label: "Explore",      icon: <Compass size={13} />,      desc: "College & program index",     priority: 1 },
  { href: "/admissions",   label: "Admissions",   icon: <GraduationCap size={13} />, desc: "Odds from stored cutoffs",    priority: 2 },
  { href: "/workspace",    label: "Workspace",    icon: <Zap size={13} />,          desc: "Your decision OS",            priority: 3, highlight: true, requiresAuth: true },
  { href: "/pricing",      label: "Pricing",      icon: <TagIcon />,               desc: "Free during launch",         priority: 4 },
  { href: "/you",          label: "For You",      icon: <Fingerprint size={13} />, desc: "Your interest graph",        priority: 5 },
  { href: "/marketplace",  label: "Marketplace",  icon: <ShoppingBag size={13} />,  desc: "Matched courses & programs",  priority: 6 },
  { href: "/advisor",      label: "AI Mode",      icon: <Sparkles size={13} />,    desc: "Gemini + Search grounding",   priority: 7 },
  { href: "/psychometric", label: "Psychometric", icon: <Brain size={13} />,        desc: "IRT adaptive diagnostic",     priority: 8, requiresAuth: true },
  { href: "/career-trajectory", label: "Career path", icon: <Route size={13} />,   desc: "Markov state distribution",   priority: 9 },
  { href: "/job-security", label: "Job security", icon: <Shield size={13} />,      desc: "AI exposure by profession",   priority: 10 },
  { href: "/settings",     label: "Settings",     icon: <Settings size={13} />,    desc: "Theme & preferences",         priority: 11 },
];

/** Shown in the bar from `md` up; everything else collapses into "More". */
const PERMANENT_NAV = NAV_LINKS.filter((l) => l.priority <= 4);
const OVERFLOW_NAV = NAV_LINKS.filter((l) => l.priority > 4);

function TagIcon() {
  return <span aria-hidden="true" className="text-[10px] font-bold">₹</span>;
}

export function Navbar() {
  const pathname   = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen]     = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [dataSource, setDataSource] = useState<"database" | "mock" | null>(null);
  const { user, isLoading, setIsAuthModalOpen, logout } = useAuth();

  // Close the overflow menu on Escape or an outside click. Without this it stays
  // open behind the rest of the page, which reads as a stuck menu on desktop.
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMoreOpen(false); };
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest("[data-nav-more]")) setMoreOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [moreOpen]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/colleges/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!cancelled && j?._source) setDataSource(j._source); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (pathname.startsWith("/workspace") || pathname.startsWith("/onboard")) {
    return null;
  }

  // Active state in the "More" dropdown
  const moreIsActive = OVERFLOW_NAV.some((l) => pathname.startsWith(l.href));

  return (
    <nav
      aria-label="Main"
      className={[
        "sticky top-0 z-50 transition-all duration-200 border-b",
        scrolled
          ? "t-border bg-[var(--nav-bg-scrolled)] backdrop-blur-xl shadow-xs"
          : "border-transparent bg-[var(--nav-bg)] backdrop-blur-md",
      ].join(" ")}
    >
      <div className="container-xl">
        <div className="flex items-center justify-between h-14 gap-2">
          {/* ── Left: Brand ── */}
          <Link
            href="/"
            className="flex items-center gap-2 group flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg py-1 px-1.5 -ml-1.5"
          >
            <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center font-bold text-white text-[12px] shadow-xs group-hover:scale-105 transition-transform">
              V
            </div>
            <span className="font-semibold tracking-tight text-[14px] t-text">
              {BRAND.name}
            </span>
            <span className="hidden sm:inline font-mono text-[9px] font-bold uppercase tracking-wider text-accent border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 rounded-full">
              Beta
            </span>
          </Link>

          {/* ── Center: Links (Desktop) ── */}
          <div className="hidden md:flex items-center gap-0.5 min-w-0">
            {PERMANENT_NAV.map((link) => {
              const isActive = pathname.startsWith(link.href);
              const locked = link.requiresAuth && !user && !isLoading;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                    isActive
                      ? "t-chip t-text font-semibold shadow-xs"
                      : "t-muted hover:bg-[var(--bg-hover)] hover:t-text",
                  ].join(" ")}
                >
                  <span className={isActive ? "text-accent" : "t-faint"}>
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                  {locked && (
                    <Lock
                      size={10}
                      className="t-faint"
                      aria-label="Requires sign-in"
                    />
                  )}
                </Link>
              );
            })}

            {/* Overflow "More" menu */}
            {OVERFLOW_NAV.length > 0 && (
              <div className="relative" data-nav-more>
                <button
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  aria-expanded={moreOpen}
                  aria-haspopup="true"
                  className={[
                    "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                    moreIsActive
                      ? "t-chip t-text font-semibold"
                      : "t-muted hover:bg-[var(--bg-hover)] hover:t-text",
                  ].join(" ")}
                >
                  <MoreHorizontal size={14} className={moreIsActive ? "text-accent" : "t-faint"} />
                  <span>More</span>
                  <ChevronDown
                    size={11}
                    className={`t-faint transition-transform duration-150 ${moreOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {moreOpen && (
                  <div
                    role="menu"
                    className="absolute left-0 mt-2 w-64 rounded-xl t-elevated t-border border shadow-lg py-1.5 z-50 animate-slide-down backdrop-blur-xl"
                  >
                    {OVERFLOW_NAV.map((link) => {
                      const isActive = pathname.startsWith(link.href);
                      const locked = link.requiresAuth && !user && !isLoading;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          role="menuitem"
                          onClick={() => setMoreOpen(false)}
                          className={[
                            "flex items-start gap-3 px-3.5 py-2 text-[12px] transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                            isActive
                              ? "bg-[var(--bg-hover)] t-text font-semibold"
                              : "t-muted hover:bg-[var(--bg-hover)] hover:t-text",
                          ].join(" ")}
                        >
                          <span className={`mt-0.5 shrink-0 ${isActive ? "text-accent" : "t-faint"}`}>
                            {link.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium t-text">{link.label}</span>
                              {locked && <Lock size={10} className="t-faint" />}
                            </div>
                            <p className="text-[11px] t-faint truncate font-normal mt-0.5">
                              {link.desc}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Status + Theme + Auth + CTA ── */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full t-chip t-border border text-xs whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-sys-green animate-pulse" />
              <span className="font-mono t-muted text-[11px]">
                {dataSource === "database" ? "Live" : "Calibrated"}
              </span>
            </div>

                        {/* Quick Command Search (Cmd+K) button */}
            <button
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
              }}
              className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-line/10 bg-surface hover:bg-elevated text-ink-2 hover:text-ink text-xs font-mono transition-all cursor-pointer"
              title="Search programs, simulations, or tools (⌘K)"
              aria-label="Search programs and tools"
            >
              <Search size={12} className="text-ink-3" />
              <span className="text-[11px] font-sans">Search</span>
              <kbd className="text-[10px] bg-chip px-1.5 py-0.5 rounded border border-line/10 text-ink-3">⌘K</kbd>
            </button>

            <ThemeToggle />

            {/* Auth */}
            {isLoading ? (
              <div className="h-8 w-24 rounded-lg t-chip t-border border skeleton" aria-hidden />
            ) : user && (user.full_name || user.email) ? (
              <div className="flex items-center gap-1.5 t-chip t-border border py-1 px-2.5 rounded-full text-xs">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full t-accent flex items-center justify-center font-bold text-[10px] text-white">
                    {(user.full_name || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="t-text font-medium max-w-[80px] truncate text-[12px]">
                  {user.full_name || user.email?.split("@")[0] || "User"}
                </span>

                <Link
                  href="/settings"
                  title="Settings & Appearance"
                  aria-label="Settings"
                  className="t-faint hover:text-accent transition ml-0.5 p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
                >
                  <Settings size={12} />
                </Link>

                <button
                  onClick={logout}
                  title="Sign out"
                  aria-label="Sign out"
                  className="t-faint hover:text-accent transition ml-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
                >
                  <LogOut size={11} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 text-[12px] t-text hover:bg-[var(--bg-hover)] t-chip hover:t-elevated t-border border font-medium px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <UserRound size={12} />
                Sign in
              </button>
            )}

            {user ? (
              <Link
                href="/workspace"
                className="btn-accent px-4 py-1.5 text-[13px] shadow-sm transition-all cursor-pointer whitespace-nowrap flex-shrink-0 flex items-center gap-1.5"
              >
                <Zap size={13} className="text-white" />
                Workspace
              </Link>
            ) : (
              <Link
                href="/onboard"
                className="btn-accent px-4 py-1.5 text-[13px] shadow-sm transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
              >
                Get started
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-1.5 t-muted hover:t-text rounded-lg hover:bg-[var(--bg-hover)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div id="mobile-nav" className="md:hidden t-border border-t t-elevated backdrop-blur-2xl px-5 py-4 space-y-1 animate-slide-down">
          {/* Mobile Theme Switcher */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl t-chip t-border border mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold t-text">
              <Sun size={14} className="text-amber-500" />
              <span>Theme & Appearance</span>
            </div>
                        {/* Quick Command Search (Cmd+K) button */}
            <button
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
              }}
              className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-line/10 bg-surface hover:bg-elevated text-ink-2 hover:text-ink text-xs font-mono transition-all cursor-pointer"
              title="Search programs, simulations, or tools (⌘K)"
              aria-label="Search programs and tools"
            >
              <Search size={12} className="text-ink-3" />
              <span className="text-[11px] font-sans">Search</span>
              <kbd className="text-[10px] bg-chip px-1.5 py-0.5 rounded border border-line/10 text-ink-3">⌘K</kbd>
            </button>

            <ThemeToggle />
          </div>

          {NAV_LINKS.map((link) => {
            const locked = link.requiresAuth && !user && !isLoading;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={[
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                  pathname.startsWith(link.href)
                    ? "t-chip t-text font-semibold"
                    : "t-muted hover:bg-[var(--bg-hover)] hover:t-text",
                ].join(" ")}
              >
                {link.icon}
                <span>{link.label}</span>
                {locked && <Lock size={12} className="t-faint" />}
                <span className="ml-auto text-[11px] t-faint font-normal">{link.desc}</span>
              </Link>
            );
          })}
          <div className="pt-3 t-border border-t space-y-2">
            {user ? (
              <button
                onClick={() => { setMobileOpen(false); logout(); }}
                className="w-full py-2.5 text-center text-sm font-semibold t-text t-chip hover:t-elevated rounded-xl flex items-center justify-center gap-2"
              >
                <LogOut size={14} /> Sign out
              </button>
            ) : (
              <button
                onClick={() => { setMobileOpen(false); setIsAuthModalOpen(true); }}
                className="w-full py-2.5 text-center text-sm font-semibold t-text t-chip hover:t-elevated t-border border rounded-xl flex items-center justify-center gap-2"
              >
                <UserRound size={14} /> Sign in
              </button>
            )}
            {user ? (
              <Link
                href="/workspace"
                onClick={() => setMobileOpen(false)}
                className="btn-accent w-full py-2.5 text-sm font-bold block transition text-center"
              >
                Open Workspace
              </Link>
            ) : (
              <Link
                href="/onboard"
                onClick={() => setMobileOpen(false)}
                className="btn-accent w-full py-2.5 text-sm font-bold block transition text-center"
              >
                Start free — run my analysis
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
