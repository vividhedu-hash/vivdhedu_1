"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass, Brain, Zap, ShoppingBag, Sparkles,
  Menu, X, UserRound, LogOut, Lock, Route, Shield, GraduationCap,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { BRAND } from "@/lib/brand";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV_LINKS = [
  { href: "/explore",      label: "Explore",      icon: <Compass size={13} />,     desc: "College & program index"   },
  { href: "/admissions",   label: "Admissions",   icon: <GraduationCap size={13} />, desc: "Odds from stored cutoffs" },
  { href: "/workspace",    label: "Workspace",    icon: <Zap size={13} />,         desc: "Your decision OS",         highlight: true, requiresAuth: true },
  { href: "/psychometric", label: "Psychometric", icon: <Brain size={13} />,       desc: "IRT adaptive diagnostic",   requiresAuth: true },
  { href: "/marketplace",  label: "Marketplace",  icon: <ShoppingBag size={13} />, desc: "Matched courses & programs" },
  { href: "/advisor",      label: "AI Mode",      icon: <Sparkles size={13} />,    desc: "Gemini + Search grounding" },
  { href: "/career-trajectory", label: "Career path", icon: <Route size={13} />, desc: "Markov state distribution" },
  { href: "/job-security", label: "Job security", icon: <Shield size={13} />, desc: "AI exposure by profession" },
  { href: "/pricing",      label: "Pricing",      icon: <TagIcon />,              desc: "Free during launch"        },
];

function TagIcon() {
  return <span aria-hidden="true" className="text-[10px] font-bold">₹</span>;
}

export function Navbar() {
  const pathname   = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [dataSource, setDataSource] = useState<"database" | "mock" | null>(null);
  const { user, isLoading, setIsAuthModalOpen, logout } = useAuth();

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
        <div className="flex items-center justify-between h-10">

          {/* ── Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-7 h-7 rounded-lg t-accent flex items-center justify-center">
              <span className="font-bold text-white text-[11px] tracking-tight">VE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[14px] t-text tracking-tight">{BRAND.name}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-sys-green inline-block animate-pulse" />
            </div>
          </Link>

          {/* ── Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => {
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
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all",
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
          </div>

          {/* ── Right: Status + Theme + Auth + CTA */}
          <div className="hidden md:flex items-center gap-2">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full t-chip t-border border text-xs">
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
                className="flex items-center gap-1.5 text-[12px] t-text hover:bg-[var(--bg-hover)] t-chip hover:t-elevated t-border border font-medium px-3 py-1.5 rounded-lg transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <UserRound size={12} />
                Sign in
              </button>
            )}

            <Link
              href="/onboard"
              className="btn-accent px-4 py-1.5 text-[13px] shadow-sm transition-all cursor-pointer"
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
