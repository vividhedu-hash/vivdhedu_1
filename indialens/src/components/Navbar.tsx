"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Search, Zap, BookOpen, Shield, Menu, X, Sparkles, Scale, Compass, Globe, ShoppingBag, Brain, UserRound, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

const NAV_LINKS = [
  { href: "/explore", label: "Colleges", icon: <Compass size={14} /> },
  { href: "/analyze", label: "Price it", icon: <Search size={14} /> },
  { href: "/psychometric", label: "Psychometric", icon: <Brain size={14} className="text-violet-400" /> },
  { href: "/global", label: "Global", icon: <Globe size={14} /> },
  { href: "/portfolio-builder", label: "Spike Studio", icon: <Sparkles size={14} className="text-amber-400" /> },
  { href: "/marketplace", label: "Marketplace", icon: <ShoppingBag size={14} /> },
  { href: "/advisor", label: "AI Mode", icon: <Sparkles size={14} className="text-emerald-400" /> },
  { href: "/compare", label: "Compare", icon: <Scale size={14} /> },
  { href: "/methodology", label: "Methodology", icon: <BookOpen size={14} /> },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, setIsAuthModalOpen, logout } = useAuth();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-slate-950/90 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl py-2.5"
          : "bg-slate-950/40 backdrop-blur-md border-b border-white/[0.04] py-3.5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-11">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#002F6C] border border-[#0077C8]/40 flex items-center justify-center shadow-lg shadow-blue-900/20 group-hover:border-[#0077C8] transition-all">
              <Zap size={16} className="text-[#0077C8]" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">
              The <span className="text-[#0077C8]">Project</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-white/[0.06]">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* CTA + User Auth + Admin */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium px-2 py-1"
            >
              <Shield size={13} className="text-slate-500" />
              Admin
            </Link>

            {user ? (
              <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 py-1 px-2.5 rounded-xl text-xs">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="User" className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#002F6C] text-[#0077C8] flex items-center justify-center font-bold text-[10px]">
                    {user.full_name ? user.full_name.charAt(0) : user.email.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-slate-200 font-medium max-w-[100px] truncate">
                  {user.full_name || user.email.split("@")[0]}
                </span>
                {user.is_premium && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    PRO
                  </span>
                )}
                <button
                  onClick={logout}
                  title="Sign out"
                  className="text-slate-500 hover:text-rose-400 p-0.5 transition"
                >
                  <LogOut size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-900/80 border border-slate-800 hover:border-slate-700 font-semibold px-3 py-1.5 rounded-xl transition"
              >
                <UserRound size={13} className="text-[#0077C8]" />
                Sign in
              </button>
            )}

            <Link
              href="/analyze"
              className="px-4 py-2 text-xs font-bold text-white bg-[#0077C8] hover:bg-[#0077C8]/90 rounded-xl shadow-lg shadow-blue-900/20 transition-all"
            >
              Price my degree
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-950/95 backdrop-blur-2xl border-b border-slate-800 px-6 py-4 space-y-2 mt-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold ${
                pathname === link.href ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-900"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          <Link
            href="/analyze"
            onClick={() => setMobileOpen(false)}
            className="w-full mt-3 py-2.5 text-center text-xs font-bold text-slate-950 bg-emerald-400 rounded-xl block"
          >
            Get my report
          </Link>
        </div>
      )}
    </nav>
  );
}
