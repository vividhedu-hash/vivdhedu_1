/**
 * /career-trajectory loading boundary.
 *
 * Mirrors the real page shape: honesty banner, headline, a four-control bar,
 * then the two headline stat cards and the wide year-by-year distribution table.
 * The page is client-rendered, so this is the only thing on screen between
 * navigation and the first matrix result — a generic spinner would be a full
 * repaint rather than a fill-in.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-24">
      <div className="bg-white border-b border-slate-200 py-2.5">
        <div className="container-lg flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-3 w-full max-w-xl rounded bg-slate-100 animate-pulse" />
        </div>
      </div>

      <div className="container-lg pt-10 pb-16">
        <div className="h-9 w-3/4 max-w-xl rounded-lg bg-slate-200/80 animate-pulse" />
        <div className="mt-3 h-4 w-1/2 max-w-md rounded bg-slate-200/60 animate-pulse" />

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="h-2.5 w-14 rounded bg-slate-100 animate-pulse" />
                <div className="mt-2 h-9 rounded-lg bg-slate-100 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
            <div className="h-9 w-40 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-9 flex-1 rounded-lg bg-slate-100 animate-pulse" />
          </div>
        </div>

        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-5"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className="h-2.5 w-28 rounded bg-slate-100 animate-pulse" />
              <div className="mt-2 h-8 w-20 rounded bg-slate-200/70 animate-pulse" />
              <div className="mt-2 h-2.5 w-full rounded bg-slate-100 animate-pulse" />
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200">
            <div className="h-2.5 w-56 rounded bg-slate-100 animate-pulse" />
          </div>
          {Array.from({ length: 10 }).map((_, row) => (
            <div
              key={row}
              className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0"
              style={{ animationDelay: `${row * 50}ms` }}
            >
              <div className="h-2.5 w-6 rounded bg-slate-100 animate-pulse" />
              <div className="h-6 flex-1 rounded bg-slate-100/70 animate-pulse" />
              {Array.from({ length: 8 }).map((__, c) => (
                <div key={c} className="h-2.5 w-8 rounded bg-slate-100/60 animate-pulse" />
              ))}
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-[11px] font-mono text-slate-400">
          Solving π(t) = π(0)·Pᵗ and sampling 4,000 paths…
        </p>
      </div>
    </div>
  );
}
