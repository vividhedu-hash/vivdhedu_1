"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass, Brain, Zap, ShoppingBag, Sparkles,
  Menu, X, UserRound, LogOut, ChevronDown
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

const NAV_LINKS = [
  { href: "/explore",          label: "Explore",      icon: <Compass size={13} />,    desc: "College & program index" },
  { href: "/workspace",        label: "Workspace",    icon: <Zap size={13} />,        desc: "Your decision OS",     highlight: true },
  { href: "/psychometric",     label: "Psychometric", icon: <Brain size={13} />,      desc: "IRT adaptive diagnostic" },
  { href: "/marketplace",      label: "Marketplace",  icon: <ShoppingBag size={13} />,desc: "Matched courses & programs" },
  { href: "/advisor",          label: "AI Mode",      icon: <Sparkles size={13} />,   desc: "Gemini + Search grounding" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // [AI-CoLab: Cursor] Badge was hardcoded to "Live data" even when the DB is
  // unreachable; it now reflects the real data source reported by the stats API.
  const [dataSource, setDataSource] = useState<"database" | "mock" | null>(null);
  const { user, setIsAuthModalOpen, logout } = useAuth();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/colleges/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!cancelled && j?._source) setDataSource(j._source);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-slate-950/95 backdrop-blur-2xl border-b border-white/[0.07] shadow-xl shadow-black/30 py-2"
          : "bg-slate-950/60 backdrop-blur-lg border-b border-white/[0.04] py-3"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10">

          {/* ── Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-7 h-7 rounded-md bg-[#1A6CF6] flex items-center justify-center shadow-lg shadow-blue-700/30 group-hover:shadow-blue-700/50 transition-all">
              <span className="font-black text-white text-xs tracking-tighter leading-none">IL</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-[13px] text-white tracking-tight leading-none">IndiaLens</span>
              <span className="font-mono text-[9px] text-[#1A6CF6] tracking-widest uppercase leading-none mt-0.5">Student OS</span>
            </div>
          </Link>

          {/* ── Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                    active
                      ? "bg-[#1A6CF6]/15 text-[#60A5FA] shadow-inner"
                      : link.highlight
                      ? "text-[#60A5FA] hover:bg-[#1A6CF6]/[0.08] hover:text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {link.icon}
                  {link.label}
                  {link.highlight && !active && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#1A6CF6] animate-pulse" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* ── Right: Live signal + Auth + CTA */}
          <div className="hidden md:flex items-center gap-2">
            {/* Data source badge — reflects the real backing store */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
              <span
                className="pulse-dot"
                style={{
                  width: 5,
                  height: 5,
                  background: dataSource === "database" ? undefined : "#D97706",
                }}
              />
              <span className="font-mono text-slate-400 font-medium">
                {dataSource === "database" ? "Live data" : "Seed index"}
              </span>
            </div>

            {/* Auth */}
            {user && (user.full_name || user.email) ? (
              <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 py-1 px-2 rounded-xl text-xs">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="User" className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#1A6CF6]/20 text-[#60A5FA] flex items-center justify-center font-bold text-[10px]">
                    {user.full_name
                      ? user.full_name.charAt(0).toUpperCase()
                      : user.email
                      ? user.email.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                )}
                <span className="text-slate-200 font-medium max-w-[90px] truncate">
                  {user.full_name || user.email?.split("@")[0] || "User"}
                </span>
                {user.is_premium && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
                    PRO
                  </span>
                )}
                <button
                  onClick={logout}
                  title="Sign out"
                  className="text-slate-500 hover:text-rose-400 p-0.5 transition ml-0.5"
                >
                  <LogOut size={11} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-900/60 border border-slate-800 hover:border-slate-600 font-medium px-2.5 py-1.5 rounded-lg transition"
              >
                <UserRound size={12} className="text-slate-400" />
                Sign in
              </button>
            )}

            <Link
              href="/onboard"
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#1A6CF6] hover:bg-blue-600 rounded-lg shadow-md shadow-blue-800/30 transition-all"
            >
              Start free →
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/98 backdrop-blur-2xl px-5 py-4 space-y-1 animate-slide-down">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                pathname.startsWith(link.href)
                  ? "bg-[#1A6CF6]/15 text-[#60A5FA]"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
              <span className="ml-auto text-xs text-slate-500 font-normal">{link.desc}</span>
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-800">
            <Link
              href="/onboard"
              onClick={() => setMobileOpen(false)}
              className="w-full py-2.5 text-center text-sm font-bold text-white bg-[#1A6CF6] rounded-xl block hover:bg-blue-600 transition"
            >
              Start your OS — Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
