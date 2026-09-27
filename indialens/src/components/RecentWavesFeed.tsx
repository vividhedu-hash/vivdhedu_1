import React from 'react';
import { CircleAlert, ExternalLink } from 'lucide-react';
import Link from 'next/link';

/**
 * Removed the hardcoded feed.
 *
 * This component rendered four invented "developments" as live intelligence:
 *
 *   - "3 Economics & Quantitative Research Competitions Opened", "98% Match",
 *     "Deadline in 14 days"
 *   - "LSE & Warwick Updated International Admissions Matrix" with a "Recalculate
 *     Odds" action
 *   - "Ashoka Computational Economics Mentorship Lab accepting 3 fellows",
 *     "Directly addresses your identified co-authorship gap"
 *   - "Need-Aware Global Merit Fellowship ($24k/yr) opens rolling review" with
 *     a budget-bracket match against a fabricated "$35k~$65k budget constraint"
 *
 * None of these came from a scraper, a feed or an admissions calendar. A
 * student acting on a fabricated deadline, or budgeting around a fellowship
 * that does not exist, is a materially worse outcome than an empty panel —
 * and "Real-time developments mapped to your profile" was a claim about a
 * pipeline that does not exist.
 *
 * The `WaveCard` type and the `onAction` contract are kept so a real feed can
 * be dropped in without rewriting the page. Until such a source is wired, the
 * honest state is an explicit empty state with a route to the real data.
 */
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
  href?: string;
}

export const RecentWavesFeed: React.FC<{
  onAction?: (wave: WaveCard) => void;
}> = () => {
  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Recent waves
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Live deadlines, intakes and scholarship windows, matched to your profile.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        <CircleAlert size={22} className="mx-auto text-slate-400 mb-3" />
        <h4 className="text-sm font-bold text-slate-800">Nothing to show yet</h4>
        <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
          This feed is empty because no admissions or scholarship calendar is
          connected. Rather than fill it with plausible-looking deadlines, we
          leave it empty — a wrong deadline is worse than a missing one.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Browse the program index
            <ExternalLink size={12} />
          </Link>
          <Link
            href="/methodology"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
          >
            What we track
          </Link>
        </div>
      </div>
    </div>
  );
};
