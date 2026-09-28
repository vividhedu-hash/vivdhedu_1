"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { useAuth } from "@/lib/auth-context";
import { readLocalProfile, writeLocalProfile } from "@/lib/profile-store";

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

/**
 * Every field starts EMPTY.
 *
 * This object used to be a complete invented person: a name, a class, a budget
 * band, UK geography, LSE/Warwick/Ashoka as dream institutions, and a
 * descending weight vector (95/82/70/64/48/40/32) that was nobody's priorities.
 * Because the wizard pre-filled these as though they were answers, a signed-in
 * student who did not touch a single control still produced a report about a
 * fictional Class 11-12 student studying quantitative economics in the UK — and
 * since the first step they were shown was "Get started", there was no signal
 * that any of it was not theirs.
 *
 * So the rule here is that nothing may be pre-filled except a value the student
 * themselves previously gave us, or a name that is offered as an editable
 * suggestion and clearly marked as needing confirmation. Weights default to a
 * neutral 50 across the board, which is the midpoint of a 0-100 slider and the
 * honest "we have not asked you yet" value — not a profile of a specific
 * person.
 */
const EMPTY_WIZARD_DATA: WizardData = {
  fullName: "",
  stage: "",
  goals: [],
  disciplines: [],
  weights: {
    career_outcomes: 50,
    cost_affordability: 50,
    prestige: 50,
    academic_rigor: 50,
    location: 50,
    flexibility: 50,
    opportunities: 50,
  },
  budgetBand: "",
  geography: [],
  targetField: "",
  dreamInstitutions: [],
  immediateFocus: "",
  exploreFirst: false,
};

interface OnboardWizardProps {
  onComplete: (data: WizardData) => void;
}

/** Fields that must carry a real answer before a profile can be built. */
type StepField = "fullName" | "stage" | "goals" | "disciplines" | "budgetBand" | "targetField" | "immediateFocus";

/** Used to name the missing field in the validation message. */
const FIELD_LABELS: Record<StepField, string> = {
  fullName: "Your name",
  stage: "Your journey stage",
  goals: "At least one goal",
  disciplines: "At least one discipline",
  budgetBand: "A budget band",
  targetField: "A target field",
  immediateFocus: "An immediate focus",
};

/** Human labels for the summary panel, so an unset field can say "Not set". */
const BUDGET_LABELS: Record<string, string> = {
  lt_15k: "< $15k / yr",
  "15k_35k": "$15k–$35k / yr",
  "35k_65k": "$35k–$65k / yr",
  gt_65k: "$65k+ / yr",
};

const GEOGRAPHY_LABELS: Record<string, string> = {
  domestic: "Domestic",
  us_canada: "US / Canada",
  uk_europe: "UK & Europe",
  singapore: "Singapore / Hubs",
};

const STAGE_LABELS: Record<string, string> = {
  class_9_10: "Class 9–10",
  class_11_12: "Class 11–12",
  college: "College",
  gap_other: "Gap year / Other",
};

const WEIGHT_LABELS: Record<string, string> = {
  career_outcomes: "Career outcomes",
  cost_affordability: "Cost & Affordability",
  prestige: "Prestige & Alumni",
  academic_rigor: "Learning & Rigor",
  location: "Location & Environment",
  flexibility: "Flexibility & Minor Options",
  opportunities: "Curated Opportunities",
};

