'use client';

import React, { useState } from 'react';
import { School, BookOpen, GraduationCap, Compass, ChevronRight, ChevronLeft, ArrowRight, CheckCircle2, ShieldCheck, Globe, DollarSign } from 'lucide-react';
import { DecisionWeightsSlider } from './DecisionWeightsSlider';
import { CuriosityDomainPicker } from './CuriosityDomainPicker';

export interface WizardData {
  fullName: string;
  class: string;
  school: string;
  goals: string[];
  domains: string[];
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
  dreamColleges: string;
  northStar: string;
}

interface OnboardWizardProps {
  onComplete: (data: WizardData) => void;
}

const GOALS = [
  { id: 'college_discovery', label: 'College Discovery', icon: '🎓' },
  { id: 'career_choice', label: 'Career Clarity', icon: '💼' },
  { id: 'profile_building', label: 'Profile Building', icon: '🚀' },
  { id: 'internships', label: 'Internships', icon: '🔍' },
  { id: 'research', label: 'Research', icon: '🔬' },
  { id: 'projects', label: 'Projects', icon: '💡' },
  { id: 'confused', label: "I'm confused — Human First", icon: '❓' },
];

const BUDGET_BANDS = [
  { id: '<15k_usd', label: '< $15K USD / yr (< ₹12.5L)' },
  { id: '15-35k', label: '$15K - $35K USD / yr (₹12.5L - ₹30L)' },
  { id: '35-65k', label: '$35K - $65K USD / yr (₹30L - ₹55L)' },
  { id: '65k+', label: '$65K+ USD / yr (> ₹55L)' },
  { id: 'domestic_only', label: 'Domestic India Only (₹3L - ₹15L)' },
];

const GEOGRAPHIES = [
  { id: 'india', label: 'India' },
  { id: 'uk_europe', label: 'UK & Europe' },
  { id: 'us_canada', label: 'US & Canada' },
  { id: 'singapore', label: 'Singapore & Asia' },
  { id: 'anywhere', label: 'Global (Open)' },
];

const DOMAIN_LABELS: Record<string, string> = {
  applied_econometrics: 'Applied Econometrics',
  ml_ai: 'Machine Learning / AI',
  law_constitutional: 'Law & Constitutional Studies',
  medicine_healthcare: 'Medicine & Healthcare',
  quant_finance: 'Quantitative Finance',
  computer_systems: 'Computer Systems',
  design_architecture: 'Design & Architecture',
  behavioural_science: 'Behavioural Science',
  climate_policy: 'Climate & Environmental Policy',
  entrepreneurship: 'Entrepreneurship',
  creative_writing: 'Creative Writing & Media',
  philosophy: 'Philosophy',
  biology_life: 'Biology & Life Sciences',
  public_policy: 'Public Policy',
  data_science: 'Data Science',
  physics_math: 'Physics & Mathematics'
};

