/**
 * /explore loading boundary.
 *
 * Dark "actuarial" system to match the route it previews (src/app/explore/page.tsx
 * renders `bg-black` with `#0A0A0A` table surfaces). The skeleton mirrors the
 * page's real shape: kicker, headline, a sticky filter bar, then a wide
 * seven-column data table — not a generic spinner, because the table is what
 * the page actually is.
 *
 * These are new files in a route folder another worker may be editing
 * `page.tsx` in; no conflict.
 */
export default function Loading() {
  const COLS = ["Rank", "Institution & Program", "Score", "AI Risk", "Placement", "Tuition", "Audit"];
  const WIDTHS = ["w-8", "w-56", "w-12", "w-16", "w-20", "w-20", "w-8"];

  return (
    <div className="min-h-screen bg-black text-[#F5F5F7] pb-24">
      <div className="container-xl pt-14 pb-10">
        <div className="h-3 w-36 rounded-full bg-white/[0.08] animate-pulse" />
        <div className="mt-5 h-10 w-3/4 max-w-2xl rounded-lg bg-white/[0.10] animate-pulse" />
        <div className="mt-4 h-4 w-1/2 max-w-lg rounded bg-white/[0.05] animate-pulse" />
        <div className="mt-8 h-9 w-44 rounded-full bg-white/[0.10] animate-pulse" />
      </div>

      <div className="border-y border-white/[0.06] bg-black/95 py-3.5">
        <div className="container-xl flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] animate-pulse" />
          <div className="w-36 h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] animate-pulse" />
          <div className="w-36 h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] animate-pulse" />
        </div>
      </div>

      <div className="container-xl mt-8">
        <div className="hidden md:block overflow-hidden bg-[#0A0A0A] border border-white/[0.08] rounded-2xl">
          <div className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.06]">
            {COLS.map((col, i) => (
              <div key={col} className={`h-2.5 ${WIDTHS[i]} rounded bg-white/[0.07] animate-pulse`} />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, row) => (
            <div
              key={row}
              className="flex items-center gap-4 px-4 py-4 border-b border-white/[0.04] last:border-b-0"
              style={{ animationDelay: `${row * 60}ms` }}
            >
              {COLS.map((col, i) => (
                <div key={col} className={`h-3 ${WIDTHS[i]} rounded bg-white/[0.045] animate-pulse`} />
              ))}
            </div>
          ))}
        </div>

        <div className="md:hidden grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-4"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="h-2.5 w-14 rounded bg-white/[0.06] animate-pulse" />
                  <div className="mt-2 h-3.5 w-24 rounded bg-white/[0.08] animate-pulse" />
                  <div className="mt-1.5 h-2.5 w-16 rounded bg-white/[0.04] animate-pulse" />
                </div>
                <div className="h-5 w-8 rounded bg-white/[0.08] animate-pulse" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="h-6 rounded bg-white/[0.04] animate-pulse" />
                <div className="h-6 rounded bg-white/[0.04] animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-[11px] font-mono text-[#48484A]">
          Loading program index…
        </p>
      </div>
    </div>
  );
}