export const OnboardWizard: React.FC<OnboardWizardProps> = ({ onComplete }) => {
  const { user } = useAuth();

  // step 0 = Screen 01 (Welcome)
  // step 1 = Screen 02 (Identity)
  // step 2 = Screen 03 (Journey Stage)
  // step 3 = Screen 04 (Goals)
  // step 4 = Screen 05 (Curiosity Disciplines)
  // step 5 = Screen 06 (Decision Weights)
  // step 6 = Screen 07 (Reality / Budget & Visa)
  // step 7 = Screen 08 (Working Toward / Target)
  const [step, setStep] = useState(0);

  const [data, setData] = useState<WizardData>(EMPTY_WIZARD_DATA);
  const [touched, setTouched] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  /**
   * A name the student's own account supplies, offered as a SUGGESTION.
   *
   * `mapSupabaseUser` derives `full_name` from OAuth metadata, and falls back
   * to the email's local part — so a GitHub user with no name gets
   * "octocat" prefilled. That is a real value about a real account rather than
   * an invented persona, but it is still not the name the student would put on
   * their own report, so it is marked as needing confirmation in the UI and
   * stays fully editable. It is applied once, only while the field is empty, so
   * it can never overwrite something the student typed or restored.
   */
  const suggestedName = useMemo(() => {
    const fromAuth = user?.full_name?.trim();
    if (fromAuth) return fromAuth;
    const local = user?.email?.split("@")[0]?.trim();
    return local ? local : "";
  }, [user?.full_name, user?.email]);

  const isEmailDerived = useMemo(
    () => !!user?.email && !user?.full_name?.trim() && suggestedName.length > 0,
    [user?.email, user?.full_name, suggestedName],
  );

  /**
   * Hydrate, in strict priority order, and only into fields that are empty:
   *   1. this student's own saved answers (local draft from a previous pass)
   *   2. the signed-in account's name, as a suggestion
   *
   * Everything still starts empty, so a signed-out first-time visitor sees
   * genuinely blank fields and a returning student sees their own answers. No
   * step is pre-advanced: the student still walks the flow, they just do not
   * have to re-type what they already told us.
   */
  useEffect(() => {
    setTouched(true);
  }, [user?.id]);

  useEffect(() => {
    if (!touched) return;
    const draft = user?.id ? readLocalProfile(user.id) : null;

    setData((prev) => {
      const next: WizardData = { ...prev, weights: { ...prev.weights } };
      if (draft) {
        if (typeof draft.fullName === "string" && !next.fullName) next.fullName = draft.fullName;
        if (typeof draft.stage === "string" && !next.stage) next.stage = draft.stage;
        if (Array.isArray(draft.goals) && next.goals.length === 0) next.goals = draft.goals;
        if (Array.isArray(draft.disciplines) && next.disciplines.length === 0) {
          next.disciplines = draft.disciplines;
        }
        if (draft.weights && typeof draft.weights === "object") {
          for (const [k, v] of Object.entries(draft.weights)) {
            if (k in next.weights && typeof v === "number") {
              next.weights[k as keyof WizardData["weights"]] = v;
            }
          }
        }
        if (typeof draft.budgetBand === "string" && !next.budgetBand) next.budgetBand = draft.budgetBand;
        if (Array.isArray(draft.geography) && next.geography.length === 0) next.geography = draft.geography;
        if (typeof draft.targetField === "string" && !next.targetField) next.targetField = draft.targetField;
        if (Array.isArray(draft.dreamInstitutions) && next.dreamInstitutions.length === 0) {
          next.dreamInstitutions = draft.dreamInstitutions;
        }
        if (typeof draft.immediateFocus === "string" && !next.immediateFocus) {
          next.immediateFocus = draft.immediateFocus;
        }
        if (typeof draft.exploreFirst === "boolean") next.exploreFirst = draft.exploreFirst;
      }
      // Applied last and only when still blank, so a restored draft always
      // wins over the account-name suggestion.
      if (suggestedName && !next.fullName) next.fullName = suggestedName;
      return next;
    });
  }, [touched, user?.id, suggestedName]);

  const [searchQuery, setSearchQuery] = useState("");

  /** Free-text institution the student is typing, not yet added. */
  const [customInstitution, setCustomInstitution] = useState("");

  const addCustomInstitution = () => {
    const name = customInstitution.trim();
    if (!name) return;
    if (!data.dreamInstitutions.includes(name)) {
      setData({ ...data, dreamInstitutions: [...data.dreamInstitutions, name] });
    }
    setCustomInstitution("");
  };

  /** Result of the last "Save & exit" click, shown in place of the button label. */
  const [draftStatus, setDraftStatus] = useState("Save & exit");

  /**
   * Opt-in example answers, behind an explicit click.
   *
   * `isExample` is what keeps this from becoming the bug again. It is false on
   * load and only true because a person pressed the button on the welcome
   * screen. It is NOT carried on `WizardData`, so it cannot be persisted as a
   * property of the profile — the caller receives a normal-looking answer set
   * and decides separately, and `onboard/page.tsx` refuses to save an example
   * to an account. Clearing the example restores genuine blanks rather than
   * leaving a half-example behind.
   */
  const [isExample, setIsExample] = useState(false);

  const loadExampleProfile = () => {
    if (isExample) {
      setData(EMPTY_WIZARD_DATA);
      setIsExample(false);
      return;
    }
    setData({
      fullName: "Sample Student",
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
    setIsExample(true);
  };

  /** Per-step requirements. `next` is blocked, with a visible reason. */
  const stepRequirements: Record<number, StepField[]> = useMemo(
    () => ({
      1: ["fullName"],
      2: ["stage"],
      3: ["goals"],
      4: ["disciplines"],
      6: ["budgetBand"],
      7: ["targetField", "immediateFocus"],
    }),
    [],
  );

  const isBlank = (field: StepField): boolean => {
    switch (field) {
      case "goals":
      case "disciplines":
        return data[field].length === 0;
      case "fullName":
      case "stage":
      case "budgetBand":
      case "targetField":
      case "immediateFocus":
        return data[field].trim().length === 0;
    }
  };

  const missingForStep = (index: number): StepField[] =>
    (stepRequirements[index] ?? []).filter(isBlank);

  const stepBlocked = missingForStep(step).length > 0;

  const updateWeight = (key: keyof WizardData["weights"], val: number) => {
    setData((prev) => ({
      ...prev,
      weights: { ...prev.weights, [key]: val },
    }));
  };

  /**
   * Which factor currently ranks highest, and whether the student has moved any
   * slider at all. With every weight at the neutral 50 there is no ranking to
   * report, and saying "Career outcomes" because it happened to be first in
   * the list would be the same mistake as the old hardcoded "High Weight" badge.
   */
  const { topWeightKey, isWeightsNeutral } = useMemo(() => {
    const entries = Object.entries(data.weights) as [keyof WizardData["weights"], number][];
    const max = Math.max(...entries.map(([, v]) => v));
    const min = Math.min(...entries.map(([, v]) => v));
    const top = entries.find(([, v]) => v === max);
    return {
      topWeightKey: (top?.[0] ?? "career_outcomes") as string,
      isWeightsNeutral: max === min,
    };
  }, [data.weights]);

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

  const LAST_STEP = 7;

  /**
   * The completion path validates rather than trusting whatever is in state.
   *
   * `onComplete` used to fire whenever the student reached the last step, so a
   * profile could be built — and persisted, and turned into a report — out of
   * entirely unanswered fields. Every personal field is re-checked here
   * against the same requirement table the Next button uses, so there is one
   * definition of "answered" rather than two that can drift.
   */
  const handleNext = () => {
    const missing = missingForStep(step);
    if (missing.length > 0) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);

    if (step < LAST_STEP) {
      setStep(step + 1);
      return;
    }

    // Belt and braces: the last step is also where the profile is finished, so
    // re-validate the fields collected on earlier steps before handing off. A
    // field that was answered and then cleared via Back should not slip through.
    const outstanding = Object.entries(stepRequirements)
      .flatMap(([index, fields]) => (Number(index) === step ? [] : fields))
      .filter(isBlank);
    if (outstanding.length > 0) {
      setShowValidation(true);
      return;
    }

    onComplete({
      ...data,
      fullName: data.fullName.trim(),
      targetField: data.targetField.trim(),
    });
  };

  const handleBack = () => {
    if (step > 0) {
      setShowValidation(false);
      setStep(step - 1);
    }
  };

  /**
   * "Save & exit" now does something.
   *
   * It previously opened an `alert()` saying the draft was saved
   * automatically, which was a confirmation for a write that did not exist.
   * Now it writes the answers to the per-user local draft, and reports whether
   * that actually worked. An example profile is never written — storing it
   * would put a placeholder name into a real person's saved state.
   */
  const handleSaveDraft = () => {
    if (isExample) {
      setDraftStatus("Example not saved");
      return;
    }
    if (!user?.id) {
      setDraftStatus("Sign in to save");
      return;
    }
    writeLocalProfile(user.id, data);
    setDraftStatus("Draft saved");
  };

  // -------------------------------------------------------------------------
  // SCREEN 01: Welcome / Pre-Onboarding
  // -------------------------------------------------------------------------
  if (step === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-zinc-950 font-sans animate-fade-slide-up">
        {/* Top Header */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200/80 bg-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center text-white font-bold text-[10px]">
              OS
            </div>
            <span className="font-bold text-sm text-zinc-900 tracking-tight">VividhEdu</span>
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

          {/* Black CTA Button with smooth hover and click feedback */}
          <button
            onClick={() => setStep(1)}
            className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-black hover:bg-zinc-800 active:scale-[0.98] text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
          >
            <span>Get started</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
          </button>

          <p className="text-zinc-400 text-xs mt-3 mb-8">
            About 3 minutes · You can change your answers later
          </p>

          {/*
            The "Active Session Profile" card that used to sit here described a
            session that did not exist: a hardcoded "Undergraduate & Career
            Trajectory" at "#SYS-01", shown to a first-time visitor who had not
            answered a single question. It was the visible tip of the same
            fabricated persona that the wizard state was seeded with, so it is
            replaced by the real state of this browser: who is signed in, if
            anyone.
          */}
          <div className="w-full max-w-md bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm relative overflow-hidden text-left">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-pink-400 to-rose-400" />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
                  <Sliders size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-900">
                      {user ? "Signed in" : "Not signed in"}
                    </span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full inline-block ${
                        user ? "bg-emerald-500" : "bg-zinc-300"
                      }`}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 truncate block">
                    {user
                      ? `Answers will be saved to ${user.email}`
                      : "Your answers stay on this device unless you sign in."}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/*
            Demo / illustration mode.

            A worked example is a legitimate thing to offer — it is how a
            visitor can see the shape of the output before committing three
            minutes. What is not legitimate is the previous arrangement, where
            the example was also the default and nobody was told which one they
            were looking at. So it lives behind an explicit click, it is
            labelled as an example at the point of the click, and the whole
            answer set it produces is tagged so every later screen can keep
            saying so.
          */}
          {isExample && (
            <div className="w-full max-w-md mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg border border-amber-300 bg-amber-50 text-left">
              <FlaskConical size={14} className="text-amber-700 mt-0.5 shrink-0" />
              <p className="text-[11px] text-amber-900 leading-relaxed">
                <strong className="font-semibold">Example profile loaded.</strong> These are
                sample answers for illustration, not yours. Clear them and answer for yourself —
                an example profile is never saved to an account.
              </p>
            </div>
          )}

          <button
            onClick={loadExampleProfile}
            className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-700 underline underline-offset-2 decoration-dotted transition cursor-pointer"
          >
            {isExample ? "Clear example and start blank" : "Want to see an example first?"}
          </button>
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
  // SCREENS 02 - 08: Shared Layout Shell
  // -------------------------------------------------------------------------
  const stepMeta = [
    { title: "First, what should we call you?", sub: "This is the name that goes on your report and your profile. It is yours to change at any time.", badge: "IDENTITY", pct: 10 },
    { title: "Where are you in your journey?", sub: "This helps us calibrate opportunities, college timelines, and decision frameworks.", badge: "STAGE", pct: 22 },
    { title: "What brought you here?", sub: "Select everything that applies to your goals today. We will calibrate your workspace accordingly.", badge: "WORKSPACE CALIBRATION", pct: 35 },
    { title: "What could you see yourself spending years learning about?", sub: "Choose disciplines or topics that spark your curiosity. We use this to surface tailored mentors and research opportunities.", badge: "CURIOSITY DOMAINS", pct: 48 },
    { title: "When you make a big decision, what matters most?", sub: "Drag to order or adjust relative importance. VividhEdu uses this to calculate personalized ROI.", badge: "DECISION WEIGHTS", pct: 65 },
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
          <span className="font-bold text-sm text-zinc-900 tracking-tight">VividhEdu</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-semibold ml-1">
            v2.4
          </span>
        </div>

        {/* Progress tracker. Was hardcoded "of 6" and is now the real step
            count, since the identity screen was added as a step. */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-xs font-medium text-zinc-500">Step {step} of {LAST_STEP}</span>
          <div className="w-36 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-300"
              style={{ width: `${currentMeta.pct}%` }}
            />
          </div>
          <span className="text-xs font-mono text-zinc-400 font-medium">{currentMeta.pct}%</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/*
            This used to `alert("Session draft saved automatically.")` — a
            confirmation for a save that had not happened and could not happen.
            The draft now really is in localStorage, so the button does the real
            thing and the message reflects it. For a signed-in student the
            account copy is the record; this is the local convenience draft.
          */}
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-zinc-700 font-medium transition cursor-pointer"
          >
            <Bookmark size={12} className="text-zinc-400" />
            <span>{draftStatus}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main key={step} className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 animate-fade-slide-up">
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
        {/* SCREEN 02: Identity — the student's own name */}
        {/* ----------------------------------------------------------------- */}
        {step === 1 && (
          <div className="space-y-5 max-w-xl mx-auto">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <label
                htmlFor="student-full-name"
                className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold mb-2"
              >
                YOUR NAME
              </label>
              <input
                id="student-full-name"
                type="text"
                autoComplete="name"
                maxLength={120}
                value={data.fullName}
                onChange={(e) => setData({ ...data, fullName: e.target.value })}
                placeholder="Type your name"
                aria-invalid={showValidation && !data.fullName.trim()}
                aria-describedby="student-name-help"
                className={`w-full px-3.5 py-3 bg-slate-50 border rounded-lg text-base font-semibold text-zinc-900 focus:outline-none focus:border-zinc-400 ${
                  showValidation && !data.fullName.trim()
                    ? "border-rose-400"
                    : "border-slate-200"
                }`}
              />

              {/*
                The suggestion is only ever a suggestion. `mapSupabaseUser`
                falls back to the email's local part when an OAuth provider
                gives no name, so a GitHub account with no profile name is
                offered "octocat" — a real fact about the account, but not
                necessarily the name this student wants on a report. So it is
                labelled, and the field above it is always editable and never
                disabled.
              */}
              {isEmailDerived && (
                <p
                  id="student-name-help"
                  className="mt-2.5 flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-2 leading-relaxed"
                >
                  <HelpCircle size={12} className="mt-0.5 shrink-0" />
                  <span>
                    We pre-filled this from your email address. Change it to whatever you want to
                    be called.
                  </span>
                </p>
              )}

              <p id="student-name-help" className="mt-2.5 text-[11px] text-zinc-500 leading-relaxed">
                {user ? (
                  <>
                    This is saved to your account ({user.email}) so your profile is yours every
                    time you sign in. Nothing else about you is pre-filled — every screen below
                    starts blank and asks you.
                  </>
                ) : (
                  <>
                    You are not signed in, so this stays on this device.{" "}
                    <Link href="/onboard" className="underline underline-offset-2">
                      Sign in
                    </Link>{" "}
                    to keep your profile between visits.
                  </>
                )}
              </p>
            </div>

            {isExample && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-amber-300 bg-amber-50">
                <FlaskConical size={14} className="text-amber-700 mt-0.5 shrink-0" />
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  <strong className="font-semibold">This is an example profile.</strong> "Sample
                  Student" is a placeholder to demonstrate the flow. Replace it with your own name,
                  or go back and clear the example entirely.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* SCREEN 03: Where are you in your journey? */}
        {/* ----------------------------------------------------------------- */}
        {step === 2 && (
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
        {/* SCREEN 04: What brought you here? */}
        {/* ----------------------------------------------------------------- */}
        {step === 3 && (
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
        {/* SCREEN 05: What could you see yourself spending years learning about? */}
        {/* ----------------------------------------------------------------- */}
        {step === 4 && (
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
        {/* SCREEN 06: Decision Weights */}
        {/* ----------------------------------------------------------------- */}
        {step === 5 && (
          <div className="space-y-4">
            {/*
              The "High Weight" badge is now driven by the slider rather than
              hardcoded onto Career outcomes. It was a static `high: true` on
              row #1, so every student was told career outcomes was their top
              priority — which happened to be true of the persona this screen
              was written for and of nobody else.
            */}
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {[
                { key: "career_outcomes", label: "Career outcomes", desc: "Placements, salary upside, career trajectory", num: "#1" },
                { key: "cost_affordability", label: "Cost & Affordability", desc: "Tuition, living expenses, scholarships & net financial strain", num: "#2" },
                { key: "prestige", label: "Prestige & Alumni", desc: "Institutional reputation, global network reach", num: "#3" },
                { key: "academic_rigor", label: "Learning & Rigor", desc: "Curriculum freedom, faculty quality, research labs", num: "#4" },
                { key: "location", label: "Location & Environment", desc: "City ecosystem, peer group culture, campus lifestyle", num: "#5" },
                { key: "flexibility", label: "Flexibility & Minor Options", desc: "Dual majors, easy transfers, interdisciplinary scope", num: "#6" },
                { key: "opportunities", label: "Curated Opportunities", desc: "Internship pipelines, incubators, venture funds", num: "#7" },
              ].map((row) => {
                const value = data.weights[row.key as keyof WizardData["weights"]];
                const isTop = value >= 70;
                return (
                  <div key={row.key} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-mono font-bold text-zinc-400 mt-0.5">{row.num}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-900">{row.label}</span>
                          {isTop && (
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
                        value={value}
                        onChange={(e) => updateWeight(row.key as keyof WizardData["weights"], parseInt(e.target.value))}
                        aria-label={`${row.label} weight`}
                        className="weight-slider flex-1"
                      />
                      <span className="font-mono text-xs font-bold text-zinc-800 w-8 text-right">
                        {value}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/*
              This said "Balanced Growth Profile · Real-time Simulation" and
              "ROI intelligence will prioritize net career return against
              upfront capital" — a named output of a simulation that runs later,
              on a page where nothing is simulated. With every slider at the
              neutral 50 that a fresh student now sees, the card would have
              confidently declared their profile "Balanced" before they had
              expressed a preference at all.

              It now reports the two things that are actually true: which
              factor currently ranks highest, and that every weight starts at
              the neutral midpoint until moved.
            */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center gap-3 text-xs">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <TrendingUp size={16} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                  <span>
                    {isWeightsNeutral
                      ? "No ranking set yet"
                      : `Top priority: ${WEIGHT_LABELS[topWeightKey]}`}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                </div>
                <p className="text-zinc-500 text-[11px] mt-0.5">
                  {isWeightsNeutral
                    ? "Every factor starts at an even 50 so nothing is assumed about your priorities. Move whichever ones matter."
                    : "These weights are used to order the programmes in your report."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* SCREEN 07: Reality / Financial & Geographic Constraints */}
        {/* ----------------------------------------------------------------- */}
        {step === 6 && (
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

            {/*
              This panel was a "FEASIBILITY METRIC · Live Feed" with a pulsing
              dot, showing Cohort Reachability 84.2%, Cost-to-Merit Alignment
              "Optimized" at 92%, and Visa Pathway Viability "High (Tier 2/PSW)"
              at 78% — three constants that never referenced the budget band or
              geography the student had just picked, and could not, because
              nothing computed them. The "Live Feed" badge and the pulse were
              animation on a static bar.

              Below that, the sensitivity box read "Your $35k–$65k band unlocks
              18 Russell Group & European English-taught cohorts with high grant
              yields" — a count of 18, for a specific band, on a page about
              Indian colleges, that no code could produce. It restated the
              persona's budget band as though the student had chosen it.

              So the panel now shows what is actually known: the parameters the
              student has set, and an explicit statement that feasibility is
              computed later, against real programme data. No numbers, no pulse.
            */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-zinc-400">
                    YOUR PARAMETERS
                  </span>
                  {/*
                    Counts fields the student has actually ANSWERED, not keys
                    that exist. The previous expression counted
                    `Object.keys(data)` minus three, which is a constant 7 for
                    every student whether they had answered anything or not —
                    so an entirely blank form rendered "7 set".
                  */}
                  {(() => {
                    const answered = [
                      data.stage,
                      data.goals.length ? "y" : "",
                      data.disciplines.length ? "y" : "",
                      data.budgetBand,
                      data.geography.length ? "y" : "",
                      data.targetField.trim(),
                      data.immediateFocus,
                    ].filter((v) => v && String(v).length > 0).length;
                    return (
                      <span className="text-[10px] font-mono text-zinc-400 font-semibold">
                        {answered} of 7 answered
                      </span>
                    );
                  })()}
                </div>

                <dl className="space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-zinc-600">Education budget</dt>
                    <dd className="font-mono font-bold text-zinc-900 text-right">
                      {BUDGET_LABELS[data.budgetBand] ?? <span className="text-zinc-400">Not set</span>}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-zinc-600">Target regions</dt>
                    <dd className="font-mono font-bold text-zinc-900 text-right">
                      {data.geography.length === 0 ? (
                        <span className="text-zinc-400">Not set</span>
                      ) : (
                        <span className="text-[11px]">
                          {data.geography.map((g) => GEOGRAPHY_LABELS[g] ?? g).join(", ")}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-zinc-600">Journey stage</dt>
                    <dd className="font-mono font-bold text-zinc-900 text-right">
                      {STAGE_LABELS[data.stage] ?? <span className="text-zinc-400">Not set</span>}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-zinc-600">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-800 mb-1">
                    <Sliders size={12} />
                    <span>What happens next</span>
                  </div>
                  <p className="leading-relaxed">
                    These parameters are checked against the programme and cost data we hold when
                    your report is built. We do not show a feasibility score here, because we have
                    not calculated one yet.
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
                  <li>Budget bands are in USD per year, as shown. The report converts to INR.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* SCREEN 08: What are you working toward? */}
        {/* ----------------------------------------------------------------- */}
        {step === 7 && (
          <div className="space-y-5">
            {/*
              Primary Target Field.

              This field was pre-filled with "Quantitative Economics & Tech
              Policy" — the persona's target — under a "High Precision" badge and
              a caption claiming it was "Synthesized from prior transcript
              metrics and preliminary research preferences". We hold no
              transcript and read no metrics, so that sentence described a
              calculation that does not exist, and it described the persona's
              field as though it were derived from the student's own records.
              The input now starts empty and the caption tells the truth: this
              is what you type, and it is used as written.
            */}
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                  PRIMARY TARGET FIELD (Discipline / Focus Domain)
                </span>
                {data.targetField.trim() && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    Set
                  </span>
                )}
              </div>
              <input
                type="text"
                value={data.targetField}
                maxLength={120}
                onChange={(e) => setData({ ...data, targetField: e.target.value })}
                placeholder="e.g. Computer science, or data science and economics"
                aria-label="Primary target field"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-zinc-900 focus:outline-none focus:border-zinc-400 placeholder:text-zinc-300"
              />
              <p className="text-[11px] text-zinc-400 mt-1.5">
                Type it yourself — we have no transcript to infer this from, so whatever you enter
                is what your report uses.
              </p>
            </div>

            {/*
              The chip list is a fixed set of five named universities, so a
              student whose targets are IIT Bombay or a local college cannot
              enter their own. They are suggestions, not options: the list was
              the persona's targets (LSE / Warwick / Ashoka) presented as the
              available choices, and "Ashoka University" sat beside two UK
              universities in a product about Indian colleges. They are now
              clearly labelled as examples, and there is a free-text field so
              the answer is never limited to our list.
            */}
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                  DREAM INSTITUTIONS OR TRAJECTORIES
                </span>
                <span className="text-[11px] text-zinc-400">Optional — add your own below</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {["IIT Bombay", "IIT Delhi", "NIT Trichy", "Ashoka University", "SRCC", "BITS Pilani"].map((col) => {
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
              </div>

              {/*
                Free text, so the answer is not limited to our six chips.

                These six replaced LSE / Warwick / Ashoka / Berkeley / Oxford
                because the old list put two UK universities in a product about
                Indian colleges and was the persona's own target list. A fixed
                list is still a fixed list, so this is where anything else goes
                — the chips are shortcuts, not the form.
              */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={customInstitution}
                  onChange={(e) => setCustomInstitution(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    addCustomInstitution();
                  }}
                  placeholder="Add another institution and press Enter"
                  aria-label="Add another institution"
                  className="flex-1 min-w-[200px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 placeholder:text-zinc-300"
                />
                <button
                  onClick={addCustomInstitution}
                  disabled={!customInstitution.trim()}
                  className="px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-zinc-700 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Add
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
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition dashed-ring cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            <span>
              {step === 1 && (data.fullName.trim() ? "Name captured" : "Waiting for your name")}
              {step === 2 && "Stage selection active"}
              {step === 3 && `${data.goals.length} categories selected`}
              {step === 4 && `${data.disciplines.length} disciplines pinned`}
              {step === 5 && "Weights calibrated"}
              {step === 6 && "Feasibility models synchronized"}
              {step === 7 && "Profile ready for synthesis"}
            </span>
          </div>

          {/* The single most important new affordance: say what is missing,
              rather than silently not advancing. */}
          {showValidation && stepBlocked && (
            <span
              role="alert"
              className="text-[11px] text-rose-600 font-medium"
            >
              {missingForStep(step)
                .map((f) => FIELD_LABELS[f])
                .join(" and ")}{" "}
              {missingForStep(step).length > 1 ? "are" : "is"} required to continue
            </span>
          )}
        </div>

        <button
          onClick={handleNext}
          aria-disabled={stepBlocked}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-semibold transition dashed-ring ${
            stepBlocked
              ? "bg-zinc-200 text-zinc-500 cursor-not-allowed"
              : "bg-black text-white hover:bg-zinc-800 cursor-pointer"
          }`}
        >
          <span>{step === LAST_STEP ? "Build my profile →" : "Continue"}</span>
          <ArrowRight size={14} />
        </button>
      </footer>
    </div>
  );
};
