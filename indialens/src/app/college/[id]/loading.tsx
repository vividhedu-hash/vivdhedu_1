/**
 * /college/[id] loading boundary.
 *
 * Mirrors the detail page's real composition: breadcrumb, a two-column header
 * (identity block + the score ring), then the two stacked panels it actually
 * opens with — ROI breakdown and cost/risk. The page is on the dark "actuarial"
 * system, so this is too.
 */
export default function Loading() {
  return (
    <div style={{ padding: "72px 0 80px" }}>
      <div className="container-xl">
        <div className="h-3 w-28 rounded-full bg-white/[0.07] animate-pulse" />

        <div className="mt-8 flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="flex-1 min-w-0">
            <div className="h-8 w-3/4 max-w-md rounded-lg bg-white/[0.09] animate-pulse" />
            <div className="mt-3 h-5 w-1/2 max-w-xs rounded bg-white/[0.05] animate-pulse" />
            <div className="mt-5 flex flex-wrap gap-2">
              <div className="h-6 w-20 rounded-full bg-white/[0.06] animate-pulse" />
              <div className="h-6 w-24 rounded-full bg-white/[0.06] animate-pulse" />
              <div className="h-6 w-16 rounded-full bg-white/[0.06] animate-pulse" />
            </div>
            <div className="mt-8 space-y-3">
              <div className="h-3 w-full rounded bg-white/[0.04] animate-pulse" />
              <div className="h-3 w-11/12 rounded bg-white/[0.04] animate-pulse" />
              <div className="h-3 w-9/12 rounded bg-white/[0.04] animate-pulse" />
            </div>
          </div>

          <div className="w-full lg:w-64 shrink-0">
            <div className="rounded-2xl border border-white/[0.08] bg-[#0A0A0A] p-6 flex flex-col items-center">
              <div className="w-32 h-32 rounded-full border-[10px] border-white/[0.05] animate-pulse" />
              <div className="mt-5 h-3 w-24 rounded bg-white/[0.06] animate-pulse" />
              <div className="mt-2 h-2.5 w-16 rounded bg-white/[0.04] animate-pulse" />
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/[0.08] bg-[#0A0A0A] p-6"
              style={{ animationDelay: `${i * 110}ms` }}
            >
              <div className="h-4 w-40 rounded bg-white/[0.07] animate-pulse" />
              <div className="mt-5 space-y-4">
                {[0, 1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="h-2.5 w-28 rounded bg-white/[0.05] animate-pulse" />
                    <div className="h-2 flex-1 rounded-full bg-white/[0.04] animate-pulse" />
                    <div className="h-2.5 w-10 rounded bg-white/[0.05] animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-[11px] font-mono text-[#48484A]">
          Loading program details…
        </p>
      </div>
    </div>
  );
}
