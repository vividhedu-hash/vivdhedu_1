"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sun,
  Moon,
  Laptop,
  Sliders,
  Shield,
  Fingerprint,
  Database,
  Sparkles,
  RefreshCw,
  Check,
  ExternalLink,
  Lock,
  LogOut,
  UserRound,
  Zap,
  BarChart3,
  Eye,
  Trash2,
  ChevronRight,
  Info,
  Layers,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Notice } from "@/components/Notice";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme, ThemeChoice } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { usePersonMemory } from "@/lib/person-memory-context";
import { openCookieSettings, functionalAllowed } from "@/lib/consent";
import { BRAND } from "@/lib/brand";
import { THEME_KEY } from "@/lib/session-policy";

type SettingsTab = "appearance" | "engine" | "privacy" | "account";

export default function SettingsPage() {
  const { choice, active, setTheme, isDark } = useTheme();
  const { user, logout, setIsAuthModalOpen } = useAuth();
  const { state, reset: resetPersonMemory } = usePersonMemory();

  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");

  // Local preferences state
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [npvHorizon, setNpvHorizon] = useState<"10yr" | "20yr">("20yr");
  const [riskThreshold, setRiskThreshold] = useState<"p10" | "p25">("p10");
  const [aiGrounding, setAiGrounding] = useState<boolean>(true);
  const [compactDensity, setCompactDensity] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Storage diagnosis
  const [storageKeysCount, setStorageKeysCount] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        setStorageKeysCount(window.localStorage.length);
        const savedCurrency = window.localStorage.getItem("vividhedu_pref_currency");
        if (savedCurrency === "USD" || savedCurrency === "INR") setCurrency(savedCurrency);
        const savedHorizon = window.localStorage.getItem("vividhedu_pref_horizon");
        if (savedHorizon === "10yr" || savedHorizon === "20yr") setNpvHorizon(savedHorizon);
        const savedDensity = window.localStorage.getItem("vividhedu_pref_density");
        if (savedDensity === "compact") setCompactDensity(true);
      } catch {}
    }
  }, []);

  const savePreference = (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value);
      setSavedNotice("Preference saved to browser storage.");
      setTimeout(() => setSavedNotice(null), 2500);
    } catch {}
  };

  const handleClearCache = () => {
    if (typeof window === "undefined") return;
    if (window.confirm("Clear all local cached calculations and preferences? This will not sign you out.")) {
      try {
        const preserveAuth = window.localStorage.getItem("theproject_auth_token");
        const preserveConsent = window.localStorage.getItem("vividhedu_consent");
        window.localStorage.clear();
        if (preserveAuth) window.localStorage.setItem("theproject_auth_token", preserveAuth);
        if (preserveConsent) window.localStorage.setItem("vividhedu_consent", preserveConsent);
        window.localStorage.setItem(THEME_KEY, choice);
        setStorageKeysCount(window.localStorage.length);
        setSavedNotice("Local cache cleared successfully.");
        setTimeout(() => setSavedNotice(null), 3000);
      } catch {}
    }
  };

  return (
    <div className="page-shell">
      {/* Top Header */}
      <div className="container-xl page-header">
        <div className="flex items-center gap-2 text-xs t-muted mb-3 font-mono">
          <Link href="/" className="hover:text-accent transition-colors">
            {BRAND.name}
          </Link>
          <span className="t-faint">/</span>
          <span className="t-text font-semibold">Settings</span>
        </div>

        <PageHeader
          kicker="System Preferences"
          eyebrow={
            <span className="badge badge-teal">
              <Sliders size={11} aria-hidden="true" />
              Configuration & Terminal Controls
            </span>
          }
          title="Settings & Preferences"
          lead="Configure display themes, dark mode aesthetics, actuarial modeling assumptions, epistemic thresholds, and data retention rules."
        />
      </div>

      <div className="container-xl pb-20">
        {savedNotice && (
          <div className="mb-6 animate-fadeIn">
            <Notice tone="ok">{savedNotice}</Notice>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Navigation Sidebar */}
          <aside className="space-y-1">
            {[
              {
                id: "appearance" as const,
                label: "Appearance & Theme",
                icon: <Sun size={15} />,
                badge: isDark ? "Dark active" : "Light active",
              },
              {
                id: "engine" as const,
                label: "Decision Engine",
                icon: <Zap size={15} />,
                badge: "Priors",
              },
              {
                id: "privacy" as const,
                label: "Privacy & Storage",
                icon: <Shield size={15} />,
                badge: functionalAllowed() ? "Allowed" : "Restricted",
              },
              {
                id: "account" as const,
                label: "Account & Session",
                icon: <UserRound size={15} />,
                badge: user ? "Signed in" : "Guest",
              },
            ].map((item) => {
              const activeItem = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                    activeItem
                      ? "bg-accent text-white font-semibold shadow-sm"
                      : "t-muted hover:t-text hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={activeItem ? "text-white" : "t-faint"}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                      activeItem ? "bg-white/20 text-white" : "t-chip t-faint"
                    }`}
                  >
                    {item.badge}
                  </span>
                </button>
              );
            })}

            <div className="pt-6 mt-6 border-t t-border-subtle space-y-2">
              <Link
                href="/workspace"
                className="flex items-center justify-between px-3 py-2 text-xs t-muted hover:t-text rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Zap size={13} className="text-accent" />
                  <span>Go to Workspace</span>
                </span>
                <ChevronRight size={13} className="t-faint" />
              </Link>
              <Link
                href="/methodology"
                className="flex items-center justify-between px-3 py-2 text-xs t-muted hover:t-text rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Info size={13} className="t-faint" />
                  <span>Model Documentation</span>
                </span>
                <ExternalLink size={12} className="t-faint" />
              </Link>
            </div>
          </aside>

          {/* Main Settings Panel */}
          <main className="space-y-8 min-w-0">
            {/* ── 1. APPEARANCE & THEME TAB ── */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <section className="panel">
                  <div className="panel-head flex items-center justify-between">
                    <div>
                      <span className="panel-title">Interface Color Theme</span>
                      <p className="text-xs t-muted mt-0.5">
                        Choose between daylight clarity, OLED black terminal styling, or automatic system matching.
                      </p>
                    </div>
                    <ThemeToggle />
                  </div>

                  <div className="panel-pad space-y-6">
                    {/* Visual 3-way Theme Chooser */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {/* Light Card */}
                      <button
                        type="button"
                        onClick={() => setTheme("light")}
                        className={`p-4 rounded-xl border text-left transition-all relative ${
                          choice === "light"
                            ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30 bg-surface shadow-sm"
                            : "t-border hover:border-slate-400 bg-surface/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                            <Sun size={17} />
                          </div>
                          {choice === "light" && (
                            <span className="badge badge-rose text-[10px]">
                              <Check size={10} /> Active
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold t-text">Light Theme</h4>
                        <p className="text-xs t-muted mt-1 leading-relaxed">
                          Clean white background with crisp slate boundaries. Calibrated for daylight readability.
                        </p>
                        <div className="mt-3 pt-2.5 border-t t-border-subtle flex items-center gap-1.5 font-mono text-[10px] t-faint">
                          <span>Default: #FFFFFF</span>
                        </div>
                      </button>

                      {/* Dark Card */}
                      <button
                        type="button"
                        onClick={() => setTheme("dark")}
                        className={`p-4 rounded-xl border text-left transition-all relative ${
                          choice === "dark"
                            ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30 bg-surface shadow-sm"
                            : "t-border hover:border-slate-500 bg-surface/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <Moon size={17} />
                          </div>
                          {choice === "dark" && (
                            <span className="badge badge-rose text-[10px]">
                              <Check size={10} /> Active
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold t-text">Dark Theme</h4>
                        <p className="text-xs t-muted mt-1 leading-relaxed">
                          Dense OLED #000000 surface with rose highlights and low contrast eye fatigue mitigation.
                        </p>
                        <div className="mt-3 pt-2.5 border-t t-border-subtle flex items-center gap-1.5 font-mono text-[10px] t-faint">
                          <span>Contrast: 8.9:1</span>
                        </div>
                      </button>

                      {/* System Auto Card */}
                      <button
                        type="button"
                        onClick={() => setTheme("system")}
                        className={`p-4 rounded-xl border text-left transition-all relative ${
                          choice === "system"
                            ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30 bg-surface shadow-sm"
                            : "t-border hover:border-slate-500 bg-surface/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500">
                            <Laptop size={17} />
                          </div>
                          {choice === "system" && (
                            <span className="badge badge-rose text-[10px]">
                              <Check size={10} /> Active
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold t-text">System Sync</h4>
                        <p className="text-xs t-muted mt-1 leading-relaxed">
                          Automatically follows your OS color scheme (prefers-color-scheme) in real time.
                        </p>
                        <div className="mt-3 pt-2.5 border-t t-border-subtle flex items-center gap-1.5 font-mono text-[10px] t-faint">
                          <span>Resolved: {active}</span>
                        </div>
                      </button>
                    </div>

                    <div className="p-3 rounded-lg t-chip border t-border text-xs t-muted flex items-start gap-2.5">
                      <Zap size={14} className="text-accent shrink-0 mt-0.5" />
                      <div>
                        <strong className="t-text font-semibold">Pro tip:</strong> You can toggle dark and light mode from anywhere in the app at any time by pressing{" "}
                        <kbd className="px-1.5 py-0.5 rounded bg-surface border t-border font-mono text-[11px] t-text">Alt + T</kbd>{" "}
                        or{" "}
                        <kbd className="px-1.5 py-0.5 rounded bg-surface border t-border font-mono text-[11px] t-text">⌘ + Shift + L</kbd>.
                      </div>
                    </div>
                  </div>
                </section>

                {/* Live Preview Panel */}
                <section className="panel">
                  <div className="panel-head flex items-center justify-between">
                    <span className="panel-title">Real-Time Theme Preview</span>
                    <span className="font-mono text-[10px] t-faint">Render engine: CSS variables + semantic tokens</span>
                  </div>

                  <div className="panel-pad space-y-4">
                    <p className="text-xs t-muted">
                      Every data point in VividhEdu inherits from strict design tokens. Here is how your active theme renders:
                    </p>

                    <div className="rounded-xl border t-border p-5 bg-surface space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm t-text">IIT Bombay — B.Tech Computer Science</span>
                            <span className="badge badge-green">Tier 1 NIRF</span>
                          </div>
                          <p className="text-xs t-muted mt-0.5">Automated actuarial synthesis & 20-Year ROI projection</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-xl text-accent">₹1.84 Cr</span>
                          <span className="block text-[10px] font-mono t-faint">Net Present Value (P50)</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t t-border-subtle">
                        <div className="p-2.5 rounded-lg bg-elevated border t-border">
                          <span className="text-[10px] uppercase font-mono t-faint block">Composite</span>
                          <span className="text-base font-bold font-mono t-text">89.4<span className="text-xs t-faint">/100</span></span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-elevated border t-border">
                          <span className="text-[10px] uppercase font-mono t-faint block">Placement</span>
                          <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">97.8%</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-elevated border t-border">
                          <span className="text-[10px] uppercase font-mono t-faint block">AI Exposure</span>
                          <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">18.2%</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-elevated border t-border">
                          <span className="text-[10px] uppercase font-mono t-faint block">Debt Stress</span>
                          <span className="text-base font-bold font-mono t-text">Low (0.14)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap pt-2">
                        <span className="epistemic-tag tag-evidence">Verified Cutoff</span>
                        <span className="epistemic-tag tag-match">90% CI Model</span>
                        <span className="badge badge-blue">Calibrated Monte Carlo</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Display Density */}
                <section className="panel">
                  <div className="panel-head">
                    <span className="panel-title">Layout & Display Density</span>
                  </div>
                  <div className="panel-pad space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-semibold t-text">Compact Terminal Mode</h4>
                        <p className="text-xs t-muted mt-0.5">Reduces padding across data tables and matrix comparison grids.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !compactDensity;
                          setCompactDensity(next);
                          savePreference("vividhedu_pref_density", next ? "compact" : "standard");
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                          compactDensity ? "bg-accent" : "bg-chip border t-border"
                        }`}
                      >
                        <span
                          className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                            compactDensity ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* ── 2. DECISION ENGINE TAB ── */}
            {activeTab === "engine" && (
              <div className="space-y-6">
                <section className="panel">
                  <div className="panel-head">
                    <span className="panel-title">Actuarial Financial Parameters</span>
                  </div>
                  <div className="panel-pad space-y-6">
                    {/* Currency */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider t-faint block mb-2">
                        Display Currency
                      </label>
                      <div className="grid grid-cols-2 gap-3 max-w-md">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrency("INR");
                            savePreference("vividhedu_pref_currency", "INR");
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center justify-between ${
                            currency === "INR"
                              ? "border-[var(--accent)] ring-1 ring-[var(--accent)] bg-surface"
                              : "t-border hover:bg-[var(--bg-hover)]"
                          }`}
                        >
                          <div>
                            <span className="font-bold text-xs t-text">₹ INR (Indian Rupee)</span>
                            <span className="text-[11px] t-muted block">Domestic tuition & salary metrics</span>
                          </div>
                          {currency === "INR" && <Check size={14} className="text-accent" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrency("USD");
                            savePreference("vividhedu_pref_currency", "USD");
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center justify-between ${
                            currency === "USD"
                              ? "border-[var(--accent)] ring-1 ring-[var(--accent)] bg-surface"
                              : "t-border hover:bg-[var(--bg-hover)]"
                          }`}
                        >
                          <div>
                            <span className="font-bold text-xs t-text">$ USD (US Dollar)</span>
                            <span className="text-[11px] t-muted block">Global programs comparison</span>
                          </div>
                          {currency === "USD" && <Check size={14} className="text-accent" />}
                        </button>
                      </div>
                    </div>

                    {/* Horizon */}
                    <div className="pt-4 border-t t-border-subtle">
                      <label className="text-xs font-bold uppercase tracking-wider t-faint block mb-2">
                        Net Present Value (NPV) Career Horizon
                      </label>
                      <div className="grid grid-cols-2 gap-3 max-w-md">
                        <button
                          type="button"
                          onClick={() => {
                            setNpvHorizon("20yr");
                            savePreference("vividhedu_pref_horizon", "20yr");
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center justify-between ${
                            npvHorizon === "20yr"
                              ? "border-[var(--accent)] ring-1 ring-[var(--accent)] bg-surface"
                              : "t-border hover:bg-[var(--bg-hover)]"
                          }`}
                        >
                          <div>
                            <span className="font-bold text-xs t-text">20-Year Horizon</span>
                            <span className="text-[11px] t-muted block">Full capital asset lifecycle (Recommended)</span>
                          </div>
                          {npvHorizon === "20yr" && <Check size={14} className="text-accent" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNpvHorizon("10yr");
                            savePreference("vividhedu_pref_horizon", "10yr");
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center justify-between ${
                            npvHorizon === "10yr"
                              ? "border-[var(--accent)] ring-1 ring-[var(--accent)] bg-surface"
                              : "t-border hover:bg-[var(--bg-hover)]"
                          }`}
                        >
                          <div>
                            <span className="font-bold text-xs t-text">10-Year Horizon</span>
                            <span className="text-[11px] t-muted block">Early-career return on investment</span>
                          </div>
                          {npvHorizon === "10yr" && <Check size={14} className="text-accent" />}
                        </button>
                      </div>
                    </div>

                    {/* Risk Threshold */}
                    <div className="pt-4 border-t t-border-subtle">
                      <label className="text-xs font-bold uppercase tracking-wider t-faint block mb-2">
                        Downside Stress Envelope
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="risk"
                            checked={riskThreshold === "p10"}
                            onChange={() => setRiskThreshold("p10")}
                            className="text-accent focus:ring-accent"
                          />
                          <div>
                            <span className="text-xs font-semibold t-text">P10 Conservative (Actuarial baseline)</span>
                            <p className="text-[11px] t-muted">Models outcomes where economic conditions fall into the 10th percentile.</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="risk"
                            checked={riskThreshold === "p25"}
                            onChange={() => setRiskThreshold("p25")}
                            className="text-accent focus:ring-accent"
                          />
                          <div>
                            <span className="text-xs font-semibold t-text">P25 Balanced Distribution</span>
                            <p className="text-[11px] t-muted">Mild macroeconomic buffer assumption.</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-head flex items-center justify-between">
                    <div>
                      <span className="panel-title">AI Grounding & Live Verification</span>
                      <p className="text-xs t-muted mt-0.5">Configure live web validation against NIRF and official portal records.</p>
                    </div>
                    <span className="badge badge-purple">
                      <Sparkles size={10} /> Search Grounding
                    </span>
                  </div>
                  <div className="panel-pad space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-semibold t-text">Live Citation Grounding</h4>
                        <p className="text-xs t-muted mt-0.5">Attach real-time verified URLs to career and admission advisories.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAiGrounding(!aiGrounding)}
                        className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                          aiGrounding ? "bg-accent" : "bg-chip border t-border"
                        }`}
                      >
                        <span
                          className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                            aiGrounding ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* ── 3. PRIVACY & STORAGE TAB ── */}
            {activeTab === "privacy" && (
              <div className="space-y-6">
                <section className="panel">
                  <div className="panel-head flex items-center justify-between">
                    <div>
                      <span className="panel-title">India DPDP & GDPR Governance</span>
                      <p className="text-xs t-muted mt-0.5">Explicit consent controls and local storage isolation.</p>
                    </div>
                    <span className="badge badge-green">Zero cross-site trackers</span>
                  </div>

                  <div className="panel-pad space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl border t-border bg-surface">
                        <span className="text-[10px] font-mono t-faint block uppercase">Strictly Necessary</span>
                        <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                          <Check size={12} /> Always Enabled
                        </div>
                        <p className="text-[11px] t-muted mt-1">Auth session tokens and report identifiers.</p>
                      </div>

                      <div className="p-3 rounded-xl border t-border bg-surface">
                        <span className="text-[10px] font-mono t-faint block uppercase">Functional Storage</span>
                        <div className={`mt-1 flex items-center gap-1.5 text-xs font-bold ${functionalAllowed() ? "text-emerald-600" : "text-amber-600"}`}>
                          {functionalAllowed() ? <Check size={12} /> : null}
                          {functionalAllowed() ? "Allowed" : "Restricted"}
                        </div>
                        <p className="text-[11px] t-muted mt-1">Theme choice and interest graph preferences.</p>
                      </div>

                      <div className="p-3 rounded-xl border t-border bg-surface">
                        <span className="text-[10px] font-mono t-faint block uppercase">Telemetry / PostHog</span>
                        <div className="mt-1 flex items-center gap-1.5 text-xs font-bold t-muted">
                          Opt-in Only
                        </div>
                        <p className="text-[11px] t-muted mt-1">First-party analytics only when allowed.</p>
                      </div>
                    </div>

                    <div className="pt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openCookieSettings()}
                        className="btn-primary text-xs"
                      >
                        Open Cookie & Consent Manager
                      </button>
                      <Link href="/privacy" className="btn-ghost text-xs">
                        View Privacy Policy →
                      </Link>
                    </div>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-head flex items-center justify-between">
                    <div>
                      <span className="panel-title">Interest Graph & Person Memory</span>
                      <p className="text-xs t-muted mt-0.5">Learned signals powering your customized decision models.</p>
                    </div>
                    <Fingerprint size={14} className="t-faint" />
                  </div>

                  <div className="panel-pad space-y-4">
                    <div className="flex items-center justify-between text-xs py-1 border-b t-border-subtle">
                      <span className="t-muted">Interaction signals recorded:</span>
                      <span className="font-mono font-bold t-text">{state.stats.event_count}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1 border-b t-border-subtle">
                      <span className="t-muted">Explicit memory facts stored:</span>
                      <span className="font-mono font-bold t-text">{Object.keys(state.facts || {}).length}</span>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Link href="/you" className="btn-secondary text-xs">
                        Inspect Your Algorithm →
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Forget all interest graph signals and personal memory facts?")) {
                            resetPersonMemory();
                            setSavedNotice("Interest graph wiped successfully.");
                            setTimeout(() => setSavedNotice(null), 3000);
                          }
                        }}
                        className="btn-ghost text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 flex items-center gap-1.5"
                      >
                        <Trash2 size={13} />
                        Forget Interest Graph
                      </button>
                    </div>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-head">
                    <span className="panel-title">Browser Storage Sanitation</span>
                  </div>
                  <div className="panel-pad space-y-3">
                    <p className="text-xs t-muted">
                      Your browser currently retains <span className="font-mono font-bold t-text">{storageKeysCount}</span> key-value records for this domain.
                    </p>
                    <button
                      type="button"
                      onClick={handleClearCache}
                      className="btn-ghost text-xs flex items-center gap-1.5 t-muted hover:t-text border t-border"
                    >
                      <RefreshCw size={12} />
                      Clear Local Application Cache
                    </button>
                  </div>
                </section>
              </div>
            )}

            {/* ── 4. ACCOUNT & SESSION TAB ── */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <section className="panel">
                  <div className="panel-head">
                    <span className="panel-title">Account Credentials</span>
                  </div>

                  <div className="panel-pad space-y-5">
                    {user ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-12 h-12 rounded-full border t-border" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center font-bold text-base">
                              {(user.full_name || user.email || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h3 className="text-sm font-bold t-text">{user.full_name || "VividhEdu Scholar"}</h3>
                            <p className="text-xs t-muted">{user.email}</p>
                            <span className="inline-block mt-1 font-mono text-[10px] t-faint">
                              User ID: {user.id ? `${user.id.slice(0, 12)}…` : "Active"}
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 border-t t-border-subtle flex items-center gap-3">
                          <button
                            type="button"
                            onClick={logout}
                            className="btn-secondary text-xs flex items-center gap-1.5"
                          >
                            <LogOut size={13} />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Notice tone="info">
                          You are currently using VividhEdu in Guest mode. Your calculations, roadmap, and weights live in this browser session.
                        </Notice>
                        <p className="text-xs t-muted">
                          Sign in to sync your saved college shortlists, decisions weights, and interest graph across devices.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsAuthModalOpen(true)}
                          className="btn-primary text-xs flex items-center gap-1.5"
                        >
                          <UserRound size={13} />
                          Sign In or Create Account
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-head">
                    <span className="panel-title">Subscription & Access Tier</span>
                  </div>
                  <div className="panel-pad space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs t-text">Public Launch Tier</span>
                          <span className="badge badge-green">Free Unlimited</span>
                        </div>
                        <p className="text-xs t-muted mt-0.5">
                          Full access to all 73 validated college cohorts, Monte Carlo simulators, and IRT psychometrics during launch.
                        </p>
                      </div>
                      <Link href="/pricing" className="btn-ghost text-xs">
                        Pricing Details →
                      </Link>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
