import React, { useState } from 'react';
import { Clock, ArrowRight, RefreshCw, ExternalLink, ShieldCheck, Flame } from 'lucide-react';

export interface WaveCard {
  id: string;
  category: 'competitions' | 'admissions' | 'research' | 'scholarships' | 'skills';
  categoryLabel: string;
  badgeLabel: string;
  badgeType: 'match' | 'relevance' | 'tag';
  title: string;
  body: string;
  metaLeft: string;
  isUrgent?: boolean;
  actionLabel: string;
  actionIcon?: 'arrow' | 'refresh' | 'external' | 'shield';
}

const DEFAULT_WAVES: WaveCard[] = [
  {
    id: 'w1',
    category: 'competitions',
    categoryLabel: 'COMPETITIONS',
    badgeLabel: '98% Match',
    badgeType: 'match',
    title: '3 Economics & Quantitative Research Competitions Opened',
    body: 'SSRN/ISEF-affiliated paper competitions accepting pre-university submissions in microeconomic modeling and econometrics.',
    metaLeft: 'Deadline in 14 days',
    isUrgent: true,
    actionLabel: 'Review Brief',
    actionIcon: 'arrow',
  },
  {
    id: 'w2',
    category: 'admissions',
    categoryLabel: 'ADMISSIONS',
    badgeLabel: 'High Relevance',
    badgeType: 'relevance',
    title: 'LSE & Warwick Updated International Admissions Matrix for Economics',
    body: 'Stricter weight placed on standardized higher math prerequisites and quantitative coursework for 2025-26 entry.',
    metaLeft: 'Impact: Shifts SAT priority',
    actionLabel: 'Recalculate Odds',
    actionIcon: 'refresh',
  },
  {
    id: 'w3',
    category: 'research',
    categoryLabel: 'RESEARCH',
    badgeLabel: 'Faculty Lab',
    badgeType: 'tag',
    title: 'Ashoka Computational Economics Mentorship Lab accepting 3 fellows',
    body: 'Direct faculty co-author opportunity on Indian labor dynamics. Directly addresses your identified co-authorship gap.',
    metaLeft: 'Matches Quantitative Interest',
    actionLabel: 'Draft Application',
    actionIcon: 'external',
  },
  {
    id: 'w4',
    category: 'scholarships',
    categoryLabel: 'SCHOLARSHIPS',
    badgeLabel: 'Global Bracket',
    badgeType: 'tag',
    title: 'Need-Aware Global Merit Fellowship ($24k/yr) opens rolling review',
    body: 'Non-binding early award candidate criteria align with your profile financial parameters ($35k~$65k budget constraint).',
    metaLeft: 'Rolling Review Open',
    actionLabel: 'Verify Eligibility',
    actionIcon: 'shield',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'research', label: 'Research' },
  { id: 'competitions', label: 'Competitions' },
  { id: 'admissions', label: 'Admissions' },
  { id: 'scholarships', label: 'Scholarships' },
  { id: 'skills', label: 'Skills' },
];

export const RecentWavesFeed: React.FC<{
  onAction?: (wave: WaveCard) => void;
}> = ({ onAction }) => {
  const [activeTab, setActiveTab] = useState<string>('all');

  const filtered = activeTab === 'all'
    ? DEFAULT_WAVES
    : DEFAULT_WAVES.filter((w) => w.category === activeTab);

  return (
    <div className="w-full">
      {/* Header with Title, Subtitle, and Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E11D48]" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Recent waves
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time developments mapped to your profile vectors &amp; roadmap.
          </p>
        </div>

        {/* Category Pills (Screen 11) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => {
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`text-xs px-3 py-1 rounded-full transition-all font-medium ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2x2 Grid of Wave Cards (Screen 11) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((wave) => (
          <div
            key={wave.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Badges Top Row */}
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {wave.categoryLabel}
                </span>

                {wave.badgeType === 'match' && (
                  <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {wave.badgeLabel}
                  </span>
                )}
                {wave.badgeType === 'relevance' && (
                  <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                    {wave.badgeLabel}
                  </span>
                )}
                {wave.badgeType === 'tag' && (
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full">
                    {wave.badgeLabel}
                  </span>
                )}
              </div>

              {/* Title */}
              <h4 className="text-xs font-bold text-slate-900 leading-snug">
                {wave.title}
              </h4>

              {/* Body */}
              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                {wave.body}
              </p>
            </div>

            {/* Footer Row */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
              <span className={`text-[11px] font-mono flex items-center gap-1 ${
                wave.isUrgent ? 'text-rose-600 font-medium' : 'text-slate-500'
              }`}>
                {wave.isUrgent && <Clock size={12} className="text-rose-600" />}
                {wave.metaLeft}
              </span>

              <button
                onClick={() => onAction?.(wave)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 transition-colors shadow-2xs"
              >
                <span>{wave.actionLabel}</span>
                {wave.actionIcon === 'arrow' && <ArrowRight size={12} />}
                {wave.actionIcon === 'refresh' && <RefreshCw size={12} />}
                {wave.actionIcon === 'external' && <ExternalLink size={12} />}
                {wave.actionIcon === 'shield' && <ShieldCheck size={12} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
