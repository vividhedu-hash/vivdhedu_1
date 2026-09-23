'use client';

import React from 'react';

interface DecisionWeightsSliderProps {
  label: string;
  sublabel?: string;
  value: number;      // 0-100
  onChange: (v: number) => void;
  color?: string;     // hex, default '#1A6CF6'
}

export const DecisionWeightsSlider: React.FC<DecisionWeightsSliderProps> = ({
  label,
  sublabel,
  value,
  onChange,
  color = '#1A6CF6'
}) => {
  return (
    <div className="w-full flex flex-col gap-2 my-3">
      <div className="flex justify-between items-end">
        <label className="text-sm font-semibold text-slate-200">{label}</label>
        <span className="text-2xl font-mono font-bold" style={{ color }}>{value}</span>
      </div>
      
      <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden shadow-inner border border-slate-700/50">
         <div 
           className="absolute top-0 left-0 h-full transition-all duration-200"
           style={{ width: `${value}%`, backgroundColor: color }}
         />
         <input 
           type="range"
           min="0"
           max="100"
           value={value}
           onChange={(e) => onChange(Number(e.target.value))}
           className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer weight-slider"
         />
      </div>
      
      {sublabel && (
        <span className="text-xs text-slate-400 mt-1">{sublabel}</span>
      )}
      <div className="h-0.5 mt-0.5 rounded-full opacity-30" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
};
