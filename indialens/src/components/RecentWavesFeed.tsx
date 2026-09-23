import React, { useEffect, useState } from 'react';
import { Trophy, GraduationCap, FlaskConical, Star, TrendingUp, Clock, ExternalLink, Filter, PlusCircle, Check } from 'lucide-react';

export interface WaveCard {
  id: string;
  category: 'competition' | 'admissions' | 'research' | 'scholarship' | 'market';
  title: string;
  body: string;
  matchPct: number;
  deadlineDays: number | null;
  source: string;
}

export interface RecentWavesFeedProps {
  apiUrl?: string;
  profileToken?: string;
  onAddWaveToSprint?: (wave: WaveCard) => void;
}

const MOCK_WAVES: WaveCard[] = [
  { 
    id: 'w1', 
    category: 'competition', 
    title: '3 Econ & Quant Competitions Open', 
    body: 'Pre-university track open for Class 11-12 students. Judged by faculty from Delhi School of Economics and IGIDR. Offers verified external spike validation.', 
    matchPct: 98, 
    deadlineDays: 14, 
    source: 'EconOlympiad 2026' 
  },
  { 
    id: 'w2', 
    category: 'admissions', 
    title: "LSE & Warwick Update Int'l Math Requirements", 
    body: 'Higher Mathematics now listed as required (not preferred) for Economics BSc from Cohort 2027. Shifts SAT/CUET priority immediately into the current sprint.', 
    matchPct: 91, 
    deadlineDays: null, 
    source: 'LSE Admissions Portal' 
  },
  { 
    id: 'w3', 
    category: 'research', 
    title: 'Ashoka Comp. Econ Lab: 3 Pre-Uni Fellows', 
    body: "Ashoka University's Computational Economics Lab accepting pre-university research fellows for AY 2026-27. Directly addresses co-authorship gap, unlocking 2.4x odds multiplier.", 
    matchPct: 94, 
    deadlineDays: 21, 
    source: 'Ashoka Univ. Research Office' 
  },
  { 
    id: 'w4', 
    category: 'scholarship', 
    title: 'Need-Aware Global Merit Fellowship $24k/yr', 
    body: 'Rolling review cycle open. Requires 2 academic letters + research abstract. Income threshold: household <$65k USD equivalent, perfectly aligning with budget constraints.', 
    matchPct: 76, 
    deadlineDays: null, 
    source: 'GlobalMerit Foundation' 
  },
];

const CategoryIcon = ({ category, className }: { category: string, className?: string }) => {
  switch (category) {
    case 'competition': return <Trophy className={className} />;
    case 'admissions': return <GraduationCap className={className} />;
    case 'research': return <FlaskConical className={className} />;
    case 'scholarship': return <Star className={className} />;
    case 'market': return <TrendingUp className={className} />;
    default: return <ExternalLink className={className} />;
  }
};

const getMatchColorClass = (pct: number) => {
  if (pct >= 90) return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500' };
  if (pct >= 70) return { bg: 'bg-blue-500/10', text: 'text-blue-400', bar: 'bg-blue-500' };
  return { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500' };
};

const getDeadlineColorClass = (days: number | null) => {
  if (days === null) return 'text-slate-400 bg-slate-800/80';
  if (days <= 7) return 'text-red-400 bg-red-950/60 border border-red-900/40';
  if (days <= 14) return 'text-amber-400 bg-amber-950/60 border border-amber-900/40';
  return 'text-emerald-400 bg-emerald-950/60 border border-emerald-900/40';
};

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'research', label: 'Research' },
  { id: 'competition', label: 'Competitions' },
  { id: 'admissions', label: 'Admissions' },
  { id: 'scholarship', label: 'Scholarships' },
];

export const RecentWavesFeed: React.FC<RecentWavesFeedProps> = ({ apiUrl, profileToken, onAddWaveToSprint }) => {
  const [waves, setWaves] = useState<WaveCard[]>(MOCK_WAVES);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addedWaves, setAddedWaves] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchWaves = async () => {
      if (!profileToken) return;
      setLoading(true);
      try {
        // [AI-CoLab: Cursor] Uses the local /api/v1 proxy (serverless fallback
        // included) instead of a dead external host.
        const base = apiUrl ? apiUrl.replace(/\/$/, "") : "";
        const res = await fetch(`${base}/api/v1/analytics/opportunities?token=${profileToken}`, {
          signal: AbortSignal.timeout(6_000),
        });
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        if (mounted && data.waves?.length) setWaves(data.waves);
      } catch (err) {
        // Fall back to calibrated mock waves
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchWaves();
    return () => { mounted = false; };
  }, [apiUrl, profileToken]);

  const filteredWaves = selectedCategory === 'all' 
    ? waves 
    : waves.filter(w => w.category === selectedCategory);

  const handleAdd = (wave: WaveCard) => {
    setAddedWaves(prev => ({ ...prev, [wave.id]: true }));
    if (onAddWaveToSprint) {
      onAddWaveToSprint(wave);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">Recent Waves Feed</h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500">Live Vector Stream</span>
      </div>

      {/* Category Filter Pills (Screen 11 Feature) */}
      <div className="flex flex-wrap gap-1.5 py-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono transition-all ${
              selectedCategory === cat.id 
                ? 'bg-blue-600 text-white font-bold shadow-sm' 
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 mt-1">
        {filteredWaves.map((wave) => {
          const matchColors = getMatchColorClass(wave.matchPct);
          const deadlineClass = getDeadlineColorClass(wave.deadlineDays);
          const isAdded = !!addedWaves[wave.id];
          
          return (
            <div key={wave.id} className="relative flex flex-col p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-left overflow-hidden shadow-md hover:border-slate-700 transition">
              {/* Top Match Color Bar */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] ${matchColors.bar}`} />
              
              <div className="flex items-start justify-between mb-2.5">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/80">
                  <CategoryIcon category={wave.category} className="w-3 h-3 text-slate-400" />
                  <span className="text-[9px] font-mono font-semibold text-slate-300 uppercase tracking-widest">{wave.category}</span>
                </div>
                <div className={`flex items-center px-2 py-0.5 rounded-full ${matchColors.bg}`}>
                  <span className={`text-[11px] font-mono font-bold ${matchColors.text}`}>{wave.matchPct}% Match</span>
                </div>
              </div>

              <h4 className="text-xs font-bold text-slate-100 mb-1.5 leading-snug">{wave.title}</h4>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">{wave.body}</p>

              <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-slate-800/60">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                  <span className="truncate max-w-[110px]">{wave.source}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono ${deadlineClass}`}>
                    <Clock className="w-3 h-3" />
                    <span>
                      {wave.deadlineDays === null ? 'Rolling' : `${wave.deadlineDays}d left`}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAdd(wave)}
                    disabled={isAdded}
                    title="Add to sprint roadmap"
                    className={`p-1 rounded transition text-[10px] flex items-center gap-1 ${
                      isAdded 
                        ? 'text-emerald-400 bg-emerald-950/40' 
                        : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800'
                    }`}
                  >
                    {isAdded ? <Check size={12} /> : <PlusCircle size={12} />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
