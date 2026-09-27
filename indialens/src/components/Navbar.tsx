"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass, Brain, Zap, ShoppingBag, Sparkles,
  Menu, X, UserRound, LogOut, Tag, Lock, Route, Shield, GraduationCap,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { BRAND } from "@/lib/brand";

const NAV_LINKS = [
  { href: "/explore",      label: "Explore",      icon: <Compass size={13} />,     desc: "College & program index"   },
  { href: "/admissions",   label: "Admissions",   icon: <GraduationCap size={13} />, desc: "Odds from stored cutoffs" },
  { href: "/workspace",    label: "Workspace",    icon: <Zap size={13} />,         desc: "Your decision OS",         highlight: true, requiresAuth: true },
  { href: "/psychometric", label: "Psychometric", icon: <Brain size={13} />,       desc: "IRT adaptive diagnostic",   requiresAuth: true },
  { href: "/marketplace",  label: "Marketplace",  icon: <ShoppingBag size={13} />, desc: "Matched courses & programs" },
  { href: "/advisor",      label: "AI Mode",      icon: <Sparkles size={13} />,    desc: "Gemini + Search grounding" },
  { href: "/career-trajectory", label: "Career path", icon: <Route size={13} />, desc: "Markov state distribution" },
  { href: "/job-security", label: "Job security", icon: <Shield size={13} />, desc: "AI exposure by profession" },
  { href: "/pricing",      label: "Pricing",      icon: <Tag size={13} />,         desc: "Free during launch"        },
];

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-slate-200/90 py-2 shadow-xs"
          : "bg-white/80 backdrop-blur-md border-b border-slate-200/70 py-2.5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10">

          {/* ── Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center shadow-xs">
              <span className="font-bold text-white text-[11px] tracking-tight">VE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[14px] text-zinc-900 tracking-tight">{BRAND.name}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                    active
                      ? "bg-slate-100 text-zinc-950 font-semibold"
                      : "text-zinc-600 hover:text-zinc-950 hover:bg-slate-100/70"
                  } ${link.highlight && !active ? "text-rose-600 hover:text-rose-700" : ""}`}
                  title={locked ? `Sign in to open ${link.label}` : link.desc}
                >
                  {link.icon}
                  {link.label}
                  {locked && <Lock size={10} className="text-zinc-400" />}
                </Link>
              );
            })}
          </div>

          {/* ── Right: Status + Auth + CTA */}
          <div className="hidden md:flex items-center gap-2">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-zinc-600 text-[11px]">
                {dataSource === "database" ? "Live" : "Calibrated"}
              </span>
            </div>

            {/* Auth.
                While the Supabase session is still hydrating the control renders
                a neutral placeholder rather than "Sign in": a signed-in user
                would otherwise watch the navbar flip to signed-out and back on
                every full page load. */}
            {isLoading ? (
              <div className="h-8 w-24 rounded-lg bg-slate-100 border border-slate-200 animate-pulse" aria-hidden />
            ) : user && (user.full_name || user.email) ? (
              <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 py-1 px-2.5 rounded-full text-xs">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="User" className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center font-bold text-[10px]">
                    {(user.full_name || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-zinc-900 font-medium max-w-[80px] truncate text-[12px]">
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
                  className="text-zinc-400 hover:text-rose-600 transition ml-0.5"
                >
                  <LogOut size={11} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 text-[12px] text-zinc-700 hover:text-zinc-950 bg-slate-100 hover:bg-slate-200 border border-slate-200 font-medium px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                <UserRound size={12} />
                Sign in
              </button>
            )}

            <Link
              href="/onboard"
              className="px-4 py-1.5 text-[13px] font-semibold text-white bg-black hover:bg-zinc-800 active:scale-[0.98] rounded-lg shadow-xs transition-all cursor-pointer"
            >
              Get started
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-1.5 text-zinc-600 hover:text-zinc-950 rounded-lg hover:bg-slate-100 transition"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/98 backdrop-blur-2xl px-5 py-4 space-y-1 animate-slide-down">
          {NAV_LINKS.map((link) => {
            const locked = link.requiresAuth && !user && !isLoading;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  pathname.startsWith(link.href)
                    ? "bg-slate-100 text-zinc-950 font-semibold"
                    : "text-zinc-600 hover:bg-slate-50 hover:text-zinc-950"
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
                {locked && <Lock size={12} className="text-zinc-400" />}
                <span className="ml-auto text-[11px] text-zinc-400 font-normal">{link.desc}</span>
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            {user ? (
              <button
                onClick={() => { setMobileOpen(false); logout(); }}
                className="w-full py-2.5 text-center text-sm font-semibold text-zinc-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-2"
              >
                <LogOut size={14} /> Sign out
              </button>
            ) : (
              // The desktop navbar hides its auth control below `md`, so the
              // drawer is the only sign-in affordance on a phone. Without this
              // there was no way to sign in at all on mobile.
              <button
                onClick={() => { setMobileOpen(false); setIsAuthModalOpen(true); }}
                className="w-full py-2.5 text-center text-sm font-semibold text-zinc-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl flex items-center justify-center gap-2"
              >
                <UserRound size={14} /> Sign in
              </button>
            )}
            <Link
              href="/onboard"
              onClick={() => setMobileOpen(false)}
              className="w-full py-2.5 text-center text-sm font-bold text-white bg-black rounded-xl block hover:bg-zinc-800 transition"
            >
              Start free — run my analysis
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
