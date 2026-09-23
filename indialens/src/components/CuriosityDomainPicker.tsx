'use client';

import React from 'react';

interface CuriosityDomainPickerProps {
  selected: string[];
  onChange: (domains: string[]) => void;
  maxSelect?: number; // default 4
}

const DOMAINS = [
  { id: 'applied_econometrics', label: 'Applied Econometrics', icon: '📊' },
  { id: 'ml_ai', label: 'Machine Learning / AI', icon: '🤖' },
  { id: 'law_constitutional', label: 'Law & Constitutional Studies', icon: '⚖️' },
  { id: 'medicine_healthcare', label: 'Medicine & Healthcare', icon: '🏥' },
  { id: 'quant_finance', label: 'Quantitative Finance', icon: '📈' },
  { id: 'computer_systems', label: 'Computer Systems', icon: '💻' },
  { id: 'design_architecture', label: 'Design & Architecture', icon: '🎨' },
  { id: 'behavioural_science', label: 'Behavioural Science', icon: '🧠' },
  { id: 'climate_policy', label: 'Climate & Environmental Policy', icon: '🌿' },
  { id: 'entrepreneurship', label: 'Entrepreneurship', icon: '🚀' },
  { id: 'creative_writing', label: 'Creative Writing & Media', icon: '✍️' },
  { id: 'philosophy', label: 'Philosophy', icon: '🔍' },
  { id: 'biology_life', label: 'Biology & Life Sciences', icon: '🧬' },
  { id: 'public_policy', label: 'Public Policy', icon: '🏛️' },
  { id: 'data_science', label: 'Data Science', icon: '📉' },
  { id: 'physics_math', label: 'Physics & Mathematics', icon: '∑' },
];

export const CuriosityDomainPicker: React.FC<CuriosityDomainPickerProps> = ({
  selected,
  onChange,
  maxSelect = 4
}) => {
  const handleToggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(item => item !== id));
    } else {
      if (selected.length < maxSelect) {
        onChange([...selected, id]);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {DOMAINS.map((domain) => {
          const isSelected = selected.includes(domain.id);
          const isMaxReached = selected.length >= maxSelect;
          const isDisabled = !isSelected && isMaxReached;

          return (
            <button
              key={domain.id}
              type="button"
              onClick={() => handleToggle(domain.id)}
              disabled={isDisabled}
              className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col items-start gap-2 text-left
                ${isSelected 
                  ? 'bg-blue-950/60 border-blue-500 text-blue-200 shadow-md shadow-blue-900/30 ring-1 ring-blue-500' 
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700 hover:text-white'}
                ${isDisabled ? 'opacity-35 cursor-not-allowed bg-slate-950/50' : 'cursor-pointer'}
              `}
            >
              <span className="text-xl">{domain.icon}</span>
              <span className="text-xs font-semibold leading-tight">{domain.label}</span>
            </button>
          );
        })}
      </div>
      <div className="text-xs font-mono text-slate-400 mt-1 text-right">
        <span className="text-blue-400 font-bold">{selected.length}</span> / {maxSelect} domains pinned
      </div>
    </div>
  );
};
