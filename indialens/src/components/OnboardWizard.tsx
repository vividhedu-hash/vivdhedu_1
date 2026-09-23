"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  GraduationCap,
  Building2,
  GitBranch,
  Search,
  Check,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Sliders,
  Sparkles,
  Shield,
  Scale,
  FileText,
  Bookmark,
  HelpCircle,
  TrendingUp,
  Award,
  FlaskConical,
  Code,
  DollarSign,
  Globe,
  Cpu,
  Brain,
  Microscope,
  Palette,
  BarChart2,
  Users
} from "lucide-react";

export interface WizardData {
  fullName: string;
  stage: string;
  goals: string[];
  disciplines: string[];
  weights: {
    career_outcomes: number;
    cost_affordability: number;
    prestige: number;
    academic_rigor: number;
    location: number;
    flexibility: number;
    opportunities: number;
  };
  budgetBand: string;
  geography: string[];
  targetField: string;
  dreamInstitutions: string[];
  immediateFocus: string;
  exploreFirst: boolean;
}

interface OnboardWizardProps {
  onComplete: (data: WizardData) => void;
}

export const OnboardWizard: React.FC<OnboardWizardProps> = ({ onComplete }) => {
  // step 0 = Screen 01 (Welcome)
  // step 1 = Screen 02 (Journey Stage)
  // step 2 = Screen 03 (Goals)
  // step 3 = Screen 04 (Curiosity Disciplines)
  // step 4 = Screen 05 (Decision Weights)
  // step 5 = Screen 06 (Reality / Budget & Visa)
  // step 6 = Screen 07 (Working Toward / Target)
  const [step, setStep] = useState(0);

  const [data, setData] = useState<WizardData>({
    fullName: "Alex M.",
    stage: "class_11_12",
    goals: ["college_discovery", "profile_building"],
    disciplines: ["behavioral_econ", "applied_econometrics", "ml_ai"],
    weights: {
      career_outcomes: 95,
      cost_affordability: 82,
      prestige: 70,
      academic_rigor: 64,
      location: 48,
      flexibility: 40,
      opportunities: 32,
    },
    budgetBand: "35k_65k",
    geography: ["uk_europe"],
    targetField: "Quantitative Economics & Tech Policy",
    dreamInstitutions: ["LSE", "Warwick", "Ashoka University"],
    immediateFocus: "research_preprint",
    exploreFirst: false,
  });

  const [searchQuery, setSearchQuery] = useState("");

  const updateWeight = (key: keyof WizardData["weights"], val: number) => {
    setData((prev) => ({
      ...prev,
      weights: { ...prev.weights, [key]: val },
    }));
  };

  const toggleGoal = (id: string) => {
    setData((prev) => {
      const exists = prev.goals.includes(id);
      return {
        ...prev,
        goals: exists ? prev.goals.filter((g) => g !== id) : [...prev.goals, id],
      };
    });
  };

  const toggleDiscipline = (id: string) => {
    setData((prev) => {
      const exists = prev.disciplines.includes(id);
      return {
        ...prev,
        disciplines: exists ? prev.disciplines.filter((d) => d !== id) : [...prev.disciplines, id],
      };
    });
  };

  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1);
    } else {
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  // -------------------------------------------------------------------------
  // SCREEN 01: Welcome / Pre-Onboarding
  // -------------------------------------------------------------------------
  if (step === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-zinc-950 font-sans">
        {/* Top Header */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200/80 bg-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center text-white font-bold text-[10px]">
              OS
            </div>
            <span className="font-bold text-sm text-zinc-900 tracking-tight">Your Student OS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block ml-0.5" />
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="hover:text-zinc-800 cursor-pointer">Privacy Guarantee</span>
            <span className="text-zinc-300">/</span>
            <span className="hover:text-zinc-800 cursor-pointer flex items-center gap-1">
              <HelpCircle size={12} />
              Assistance
            </span>
          </div>
        </header>

        {/* Center Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-2xl mx-auto w-full text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/70 text-rose-700 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            <span>Student Intelligence Platform</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-950 tracking-tight leading-tight mb-4">
            Let’s start with you.
          </h1>
          <p className="text-zinc-500 text-base max-w-md mx-auto mb-8 leading-relaxed">
            We’ll ask a few questions so everything you see here is built around your goals.
          </p>

          {/* Black CTA Button with Blue Dashed Outline Ring */}
          <button
            onClick={() => setStep(1)}
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-black hover:bg-zinc-800 text-white font-semibold text-sm rounded-xl transition shadow-sm dashed-ring cursor-pointer"
          >
            <span>Get started</span>
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          <p className="text-zinc-400 text-xs mt-3 mb-10">
            About 3 minutes · You can change your answers later
          </p>

          {/* Active Session Card */}
          <div className="w-full max-w-md bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm relative overflow-hidden text-left">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-pink-400 to-rose-400" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                  <Sliders size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-900">Active Session Profile</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                  </div>
                  <span className="text-xs text-zinc-500">Undergraduate & Career Trajectory</span>
                </div>
              </div>
              <span className="text-[11px] font-mono font-medium text-zinc-400">ID: #SYS-01</span>
            </div>
          </div>
        </main>

        {/* Bottom Three Guarantees */}
        <footer className="py-4 border-t border-slate-200/80 bg-white/70 backdrop-blur-sm text-xs text-zinc-500 flex flex-wrap items-center justify-center gap-8">
          <div className="flex items-center gap-1.5">
            <FileText size={13} className="text-zinc-400" />
            <span>Personalized ROI models</span>
          </div>
          <span className="text-zinc-300">•</span>
          <div className="flex items-center gap-1.5">
            <Shield size={13} className="text-zinc-400" />
            <span>AI Resilience Index</span>
          </div>
          <span className="text-zinc-300">•</span>
          <div className="flex items-center gap-1.5">
            <Scale size={13} className="text-zinc-400" />
            <span>Unbiased guidance</span>
          </div>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // SCREENS 02 - 07: Shared Layout Shell
  // -------------------------------------------------------------------------
  const stepMeta = [
    { title: "Where are you in your journey?", sub: "This helps us calibrate opportunities, college timelines, and decision frameworks.", badge: "STAGE", pct: 15 },
    { title: "What brought you here?", sub: "Select everything that applies to your goals today. We will calibrate your workspace accordingly.", badge: "WORKSPACE CALIBRATION", pct: 30 },
    { title: "What could you see yourself spending years learning about?", sub: "Choose disciplines or topics that spark your curiosity. We use this to surface tailored mentors and research opportunities.", badge: "CURIOSITY DOMAINS", pct: 45 },
    { title: "When you make a big decision, what matters most?", sub: "Drag to order or adjust relative importance. Your Student OS uses this to calculate personalized ROI.", badge: "DECISION WEIGHTS", pct: 65 },
    { title: "Let’s talk about reality.", sub: "Practical parameters make your roadmap viable and stress-free. Every model is calibrated against these real-world conditions.", badge: "DETERMINISTIC FEASIBILITY MODEL", pct: 80 },
    { title: "What are you working toward?", sub: "Define your north star. Don't worry if it's still evolving—your roadmap adapts as you build.", badge: "WORKSPACE SETUP", pct: 95 },
  ];

  const currentMeta = stepMeta[step - 1];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-zinc-950 font-sans">
      {/* Top Navbar matching PDF Screens */}
      <header className="px-6 py-3 flex items-center justify-between border-b border-slate-200/80 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center text-white font-bold text-[10px]">
            OS
          </div>
          <span className="font-bold text-sm text-zinc-900 tracking-tight">Your Student OS</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-semibold ml-1">
            v2.4
          </span>
        </div>

        {/* Progress tracker */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-xs font-medium text-zinc-500">Step {step} of 6</span>
          <div className="w-36 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-300"
              style={{ width: `${currentMeta.pct}%` }}
            />
          </div>
          <span className="text-xs font-mono text-zinc-400 font-medium">{currentMeta.pct}%</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => alert("Session draft saved automatically.")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-zinc-700 font-medium transition cursor-pointer"
          >
            <Bookmark size={12} className="text-zinc-400" />
            <span>Save & exit</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Title Header */}
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200/60 text-rose-700 text-[11px] font-bold tracking-wide uppercase font-mono mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            <span>{currentMeta.badge}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight mb-2">
            {currentMeta.title}
          </h2>
          <p className="text-zinc-500 text-sm max-w-2xl leading-relaxed">
            {currentMeta.sub}
          </p>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* SCREEN 02: Where are you in your journey? */}
        {/* ----------------------------------------------------------------- */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  id: "class_9_10",
                  title: "Class 9–10",
                  desc: "Building early foundations, exploration & profile discovery",
                  num: "1",
                  icon: <Compass size={18} />,
                },
                {
                  id: "class_11_12",
                  title: "Class 11–12",
                  desc: "Crucial streams, college admissions, competitive exams & portfolio building",
                  num: "2",
                  icon: <GraduationCap size={18} />,
                },
                {
                  id: "college",
                  title: "College",
                  desc: "Undergraduate degree, internships, research & placement strategy",
                  num: "3",
                  icon: <Building2 size={18} />,
                },
                {
                  id: "gap_other",
                  title: "Gap year / Other",
                  desc: "Refining target trajectory, retakes, or non-linear pathways",
                  num: "4",
                  icon: <GitBranch size={18} />,
                },
              ].map((card) => {
                const isSelected = data.stage === card.id;
                return (
                  <div
                    key={card.id}
                    onClick={() => setData({ ...data, stage: card.id })}
                    className={`relative p-5 rounded-xl border bg-white cursor-pointer transition-all ${
                      isSelected
                        ? "border-rose-400 shadow-md ring-1 ring-rose-400 bg-white"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-600 text-white flex items-center gap-1">
                        <Check size={10} /> ACTIVE
                      </span>
                    )}
                    {!isSelected && (
                      <span className="absolute top-3 right-3 text-xs font-mono font-semibold text-zinc-300">
                        {card.num}
                      </span>
                    )}
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center mb-3">
                      {card.icon}
                    </div>
                    <h3 className="font-bold text-base text-zinc-900 mb-1">{card.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{card.desc}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 bg-white p-3 rounded-lg border border-slate-200/80">
              <span className="text-zinc-400">ⓘ</span>
              <span>You can calibrate stream-specific requirements in the next step.</span>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* SCREEN 03: What brought you here? */}
        {/* ----------------------------------------------------------------- */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                {
                  id: "college_discovery",
                  title: "Find the right college",
                  desc: "Discovery, admissions odds & program ROI matrices",
                  footerLeft: "Admissions Matrix Loaded",
                  footerRight: "Yield: High",
                  num: "1",
                },
                {
                  id: "career_choice",
                  title: "Choose a career",
                  desc: "Market demand analysis & AI displacement resilience",
                  footerLeft: "Labor Bureau Telemetry",
                  footerRight: "10-Yr Outlook",
                  num: "2",
                },
                {
                  id: "profile_building",
                  title: "Build my profile",
                  desc: "High-signal extracurriculars, papers & competitions",
                  footerLeft: "Olympiad & ISEF Tiering",
                  footerRight: "Tier 1 Signals",
                  num: "3",
                },
                {
                  id: "internships",
                  title: "Find internships",
                  desc: "Curated research labs & industry apprenticeships",
                  footerLeft: "R1 University Labs",
                  footerRight: "Rolling Q3/Q4",
                  num: "4",
                },
                {
                  id: "research",
                  title: "Explore research",
                  desc: "Academic paper mentorship with verified university faculty",
                  footerLeft: "arXiv & IEEE Tracks",
                  footerRight: "Peer Reviewed",
                  num: "5",
                },
                {
                  id: "projects",
                  title: "Start a project",
                  desc: "Civic tech, software prototypes & open publications",
                  footerLeft: "GitHub Grants & Seed",
                  footerRight: "Independent",
                  num: "6",
                },
              ].map((card) => {
                const isSelected = data.goals.includes(card.id);
                return (
                  <div
                    key={card.id}
                    onClick={() => toggleGoal(card.id)}
                    className={`p-4 rounded-xl border bg-white cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-rose-400 shadow-sm ring-1 ring-rose-400"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="font-bold text-sm text-zinc-900">{card.title}</h3>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-zinc-400">{card.num}</span>
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                              isSelected
                                ? "bg-black border-black text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check size={10} />}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed mb-3">{card.desc}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span>{card.footerLeft}</span>
                      <span className="font-medium text-zinc-600">{card.footerRight}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Confused Card (Wide) */}
            <div
              onClick={() => toggleGoal("confused")}
              className={`p-4 rounded-xl border bg-white cursor-pointer transition-all ${
                data.goals.includes("confused")
                  ? "border-rose-400 ring-1 ring-rose-400"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm text-zinc-900">I’m confused</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      Human First
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    That’s completely fine. We will map your natural strengths from scratch.
                  </p>
                </div>
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                    data.goals.includes("confused")
                      ? "bg-black border-black text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {data.goals.includes("confused") && <Check size={10} />}
                </div>
              </div>
            </div>

            <div className="text-center text-xs font-mono text-zinc-400 pt-2">
              1 – 7 to toggle options · Enter to continue
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* SCREEN 04: What could you see yourself spending years learning about? */}
        {/* ----------------------------------------------------------------- */}
        {step === 3 && (
          <div className="space-y-5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search disciplines, subjects, or industries (e.g. Behavioral Economics, Robotics)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 shadow-sm"
              />
              <span className="absolute right-3.5 top-2.5 text-[11px] font-mono text-zinc-400 bg-slate-100 px-1.5 py-0.5 rounded">
                ⌘K
              </span>
            </div>

            {/* 4 Domain Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  domain: "Economics & Business",
                  code: "Domain 01",
                  icon: <TrendingUp size={16} />,
                  items: [
                    { id: "behavioral_econ", label: "Behavioral Economics" },
                    { id: "venture_finance", label: "Venture Finance" },
                    { id: "quant_trading", label: "Quantitative Trading" },
                    { id: "applied_econometrics", label: "Applied Econometrics" },
                  ],
                },
                {
                  domain: "Technology & Computing",
                  code: "Domain 02",
                  icon: <Cpu size={16} />,
                  items: [
                    { id: "ml_ai", label: "Machine Learning / AI" },
                    { id: "distributed_systems", label: "Distributed Systems" },
                    { id: "hci", label: "Human-Computer Interaction" },
                    { id: "cybersecurity", label: "Cybersecurity" },
                  ],
                },
                {
                  domain: "Sciences & Medicine",
                  code: "Domain 03",
                  icon: <Microscope size={16} />,
                  items: [
                    { id: "comp_bio", label: "Computational Biology" },
                    { id: "neuroscience", label: "Neuroscience" },
                    { id: "astrophysics", label: "Astrophysics" },
                    { id: "genomics", label: "Genomics" },
                  ],
                },
                {
                  domain: "Design & Humanities",
                  code: "Domain 04",
                  icon: <Palette size={16} />,
                  items: [
                    { id: "public_policy", label: "Public Policy & Law" },
                    { id: "cog_psych", label: "Cognitive Psychology" },
                    { id: "industrial_design", label: "Industrial Design" },
                    { id: "philosophy_mind", label: "Philosophy of Mind" },
                  ],
                },
              ].map((group) => (
                <div key={group.code} className="p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-600">{group.icon}</span>
                      <h3 className="font-bold text-xs text-zinc-900">{group.domain}</h3>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">{group.code}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((it) => {
                      const isSel = data.disciplines.includes(it.id);
                      return (
                        <button
                          key={it.id}
                          onClick={() => toggleDiscipline(it.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                            isSel
                              ? "bg-rose-50 text-rose-700 border border-rose-200 font-semibold"
                              : "bg-slate-50 hover:bg-slate-100 text-zinc-700 border border-slate-200/80"
                          }`}
                        >
                          <span>{isSel ? "✓" : "+"}</span>
                          <span>{it.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Helper box */}
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <Sliders size={14} className="text-zinc-400" />
                <span>Not seeing a niche discipline? You can refine specific subfields later in your Research Profile settings.</span>
              </div>
              <span className="font-mono text-zinc-400 text-[11px] shrink-0">Auto-calibrated</span>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* SCREEN 05: Decision Weights */}
        {/* ----------------------------------------------------------------- */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {[
                { key: "career_outcomes", label: "Career outcomes", desc: "Placements, salary upside, career trajectory", num: "#1", high: true },
                { key: "cost_affordability", label: "Cost & Affordability", desc: "Tuition, living expenses, scholarships & net financial strain", num: "#2" },
                { key: "prestige", label: "Prestige & Alumni", desc: "Institutional reputation, global network reach", num: "#3" },
                { key: "academic_rigor", label: "Learning & Rigor", desc: "Curriculum freedom, faculty quality, research labs", num: "#4" },
                { key: "location", label: "Location & Environment", desc: "City ecosystem, peer group culture, campus lifestyle", num: "#5" },
                { key: "flexibility", label: "Flexibility & Minor Options", desc: "Dual majors, easy transfers, interdisciplinary scope", num: "#6" },
                { key: "opportunities", label: "Curated Opportunities", desc: "Internship pipelines, incubators, venture funds", num: "#7" },
              ].map((row) => (
                <div key={row.key} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-mono font-bold text-zinc-400 mt-0.5">{row.num}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-900">{row.label}</span>
                        {row.high && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            High Weight
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">{row.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:w-48 shrink-0">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={data.weights[row.key as keyof typeof data.weights]}
                      onChange={(e) => updateWeight(row.key as keyof typeof data.weights, parseInt(e.target.value))}
                      className="weight-slider flex-1"
                    />
                    <span className="font-mono text-xs font-bold text-zinc-800 w-8 text-right">
                      {data.weights[row.key as keyof typeof data.weights]}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Simulation feedback pill card */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center gap-3 text-xs">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <TrendingUp size={16} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                  <span>Balanced Growth Profile</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                  <span className="font-normal text-zinc-400">Real-time Simulation</span>
                </div>
                <p className="text-zinc-500 text-[11px] mt-0.5">
                  ROI intelligence will prioritize net career return against upfront capital.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* SCREEN 06: Reality / Financial & Geographic Constraints */}
        {/* ----------------------------------------------------------------- */}
        {step === 5 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Financial + Geography */}
            <div className="md:col-span-2 space-y-6">
              {/* Budget */}
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                      FINANCIAL PARAMETERS
                    </span>
                    <h3 className="font-bold text-sm text-zinc-900">Target Annual Education Budget</h3>
                  </div>
                  <DollarSign size={16} className="text-zinc-400" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: "lt_15k", tier: "Tier 01", label: "< $15k / yr", desc: "Maximum institutional grant dependency" },
                    { id: "15k_35k", tier: "Tier 02", label: "$15k–$35k / yr", desc: "Partial merit aid and state baseline" },
                    {
                      id: "35k_65k",
                      tier: "Tier 03",
                      label: "$35k–$65k / yr",
                      desc: "Balanced self-contribution with institutional co-funding",
                      badge: "Need-Aware Scholarships Calculated",
                    },
                    { id: "gt_65k", tier: "Tier 04", label: "$65k+ / Full Outlay", desc: "Unconstrained private & international track" },
                  ].map((b) => {
                    const isSel = data.budgetBand === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => setData({ ...data, budgetBand: b.id })}
                        className={`p-3 rounded-xl border cursor-pointer transition relative ${
                          isSel
                            ? "border-zinc-950 bg-white shadow-sm ring-1 ring-zinc-950"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {b.badge && (
                          <span className="absolute -top-2 left-3 px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                            • {b.badge}
                          </span>
                        )}
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono text-zinc-400 font-semibold">{b.tier}</span>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSel ? "border-black" : "border-slate-300"}`}>
                            {isSel && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                          </div>
                        </div>
                        <div className="font-bold text-xs text-zinc-900">{b.label}</div>
                        <p className="text-[11px] text-zinc-500 mt-1 leading-tight">{b.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Geography */}
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                      JURISDICTION & VISAS
                    </span>
                    <h3 className="font-bold text-sm text-zinc-900">Geographic Mobility</h3>
                  </div>
                  <Globe size={16} className="text-zinc-400" />
                </div>
                <p className="text-xs text-zinc-500 mb-3">
                  Select target regions for post-study work regulations, currency exposure, and relocation logistics.
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "domestic", label: "Domestic Only" },
                    { id: "us_canada", label: "US / Canada" },
                    { id: "uk_europe", label: "UK & Europe" },
                    { id: "singapore", label: "Singapore / Global Hubs" },
                  ].map((geo) => {
                    const isSel = data.geography.includes(geo.id);
                    return (
                      <button
                        key={geo.id}
                        onClick={() =>
                          setData({
                            ...data,
                            geography: isSel
                              ? data.geography.filter((g) => g !== geo.id)
                              : [...data.geography, geo.id],
                          })
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                          isSel
                            ? "bg-black text-white font-semibold"
                            : "bg-slate-50 text-zinc-700 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {isSel && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                        <span>{geo.label}</span>
                        {isSel && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Feasibility Metric Live Feed */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-zinc-400">
                    FEASIBILITY METRIC
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                    <span className="text-[10px] font-mono text-rose-600 font-semibold">Live Feed</span>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-zinc-600">Cohort Reachability</span>
                      <span className="font-mono font-bold text-zinc-900">84.2%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[84.2%] h-full bg-black rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-zinc-600">Cost-to-Merit Alignment</span>
                      <span className="font-mono font-bold text-rose-600">Optimized</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[92%] h-full bg-rose-500 rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-zinc-600">Visa Pathway Viability</span>
                      <span className="font-mono font-bold text-zinc-900">High (Tier 2/PSW)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[78%] h-full bg-zinc-800 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Sensitivity check box */}
                <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-zinc-600">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-800 mb-1">
                    <Sliders size={12} />
                    <span>Sensitivity Check</span>
                  </div>
                  <p className="leading-relaxed">
                    Your $35k–$65k band unlocks 18 Russell Group & European English-taught cohorts with high grant yields.
                  </p>
                </div>
              </div>

              {/* Parameter Rules */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-zinc-500">
                <div className="flex items-center gap-1.5 font-bold text-zinc-800 mb-2">
                  <Shield size={12} className="text-zinc-400" />
                  <span>PARAMETER RULES</span>
                </div>
                <ul className="space-y-1.5 text-[11px] list-disc list-inside">
                  <li>Parameters can be recalibrated anytime during scenario modeling.</li>
                  <li>Currency exchange fluctuations are hedged at a conservative 5-year rolling delta.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* SCREEN 07: What are you working toward? */}
        {/* ----------------------------------------------------------------- */}
        {step === 6 && (
          <div className="space-y-5">
            {/* Primary Target Field */}
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase font-bold text-zinc-400">
                  PRIMARY TARGET FIELD (Discipline / Focus Domain)
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  High Precision
                </span>
              </div>
              <input
                type="text"
                value={data.targetField}
                onChange={(e) => setData({ ...data, targetField: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-zinc-900 focus:outline-none focus:border-zinc-400"
              />
              <p className="text-[11px] text-zinc-400 mt-1.5">
                Synthesized from prior transcript metrics and preliminary research preferences.
              </p>
            </div>

            {/* Dream Institutions */}
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase font-bold text-zinc-400">
                  DREAM INSTITUTIONS OR TRAJECTORIES
                </span>
                <span className="text-[11px] text-zinc-400">Select target pathways</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {["LSE", "Warwick", "Ashoka University", "UC Berkeley", "Oxford"].map((col) => {
                  const isSel = data.dreamInstitutions.includes(col);
                  return (
                    <button
                      key={col}
                      onClick={() =>
                        setData({
                          ...data,
                          dreamInstitutions: isSel
                            ? data.dreamInstitutions.filter((c) => c !== col)
                            : [...data.dreamInstitutions, col],
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                        isSel
                          ? "bg-rose-50 text-rose-700 border border-rose-200 font-semibold"
                          : "bg-slate-50 hover:bg-slate-100 text-zinc-700 border border-slate-200"
                      }`}
                    >
                      <span>{col}</span>
                      <span>{isSel ? "✓" : "+"}</span>
                    </button>
                  );
                })}
                <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                  <span>I’m open to data-backed recommendations ✓</span>
                </button>
              </div>
            </div>

            {/* Immediate 6-Month Focus */}
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase font-bold text-zinc-400">
                  IMMEDIATE 6-MONTH FOCUS
                </span>
                <span className="text-[11px] text-zinc-400">Select top priority initiative</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: "research_preprint",
                    icon: <FileText size={16} />,
                    title: "Publish 1st Research Preprint",
                    sub: "Targeting SSRN / arXiv submission",
                  },
                  {
                    id: "standardized_testing",
                    icon: <BarChart2 size={16} />,
                    title: "Boost Standardized Testing (SAT 1500+)",
                    sub: "Diagnostic analytics & drills",
                  },
                  {
                    id: "mentorship",
                    icon: <Users size={16} />,
                    title: "Secure Selective Mentorship",
                    sub: "Faculty & PhD lab matching",
                  },
                ].map((foc) => {
                  const isSel = data.immediateFocus === foc.id;
                  return (
                    <div
                      key={foc.id}
                      onClick={() => setData({ ...data, immediateFocus: foc.id })}
                      className={`p-3.5 rounded-xl border cursor-pointer transition relative ${
                        isSel
                          ? "border-rose-400 ring-1 ring-rose-400 bg-white"
                          : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                      }`}
                    >
                      {isSel && (
                        <span className="w-2 h-2 rounded-full bg-rose-600 absolute top-3 right-3" />
                      )}
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center mb-2">
                        {foc.icon}
                      </div>
                      <h4 className="font-bold text-xs text-zinc-900 leading-snug">{foc.title}</h4>
                      <p className="text-[11px] text-zinc-400 mt-1">{foc.sub}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explore first toggle card */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Compass size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-zinc-900">
                    I’m not sure yet — help me explore options first
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Our algorithm will prioritize diagnostic discovery modules over hard milestones.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setData({ ...data, exploreFirst: !data.exploreFirst })}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  data.exploreFirst ? "bg-black" : "bg-slate-200"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    data.exploreFirst ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Sticky Action Bar matching PDF */}
      <footer className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-zinc-700 hover:bg-slate-50 transition dashed-ring cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          <span>
            {step === 1 && "Stage selection active"}
            {step === 2 && `${data.goals.length} categories selected`}
            {step === 3 && `${data.disciplines.length} disciplines pinned`}
            {step === 4 && "Weights calibrated"}
            {step === 5 && "Feasibility models synchronized"}
            {step === 6 && "Profile ready for multi-agent synthesis"}
          </span>
        </div>

        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition dashed-ring cursor-pointer"
        >
          <span>{step === 6 ? "Build sovereign profile →" : "Continue"}</span>
          <ArrowRight size={14} />
        </button>
      </footer>
    </div>
  );
};
