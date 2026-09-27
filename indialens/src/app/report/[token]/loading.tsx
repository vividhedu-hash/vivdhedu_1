/**
 * /report/[token] loading boundary.
 *
 * Shaped after the report's real header: an expiry strip, then a two-column
 * title block, then the score ring + trajectory panels that open the page. The
 * report is on the dark "actuarial" system.
 */
export default function Loading() {
  return (
    <div style={{ padding: "40px 0 80px" }}>
      <div
        className="glass-card mb-8 p-4 flex flex-wrap gap-4 items-center justify-between"
        style={{ borderLeft: "4px solid #4F6EF7" }}
      >
        <div className="h-3.5 w-56 rounded bg-white/[0.06] animate-pulse" />
        <div className="flex gap-3">
          <div className="h-8 w-28 rounded-lg bg-white/[0.06] animate-pulse" />
          <div className="h-8 w-28 rounded-lg bg-white/[0.06] animate-pulse" />
        </div>
      </div>

      <div className="container-lg" style={{ maxWidth: 820 }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex-1 min-w-0">
            <div className="h-3 w-24 rounded bg-white/[0.06] animate-pulse" />
            <div className="mt-3 h-8 w-4/5 rounded-lg bg-white/[0.09] animate-pulse" />
            <div className="mt-3 h-3 w-3/5 rounded bg-white/[0.04] animate-pulse" />
          </div>
          <div className="w-full md:w-56 h-12 rounded-xl bg-white/[0.06] animate-pulse" />
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3 shrink-0">
            <div className="rounded-2xl border border-white/[0.08] bg-[#0A0A0A] p-6 flex flex-col items-center">
              <div className="w-36 h-36 rounded-full border-[10px] border-white/[0.05] animate-pulse" />
              <div className="mt-5 h-3 w-28 rounded bg-white/[0.06] animate-pulse" />
              <div className="mt-6 w-full space-y-3">
                <div className="h-2.5 w-full rounded-full bg-white/[0.04] animate-pulse" />
                <div className="h-2.5 w-4/5 rounded-full bg-white/[0.04] animate-pulse" />
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-6">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/[0.08] bg-[#0A0A0A] p-6"
                style={{ animationDelay: `${i * 110}ms` }}
              >
                <div className="h-4 w-44 rounded bg-white/[0.07] animate-pulse" />
                <div className="mt-5 h-28 rounded-xl bg-white/[0.03] animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        <p className="mt-12 text-center text-[11px] font-mono text-[#48484A]">
          Loading your personalized report…
        </p>
      </div>
    </div>
  );
}
