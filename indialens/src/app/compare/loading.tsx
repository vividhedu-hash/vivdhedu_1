/**
 * /compare loading boundary.
 *
 * /compare is a server component that awaits `fetchCollegeList`, so this
 * boundary is what the user actually sees during the real load. It previews
 * the page's real composition — the header strip with its two controls, then
 * the comparison card, then the advisor banner — rather than a spinner.
 * Light "Student OS" system, matching the route.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-950 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="h-6 w-56 rounded-full bg-emerald-50 border border-emerald-200 animate-pulse" />
            <div className="mt-4 h-9 w-80 max-w-full rounded-lg bg-slate-200/80 animate-pulse" />
            <div className="mt-3 h-4 w-64 max-w-full rounded bg-slate-200/50 animate-pulse" />
          </div>
          <div className="h-10 w-36 rounded-xl bg-slate-200/70 animate-pulse" />
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-9 flex-1 rounded-lg bg-slate-100 border border-slate-200 animate-pulse"
                style={{ animationDelay: `${i * 90}ms` }}
              />
            ))}
          </div>

          <div className="pt-5 space-y-4">
            {[
              "Total cost of degree",
              "20-year discounted NPV",
              "Debt recovery period",
              "AI automation exposure",
            ].map((row, i) => (
              <div key={row} className="flex items-center gap-4">
                <div className="h-3 w-40 rounded bg-slate-100 animate-pulse" />
                <div className="h-3 w-20 rounded bg-slate-200/70 animate-pulse" />
                <div className="h-3 w-20 rounded bg-slate-200/70 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="h-4 w-64 rounded bg-slate-200/70 animate-pulse" />
            <div className="h-3 w-80 max-w-full rounded bg-slate-100 animate-pulse" />
          </div>
          <div className="h-10 w-36 rounded-xl bg-slate-200/70 animate-pulse" />
        </div>

        <p className="text-center text-[11px] font-mono text-slate-400">
          Loading benchmark matrix…
        </p>
      </div>
    </div>
  );
}