export const OnboardWizard: React.FC<OnboardWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    fullName: '',
    class: '',
    school: '',
    goals: [],
    domains: [],
    weights: {
      career_outcomes: 95,
      cost_affordability: 82,
      prestige: 70,
      academic_rigor: 64,
      location: 48,
      flexibility: 40,
      opportunities: 32,
    },
    budgetBand: '35-65k',
    geography: ['uk_europe'],
    dreamColleges: '',
    northStar: '',
  });

  const updateData = (updates: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const updateWeight = (key: keyof WizardData['weights'], value: number) => {
    setData((prev) => ({
      ...prev,
      weights: {
        ...prev.weights,
        [key]: value
      }
    }));
  };

  const nextStep = () => {
    if (step < 6) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const isStep1Valid = data.fullName.trim() !== '' && data.class !== '';
  const isStep2Valid = data.goals.length > 0;
  const isStep3Valid = data.domains.length > 0;
  const isStep5Valid = data.budgetBand !== '' && data.northStar.trim() !== '';

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="animate-in slide-in-from-bottom-4 duration-500 fade-in flex flex-col gap-6">
            <div>
              <div className="kicker-web mb-2">SCREEN 01 · IDENTITY & STAGE</div>
              <h1 className="headline text-2xl sm:text-3xl font-serif font-bold text-white mb-2">
                Your education is a capital asset.
              </h1>
              <p className="headline-sub text-slate-400 text-sm sm:text-base">
                IndiaLens builds your sovereign signal — not a commercial college ranking.
              </p>
            </div>
            
            <div className="flex flex-col gap-5 mt-2">
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Full Name <span className="text-blue-400">*</span>
                </label>
                <input 
                  type="text" 
                  value={data.fullName}
                  onChange={(e) => updateData({ fullName: e.target.value })}
                  className="w-full p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl focus:border-blue-500 outline-none text-white text-base transition"
                  placeholder="e.g. Alex M. or Aryan Sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-3">
                  Journey Phase <span className="text-blue-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: '9-10', label: 'Class 9-10', desc: 'Exploratory Baseline', icon: School },
                    { id: '11-12', label: 'Class 11-12', desc: 'Undergraduate Trajectory', icon: BookOpen },
                    { id: 'college', label: 'College', desc: 'Career & Postgrad Arbitrage', icon: GraduationCap },
                    { id: 'gap', label: 'Gap Year', desc: 'Spike Engineering', icon: Compass }
                  ].map((phase) => {
                    const Icon = phase.icon;
                    const isSelected = data.class === phase.id;
                    return (
                      <button
                        key={phase.id}
                        type="button"
                        onClick={() => updateData({ class: phase.id })}
                        className={`p-4 border rounded-xl transition-all text-left flex items-start gap-3 ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-950/40 shadow-lg shadow-blue-900/20 ring-1 ring-blue-500 text-white' 
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <Icon className={isSelected ? 'text-blue-400' : 'text-slate-500'} size={20} />
                        <div>
                          <span className={`block text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>{phase.label}</span>
                          <span className="block text-[11px] text-slate-500 mt-0.5">{phase.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  School / College Name (Optional)
                </label>
                <input 
                  type="text" 
                  value={data.school}
                  onChange={(e) => updateData({ school: e.target.value })}
                  className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:border-blue-500 outline-none text-white text-sm transition"
                  placeholder="Where do you study currently?"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={nextStep} 
                disabled={!isStep1Valid}
                className="btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-7 py-3 rounded-xl font-semibold transition"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="animate-in slide-in-from-bottom-4 duration-500 fade-in flex flex-col gap-6">
            <div>
              <div className="kicker-web mb-2">SCREEN 02 · STAGE CALIBRATION & INTENT</div>
              <h2 className="headline text-2xl sm:text-3xl font-serif font-bold text-white mb-2">
                What's your primary mission?
              </h2>
              <p className="headline-sub text-slate-400 text-sm sm:text-base">
                Select up to 3 focus vectors to calibrate downstream recommendations.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-2">
              {GOALS.map((goal) => {
                const isSelected = data.goals.includes(goal.id);
                const isMaxReached = data.goals.length >= 3;
                const isDisabled = !isSelected && isMaxReached;

                return (
                  <button
                    key={goal.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      if (isSelected) {
                        updateData({ goals: data.goals.filter(id => id !== goal.id) });
                      } else if (!isMaxReached) {
                        updateData({ goals: [...data.goals, goal.id] });
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-3 rounded-full border transition-all text-xs font-semibold ${
                      isSelected 
                        ? 'bg-blue-950/60 border-blue-500 text-blue-200 shadow-md ring-1 ring-blue-500' 
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                    } ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className="text-base">{goal.icon}</span>
                    <span>{goal.label}</span>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-8 flex justify-between items-center">
              <button onClick={prevStep} className="btn-secondary text-slate-400 hover:text-white flex items-center gap-1 text-xs px-4 py-2 rounded-lg transition">
                <ChevronLeft size={16} /> Back
              </button>
              <button 
                onClick={nextStep} 
                disabled={!isStep2Valid}
                className="btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-7 py-3 rounded-xl font-semibold transition"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="animate-in slide-in-from-bottom-4 duration-500 fade-in flex flex-col gap-6">
            <div>
              <div className="kicker-web mb-2">SCREEN 03 · DISCIPLINARY CLUSTERING</div>
              <h2 className="headline text-2xl sm:text-3xl font-serif font-bold text-white mb-2">
                What genuinely fascinates you?
              </h2>
              <p className="headline-sub text-slate-400 text-sm sm:text-base">
                Skip rigid majors. Pin up to 4 intellectual territories to configure research lab matching.
              </p>
            </div>
            
            <div className="mt-2">
              <CuriosityDomainPicker 
                selected={data.domains} 
                onChange={(domains) => updateData({ domains })} 
                maxSelect={4}
              />
            </div>

            <div className="mt-8 flex justify-between items-center">
              <button onClick={prevStep} className="btn-secondary text-slate-400 hover:text-white flex items-center gap-1 text-xs px-4 py-2 rounded-lg transition">
                <ChevronLeft size={16} /> Back
              </button>
              <button 
                onClick={nextStep} 
                disabled={!isStep3Valid}
                className="btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-7 py-3 rounded-xl font-semibold transition"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="animate-in slide-in-from-bottom-4 duration-500 fade-in flex flex-col gap-6">
            <div>
              <div className="kicker-web mb-2">SCREEN 04 · DECISION WEIGHTS</div>
              <h2 className="headline text-2xl sm:text-3xl font-serif font-bold text-white mb-2">
                What matters most to you?
              </h2>
              <p className="headline-sub text-slate-400 text-sm sm:text-base">
                These dynamic weights parametrize your personal utility function for institutional ranking.
              </p>
            </div>
            
            <div className="flex flex-col gap-3 mt-2 overflow-y-auto max-h-[45vh] pr-2 custom-scrollbar">
              <DecisionWeightsSlider label="Career Outcomes" sublabel="Long-term earnings potential & placement velocity" value={data.weights.career_outcomes} onChange={(v) => updateWeight('career_outcomes', v)} color="#2563EB" />
              <DecisionWeightsSlider label="Cost & Affordability" sublabel="Tuition minimization & education debt avoidance" value={data.weights.cost_affordability} onChange={(v) => updateWeight('cost_affordability', v)} color="#10B981" />
              <DecisionWeightsSlider label="Prestige & Brand" sublabel="Global alumni signaling & institutional pedigree" value={data.weights.prestige} onChange={(v) => updateWeight('prestige', v)} color="#8B5CF6" />
              <DecisionWeightsSlider label="Academic Rigor" sublabel="Intellectual challenge & faculty depth" value={data.weights.academic_rigor} onChange={(v) => updateWeight('academic_rigor', v)} color="#EF4444" />
              <DecisionWeightsSlider label="Location Flexibility" sublabel="Global tech/finance hub proximity & remote options" value={data.weights.location} onChange={(v) => updateWeight('location', v)} color="#F59E0B" />
              <DecisionWeightsSlider label="Schedule Flexibility" sublabel="Ability to pursue independent projects & startups" value={data.weights.flexibility} onChange={(v) => updateWeight('flexibility', v)} color="#0D9488" />
              <DecisionWeightsSlider label="Curated Opportunities" sublabel="Micro-internships, labs & venture capital networks" value={data.weights.opportunities} onChange={(v) => updateWeight('opportunities', v)} color="#F97316" />
            </div>

            <div className="mt-6 flex justify-between items-center border-t border-slate-800 pt-4">
              <button onClick={prevStep} className="btn-secondary text-slate-400 hover:text-white flex items-center gap-1 text-xs px-4 py-2 rounded-lg transition">
                <ChevronLeft size={16} /> Back
              </button>
              <button 
                onClick={nextStep} 
                className="btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-7 py-3 rounded-xl font-semibold transition"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="animate-in slide-in-from-bottom-4 duration-500 fade-in flex flex-col gap-6">
            <div>
              <div className="kicker-web mb-2">SCREEN 05 · REALITY CALIBRATION</div>
              <h2 className="headline text-2xl sm:text-3xl font-serif font-bold text-white mb-2">
                Anchor aspirations in financial reality.
              </h2>
              <p className="headline-sub text-slate-400 text-sm sm:text-base">
                Deterministic feasibility check across budget constraints, geography, and visa pathways.
              </p>
            </div>
            
            <div className="flex flex-col gap-6 mt-2">
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Annual Budget Band <span className="text-blue-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BUDGET_BANDS.map((band) => (
                    <button
                      key={band.id}
                      type="button"
                      onClick={() => updateData({ budgetBand: band.id })}
                      className={`p-3.5 border rounded-xl text-left text-xs transition-all ${
                        data.budgetBand === band.id 
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 font-semibold shadow-md ring-1 ring-emerald-500' 
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {band.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Deterministic Feasibility Feedback (from PRD Page 08) */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Live Cohort Reachability Feedback</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded">
                    84.2% Solvency
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {/* [AI-CoLab: Cursor] Show the human label, and tailor copy for the domestic band */}
                  Based on your budget selection ({BUDGET_BANDS.find(b => b.id === data.budgetBand)?.label || data.budgetBand}), the feasibility engine confirms solvency across {data.budgetBand === 'domestic_only' ? 'top-tier Indian institutional cohorts with strong domestic placement outcomes' : '18 Russell Group & European cohorts with high post-study work visa (PSW) retention odds'}.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Target Geographies
                </label>
                <div className="flex flex-wrap gap-2">
                  {GEOGRAPHIES.map((geo) => {
                    const isSelected = data.geography.includes(geo.id);
                    return (
                      <button
                        key={geo.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            updateData({ geography: data.geography.filter(id => id !== geo.id) });
                          } else {
                            updateData({ geography: [...data.geography, geo.id] });
                          }
                        }}
                        className={`px-3.5 py-2 border rounded-full text-xs font-medium transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-950/60 text-blue-200 shadow-sm' 
                            : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {geo.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Your North Star Target Program <span className="text-blue-400">*</span>
                </label>
                <input 
                  type="text" 
                  value={data.northStar}
                  onChange={(e) => updateData({ northStar: e.target.value })}
                  className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:border-blue-500 outline-none text-white text-sm transition"
                  placeholder="e.g. LSE Economics BSc, Ashoka Liberal Arts, or IIT Bombay CSE"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center border-t border-slate-800 pt-4">
              <button onClick={prevStep} className="btn-secondary text-slate-400 hover:text-white flex items-center gap-1 text-xs px-4 py-2 rounded-lg transition">
                <ChevronLeft size={16} /> Back
              </button>
              <button 
                onClick={nextStep} 
                disabled={!isStep5Valid}
                className="btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-7 py-3 rounded-xl font-semibold transition"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="animate-in slide-in-from-bottom-4 duration-700 fade-in flex flex-col items-center justify-center text-center gap-5 py-6">
            <div className="w-16 h-16 bg-blue-950/80 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-800/80 shadow-lg shadow-blue-900/20">
              <CheckCircle2 size={32} />
            </div>
            
            <div className="kicker-web">SCREEN 06 · WORKSPACE SETUP READY</div>
            <h2 className="headline text-3xl font-serif font-bold text-white">
              Ready to synthesize.
            </h2>
            <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
              We have calibrated your capital constraints, curiosity vectors, and decision function. IndiaLens will now execute the multi-agent synthesis protocol.
            </p>
            
            <div className="glass-card p-5 bg-slate-950/90 border border-slate-800 rounded-xl w-full max-w-md text-left mt-2 shadow-xl">
              <div className="text-[10px] text-blue-400 font-mono mb-3 tracking-wider uppercase border-b border-slate-800 pb-2">
                Sovereign Calibration Profile
              </div>
              <ul className="text-xs space-y-2.5 font-medium text-slate-300">
                <li className="flex justify-between items-center">
                  <span className="text-slate-400">Student</span> 
                  <span className="font-semibold text-white font-mono">{data.fullName}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-slate-400">Phase</span>
                  {/* [AI-CoLab: Cursor] Show the human label, not the raw id */}
                  <span className="font-semibold bg-slate-800 text-blue-300 px-2 py-0.5 rounded text-[11px] font-mono">
                    {{ "9-10": "Class 9-10", "11-12": "Class 11-12", college: "College", gap: "Gap Year" }[data.class] || data.class}
                  </span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-slate-400">North Star</span> 
                  <span className="text-right truncate max-w-[200px] text-slate-200">{data.northStar || 'N/A'}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-slate-400">Pinned Domains</span> 
                  <span className="text-right truncate max-w-[200px] text-emerald-400 font-mono">
                    {data.domains.map(d => DOMAIN_LABELS[d] || d).slice(0, 2).join(', ') || 'N/A'}
                  </span>
                </li>
              </ul>
            </div>
            
            <div className="mt-4 flex flex-col items-center gap-3 w-full">
              <button 
                onClick={() => onComplete(data)}
                className="btn-primary w-full max-w-md flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold text-base transition shadow-xl shadow-blue-900/40 hover:-translate-y-0.5 cursor-pointer"
              >
                Synthesize Profile <ArrowRight size={18} />
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span className="pulse-dot" />
                <span>Deterministic Synthesis Time: ~1.2s across 1,420 cohorts</span>
              </div>
            </div>
            
            <div className="mt-2 flex w-full justify-center">
               <button onClick={prevStep} className="btn-secondary text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1 transition">
                 <ChevronLeft size={14} /> Review Answers
               </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 md:p-8 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl">
      <div className="flex justify-center gap-2.5 mb-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div 
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === step ? 'bg-blue-500 scale-125' : i < step ? 'bg-blue-700' : 'bg-slate-800'
            }`}
          />
        ))}
      </div>
      
      <div className="w-full h-1 bg-slate-800 rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500 ease-in-out"
          style={{ width: `${(step / 6) * 100}%` }}
        />
      </div>

      <div className="min-h-[420px]">
        {renderStep()}
      </div>
    </div>
  );
};
