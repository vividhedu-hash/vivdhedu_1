/**
 * /job-security loading boundary.
 *
 * Mirrors the page's real shape: the amber honesty banner, headline, the
 * three-control panel, then the wide 12-row matrix table — the table is what
 * the page is, so the skeleton previews a table rather than a spinner.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-24">
      <div className="bg-white border-b border-slate-200 py-2.5">
        <div className="container-lg flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-amber-200 animate-pulse" />
          <div className="h-3 w-full max-w-2xl rounded bg-slate-100 animate-pulse" />
        </div>
      </div>

      <div className="container-lg pt-10 pb-16">
        <div className="h-6 w-56 rounded-full bg-amber-100 animate-pulse" />
        <div className="mt-4 h-9 w-3/4 max-w-xl rounded-lg bg-slate-200/80 animate-pulse" />
        <div className="mt-3 h-4 w-1/2 max-w-md rounded bg-slate-200/60 animate-pulse" />

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="grid sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <div className="h-2.5 w-16 rounded bg-slate-100 animate-pulse" />
                <div className="mt-2 h-9 rounded-lg bg-slate-100 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2.5">
            <div className="h-10 w-40 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-10 flex-1 rounded-lg bg-slate-100 animate-pulse" />
          </div>
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 w-28 rounded-full bg-slate-100 animate-pulse" />
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12">
          <div className="h-6 w-6 mx-auto rounded-full bg-slate-100 animate-pulse" />
          <div className="mt-3 h-3.5 w-48 mx-auto rounded bg-slate-100 animate-pulse" />
          <div className="mt-2 h-2.5 w-72 max-w-full mx-auto rounded bg-slate-100/70 animate-pulse" />
        </div>

        <div className="mt-12 h-5 w-64 rounded bg-slate-200/80 animate-pulse" />
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-2.5 w-20 rounded bg-slate-100 animate-pulse" />
            ))}
          </div>
          {Array.from({ length: 12 }).map((_, row) => (
            <div
              key={row}
              className="flex items-center gap-4 px-4 py-3.5 border-b border-slate-50 last:border-0"
              style={{ animationDelay: `${row * 40}ms` }}
            >
              <div className="h-3 w-44 rounded bg-slate-100 animate-pulse" />
              <div className="h-3 w-8 ml-auto rounded bg-slate-100 animate-pulse" />
              <div className="h-3 w-12 rounded bg-slate-100/70 animate-pulse" />
              <div className="h-3 w-12 rounded bg-slate-100/70 animate-pulse" />
              <div className="h-5 w-28 rounded-full bg-slate-100 animate-pulse" />
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-[11px] font-mono text-slate-400">
          Loading the 12-profession safety matrix…
        </p>
      </div>
    </div>
  );
}
