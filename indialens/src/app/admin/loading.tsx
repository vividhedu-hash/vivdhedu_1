/**
 * /admin loading boundary.
 *
 * The console opens on the dashboard tab, so the skeleton previews the stat
 * row plus the two panels beneath it. Dark "actuarial" system, matching the
 * page's own `glass-card` surfaces.
 *
 * Note: this boundary covers the page shell only. The two gates inside the page
 * (session via `AuthGate`, then the static admin key) render their own real
 * states, so an unauthenticated visitor still sees the sign-in wall rather than
 * this skeleton sitting in front of it forever.
 */
export default function Loading() {
  return (
    <div style={{ padding: "40px 0 80px" }}>
      <div className="container-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded bg-white/[0.08] animate-pulse" />
              <div className="h-6 w-40 rounded bg-white/[0.09] animate-pulse" />
            </div>
            <div className="h-3 w-56 rounded bg-white/[0.05] animate-pulse" />
          </div>
          <div className="h-9 w-36 rounded-full bg-white/[0.08] animate-pulse" />
        </div>

        <div
          className="flex gap-1 mb-8 overflow-hidden"
          style={{ borderBottom: "1px solid #1E1E2E", paddingBottom: 0 }}
        >
          {[72, 110, 128, 118, 116].map((w, i) => (
            <div
              key={i}
              className="h-9 rounded-t-md bg-white/[0.04] animate-pulse"
              style={{ width: w, animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-5" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="h-2.5 w-24 rounded bg-white/[0.06] animate-pulse" />
              <div className="mt-3 h-6 w-16 rounded bg-white/[0.09] animate-pulse" />
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {[0, 1].map((i) => (
            <div key={i} className="glass-card p-6" style={{ animationDelay: `${i * 120}ms` }}>
              <div className="h-4 w-44 rounded bg-white/[0.07] animate-pulse" />
              <div className="mt-5 space-y-3">
                {Array.from({ length: i === 0 ? 4 : 3 }).map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="h-3 w-32 rounded bg-white/[0.05] animate-pulse" />
                    <div className="h-3 w-20 rounded bg-white/[0.05] animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-[11px] font-mono text-[#4A4A6A]">
          Loading admin console…
        </p>
      </div>
    </div>
  );
}
