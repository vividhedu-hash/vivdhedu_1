import { BRAND } from "@/lib/brand";

/**
 * Root loading boundary.
 *
 * App Router: this renders during a server-component navigation inside the
 * layout, so it is the *only* thing on screen for the transition. It is
 * therefore shaped like a page — a heading, a sub, a block of content cards —
 * rather than a centred spinner, so the arrival of real content is a fill-in
 * rather than a full repaint.
 *
 * Styling follows the light "Student OS" system used by the landing page and
 * every other chrome surface (navbar, footer, /compare). Note the app also
 * carries a second, dark "actuarial" system on /explore, /college and /report;
 * those routes override this boundary with their own `loading.tsx`.
 */
export default function Loading() {
  return (
    <div className="min-h-[70vh] bg-[#F8FAFC] text-zinc-950">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-16">
        <div className="h-3 w-24 rounded-full bg-slate-200/80 animate-pulse" />
        <div className="mt-5 h-10 w-2/3 max-w-xl rounded-lg bg-slate-200/80 animate-pulse" />
        <div className="mt-3 h-4 w-1/2 max-w-md rounded bg-slate-200/60 animate-pulse" />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className="h-3 w-20 rounded-full bg-slate-200/70 animate-pulse" />
              <div className="mt-4 h-5 w-3/4 rounded bg-slate-200/80 animate-pulse" />
              <div className="mt-3 h-3 w-full rounded bg-slate-100 animate-pulse" />
              <div className="mt-2 h-3 w-5/6 rounded bg-slate-100 animate-pulse" />
              <div className="mt-6 h-8 w-28 rounded-lg bg-slate-200/60 animate-pulse" />
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-[11px] font-mono text-slate-400">
          Loading {BRAND.name}…
        </p>
      </div>
    </div>
  );
}
