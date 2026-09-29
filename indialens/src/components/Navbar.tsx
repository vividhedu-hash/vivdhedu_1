"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass, Brain, Zap, ShoppingBag, Sparkles,
  Menu, X, UserRound, LogOut, Lock, Route, Shield, GraduationCap,
  MoreHorizontal, ChevronDown,
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
  { href: "/marketplace",  label: "Marketplace",  icon: <ShoppingBag size={13} />,  desc: "Matched courses & programs",  priority: 5 },
  { href: "/advisor",      label: "AI Mode",      icon: <Sparkles size={13} />,    desc: "Gemini + Search grounding",   priority: 6 },
  { href: "/psychometric", label: "Psychometric", icon: <Brain size={13} />,        desc: "IRT adaptive diagnostic",     priority: 7, requiresAuth: true },
  { href: "/career-trajectory", label: "Career path", icon: <Route size={13} />,   desc: "Markov state distribution",   priority: 8 },
  { href: "/job-security", label: "Job security", icon: <Shield size={13} />,      desc: "AI exposure by profession",   priority: 9 },
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

  return (
    <nav
      className={[
        "fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl transition-all duration-300",
        scrolled
          ? "t-border t-elevated border-b shadow-md"
          : "border-line/10 t-elevated/80",
        "py-2.5",
      ].join(" ")}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        {/*
          `min-w-0` + `whitespace-nowrap` on every cluster is what actually stops
          the wrap. The row is a flex container with three children; without a
          shrinkable middle cluster the links keep their intrinsic width, overflow
          the 960px content box at 1024px, and wrap — which is what pushed the CTA
          off the right edge. Nothing here may wrap onto a second line.
        */}
        <div className="flex items-center justify-between gap-3 h-11">

          {/* ── Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0 whitespace-nowrap">
            <div className="w-7 h-7 rounded-lg t-accent flex items-center justify-center">
              <span className="font-bold text-white text-[11px] tracking-tight">VE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[14px] t-text tracking-tight">{BRAND.name}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-sys-green inline-block animate-pulse" />
            </div>
          </Link>

          {/* ── Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5 min-w-0 justify-center">
            {PERMANENT_NAV.map((link) => {
              const active = pathname.startsWith(link.href);
              // Routes behind `AuthGate` advertise that up front rather than
              // letting the click dead-end on a sign-in wall. The lock is a
              // visual cue only — the guard on the page is what enforces it.
              const locked = link.requiresAuth && !user && !isLoading;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]",
                    active
                      ? "t-chip t-text font-semibold"
                      : "t-muted hover:t-text hover:bg-[var(--bg-hover)]",
                    link.highlight && !active ? "text-accent hover:opacity-80" : "",
                  ].join(" ")}
                  title={locked ? `Sign in to open ${link.label}` : link.desc}
                >
                  {link.icon}
                  {link.label}
                  {locked && <Lock size={10} className="t-faint" />}
                </Link>
              );
            })}

            {/* Overflow. The five lower-priority routes live here instead of
                permanently competing for width in a 56px bar. The button only
                appears when something is actually in the menu, and it carries a
                visible count-free dot state when one of its routes is the page
                you are on, so the menu is never a dead end. */}
            {OVERFLOW_NAV.length > 0 && (
              <div className="relative flex-shrink-0" data-nav-more>
                <button
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  aria-expanded={moreOpen}
                  aria-haspopup="true"
                  aria-label="More pages"
                  className={[
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]",
                    moreOpen || OVERFLOW_NAV.some((l) => pathname.startsWith(l.href))
                      ? "t-chip t-text font-semibold"
                      : "t-muted hover:t-text hover:bg-[var(--bg-hover)]",
                  ].join(" ")}
                >
                  <MoreHorizontal size={13} />
                  More
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {moreOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-60 t-border border t-elevated rounded-xl shadow-lg p-1.5 animate-slide-down">
                    {OVERFLOW_NAV.map((link) => {
                      const active = pathname.startsWith(link.href);
                      const locked = link.requiresAuth && !user && !isLoading;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMoreOpen(false)}
                          className={[
                            "flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                            active ? "t-chip" : "hover:bg-[var(--bg-hover)]",
                          ].join(" ")}
                        >
                          <span className={active ? "t-accent" : "t-muted"}>{link.icon}</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 text-[13px] font-medium t-text">
                              {link.label}
                              {locked && <Lock size={10} className="t-faint" />}
                            </span>
                            <span className="block text-[11px] t-muted truncate">
                              {locked ? `Sign in to open ${link.label}` : link.desc}
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Status + Theme + Auth + CTA
              `flex-shrink-0` + `whitespace-nowrap` here as well: "Sign in" and
              "Get started" were both wrapping to two lines and the CTA was being
              clipped, because this cluster could shrink and the CTA could not. */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full t-chip t-border border text-xs whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-sys-green animate-pulse" />
              <span className="font-mono t-muted text-[11px]">
                {dataSource === "database" ? "Live" : "Calibrated"}
              </span>
            </div>

            <ThemeToggle />

            {/* Auth.
                While the Supabase session is still hydrating the control renders
                a neutral placeholder rather than "Sign in": a signed-in user
                would otherwise watch the navbar flip to signed-out and back on
                every full page load. */}
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
                {/*
                  No PRO badge here. Entitlement used to be read from Supabase
                  `user_metadata`, which the account holder can write themselves,
                  so anyone could grant themselves the badge by editing their own
                  profile. Nothing in the product gates a feature on premium yet,
                  so the honest state is to show no entitlement at all rather than
                  show one we cannot verify. This renders again only when
                  entitlement is served from a server-owned source.
                */}
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

            <Link
              href="/onboard"
              className="btn-accent px-4 py-1.5 text-[13px] shadow-sm transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
            >
              Get started
            </Link>
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
              // The desktop navbar hides its auth control below `md`, so the
              // drawer is the only sign-in affordance on a phone. Without this
              // there was no way to sign in at all on mobile.
              <button
                onClick={() => { setMobileOpen(false); setIsAuthModalOpen(true); }}
                className="w-full py-2.5 text-center text-sm font-semibold t-text t-chip hover:t-elevated t-border border rounded-xl flex items-center justify-center gap-2"
              >
                <UserRound size={14} /> Sign in
              </button>
            )}
            <Link
              href="/onboard"
              onClick={() => setMobileOpen(false)}
              className="btn-accent w-full py-2.5 text-sm font-bold block transition"
            >
              Start free — run my analysis
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
