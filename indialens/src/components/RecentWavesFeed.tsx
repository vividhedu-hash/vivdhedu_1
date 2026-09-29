import React from 'react';
import { EmptyState } from './EmptyState';

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
 *
 * ## Why the empty state is now the shared one
 *
 * The bespoke block this used to render duplicated `EmptyState` badly: a
 * hand-drawn icon circle, an `<h4>` in one weight, copy set at two sizes with
 * no lead, and two hand-built links where the shared component has an `action`
 * and a `secondaryAction` for exactly this. The shared `EmptyState` also
 * carries `role="status"`, which the bespoke version did not — so a screen
 * reader now hears that the feed is legitimately empty instead of reading three
 * unlabelled paragraphs and concluding the panel had failed to render.
 *
 * The heading and its lead stay outside it, because they describe the surface
 * (what this panel is for) and the `EmptyState` describes the state (why it is
 * empty). Two components, two jobs; the previous version had one component
 * doing both and doing neither in the shared vocabulary.
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
    <div className="w-full min-w-0">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold tracking-tight t-text">
            Recent waves
          </h3>
          <p className="mt-0.5 text-[12px] t-muted">
            Live deadlines, intakes and scholarship windows, matched to your
            profile.
          </p>
        </div>
        <span className="badge badge-amber mt-1 shrink-0 sm:mt-0">
          No calendar connected
        </span>
      </div>

      <EmptyState
        variant="inline"
        title="Nothing to show yet"
        hint="This feed is empty because no admissions or scholarship calendar is connected. Rather than fill it with plausible-looking deadlines, we leave it empty — a wrong deadline is worse than a missing one."
        action={{
          label: 'Browse the program index',
          href: '/explore',
        }}
        secondaryAction={{
          label: 'What we track',
          href: '/methodology',
        }}
      />
    </div>
  );
};
