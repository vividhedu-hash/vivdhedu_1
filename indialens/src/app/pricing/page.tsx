import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus, ArrowRight, Info } from "lucide-react";
import { WaitlistForm } from "@/components/WaitlistForm";
import { APP_URL, BRAND, mailtoLink } from "@/lib/brand";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: `Pricing — Free During Launch | ${BRAND.name}`,
  description:
    "VividhEdu is free during launch, with no usage cap and no card. The paid tiers below are designs, not products: join the waitlist and you will get the prices before they go live.",
  alternates: { canonical: `${APP_URL}/pricing` },
  openGraph: {
    title: `Pricing — Free During Launch | ${BRAND.name}`,
    description:
      "No card, no cap, no expiry. Join the waitlist for launch pricing when paid tiers open.",
    url: `${APP_URL}/pricing`,
    images: [
      {
        url: "/api/og?title=Pricing%20%E2%80%94%20Free%20During%20Launch",
        width: 1200,
        height: 630,
      },
    ],
  },
};

/**
 * Comparison rows.
 *
 * `free` describes what the running code actually does today. `full`/`pro`
 * describe intended paid differentiation and are deliberately not implemented.
 * Every "today" cell is traceable to a page or module in this repo.
 */
const CAPABILITY_MATRIX: Array<{
  capability: string;
  free: string | boolean;
  full: string | boolean;
  pro: string | boolean;
  note?: string;
}> = [
  { capability: "20-year NPV of a degree", free: true, full: true, pro: true, note: "Discounted lifecycle earnings against total cost of degree" },
  { capability: "Monte Carlo debt stress testing", free: true, full: true, pro: true, note: "Distribution over simulated income and repayment paths" },
  { capability: "College & program index", free: true, full: true, pro: true, note: "Live records, ranked by a published composite" },
  { capability: "3PL IRT adaptive assessment", free: true, full: true, pro: true, note: "Item difficulty estimated as you answer" },
  { capability: "AI-displacement risk surface", free: true, full: true, pro: true },
  { capability: "Admissions intelligence", free: true, full: true, pro: true },
  { capability: "Portfolio studio", free: true, full: true, pro: true },
  { capability: "AI advisor with grounded search", free: true, full: true, pro: true, note: "Search-grounded answers with citations" },
  { capability: "Global degree valuation", free: true, full: true, pro: true },
  { capability: "Saved reports", free: true, full: true, pro: true, note: "Reports expire after 90 days" },
  { capability: "Multi-scenario side-by-side comparison", free: false, full: true, pro: true, note: "Compare up to six programs at once" },
  { capability: "Counsellor-shareable report links", free: false, full: true, pro: true },
  { capability: "Profile & history persisted across sessions", free: false, full: true, pro: true },
  { capability: "Counsellor / institution seat dashboard", free: false, full: false, pro: true },
  { capability: "Bulk analysis across a student cohort", free: false, full: false, pro: true },
];

const FAQS = [
  {
    q: "Is VividhEdu really free right now?",
    a: "Yes. Every capability listed as available today is free during launch: no card, no trial countdown, no usage cap, and no expiry on your account. The product has no billing system switched on, so there is nothing for you to be charged for.",
  },
  {
    q: "What happens when you start charging?",
    a: "We will publish the prices, and everyone on the waitlist gets them before the tiers go live — not a teaser discount, the actual launch prices. The waitlist email is the only email we send about pricing.",
  },
  {
    q: "Will the free tier disappear?",
    a: "We do not plan to remove it. Our intent is to keep the core analysis — NPV, the risk surface, the program index — free, and to charge for things that cost money to serve, such as long-running scenario suites and cohort dashboards. If that changes we will say so on this page, in advance.",
  },
  {
    q: "What will it cost?",
    a: "We have not set prices yet, and we would rather say that than publish a number we might move. The tiers above are the shapes we are designing toward; the waitlist is how you get the real numbers first.",
  },
  {
    q: "Do you sell my data or take a commission from colleges?",
    a: "No to both. We do not sell personal data, and we do not accept commission from colleges, universities, or course providers in exchange for a ranking. Marketplace links are affiliate-tracked, and that is disclosed on the marketplace itself rather than buried on this page.",
  },
  {
    q: "Is this financial or education advice?",
    a: "No. VividhEdu is a decision-support tool. It models outcomes from public data and the assumptions you enter, and those outputs are estimates with stated uncertainty, not predictions. The methodology page explains how the models work; the terms set out the full limits.",
  },
];

/**
 * Intended paid differentiation. Not implemented — presented as design shape
 * only, with no price, because no price has been set.
 */
const PLANNED_TIERS = [
  {
    name: "Full Analysis",
    unit: "one-time, per report",
    who: "A student who has settled on a shortlist and wants the deep version of each option.",
    includes: [
      "Multi-scenario comparison across up to six programs",
      "Long-horizon projections kept beyond 90 days",
      "Counsellor-shareable report links",
    ],
    accent: "border-slate-300",
  },
  {
    name: "Pro",
    unit: "annual",
    who: "Counsellors and institutions running the same analysis for many students.",
    includes: [
      "Everything in Full Analysis",
      "A saved profile that persists across sessions",
      "Cohort dashboard for multiple students",
    ],
    accent: "border-rose-300",
  },
] as const;

function Cell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center">
        <Check size={16} className="text-emerald-600" strokeWidth={2.5} />
        <span className="sr-only">Included</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center">
        <Minus size={16} className="text-slate-300" />
        <span className="sr-only">Not included</span>
      </span>
    );
  }
  return <span className="text-[12px] text-zinc-500">{value}</span>;
}

function FaqJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function PricingPage() {
  return (
    <div className="bg-[#F8FAFC] text-zinc-950">
      <FaqJsonLd />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-200/80 px-5 py-16">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-80 w-[620px] rounded-full bg-gradient-to-tr from-rose-100/50 via-purple-100/25 to-blue-100/35 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 font-mono text-[11px] font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
            Free during launch
          </span>
          <h1 className="mt-6 text-[clamp(2.4rem,5.5vw,3.8rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-zinc-950">
            Everything costs nothing
            <br />
            <span className="font-light text-zinc-400">right now.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-zinc-600">
            No card, no trial timer, no feature held back. The paid tiers on this
            page are{" "}
            <strong className="font-semibold text-zinc-900">
              designs we have not built yet
            </strong>{" "}
            — join the waitlist and you will get the real prices before anyone
            can buy.
          </p>
        </div>
      </section>

      {/* ── Free offer ───────────────────────────────────────────── */}
      <section className="px-5 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border-2 border-zinc-900 bg-white p-6 shadow-md sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-950">
                    Free
                  </h2>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Live now
                  </span>
                </div>
                <p className="mt-2 max-w-md text-[14px] leading-relaxed text-zinc-600">
                  The complete product, as it exists today. No account needed to
                  run your first analysis.
                </p>
              </div>
              <div className="sm:text-right">
                <div className="flex items-baseline gap-1.5 sm:justify-end">
                  <span className="text-4xl font-extrabold tracking-tight text-zinc-950">
                    ₹0
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-zinc-500">
                  forever, during launch
                </p>
              </div>
            </div>

            <ul className="mt-7 grid gap-2.5 sm:grid-cols-2">
              {[
                "Every analysis tool, with no cap",
                "No card, and no signup needed for a first report",
                "Published methodology behind every score",
                "Shareable reports that expire after 90 days",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check size={15} className="mt-0.5 flex-shrink-0 text-emerald-600" strokeWidth={2.5} />
                  <span className="text-[13px] text-zinc-700">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/onboard"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98]"
              >
                Start your free analysis
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-[14px] font-medium text-zinc-800 transition-all hover:bg-slate-50"
              >
                Browse the program index
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Coming soon tiers ────────────────────────────────────── */}
      <section className="border-t border-slate-200/80 px-5 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="mb-9 text-center">
            <p className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              <span className="h-[1.5px] w-2.5 bg-zinc-400" />
              Not yet built
            </p>
            <h2 className="mt-3 text-[clamp(1.8rem,4vw,2.6rem)] font-bold tracking-tight text-zinc-950">
              The tiers we are designing
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-relaxed text-zinc-600">
              Shown for shape, not for sale. Prices are deliberately absent: we
              have not set them, and a number we might move is worse than no
              number at all.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {PLANNED_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`flex flex-col rounded-2xl border-2 ${tier.accent} bg-white p-6 shadow-xs`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-zinc-950">{tier.name}</h3>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    Coming soon
                  </span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-zinc-400">{tier.unit}</p>
                <p className="mt-3 text-[13px] leading-relaxed text-zinc-600">{tier.who}</p>

                <div className="mt-5 flex items-baseline gap-1.5 border-y border-slate-100 py-4">
                  <span className="text-2xl font-bold text-zinc-300">Price TBC</span>
                </div>

                <ul className="mt-4 flex-1 space-y-2.5">
                  {tier.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check size={15} className="mt-0.5 flex-shrink-0 text-zinc-300" strokeWidth={2.5} />
                      <span className="text-[13px] text-zinc-600">{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="#waitlist"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-zinc-800 transition-all hover:bg-slate-50"
                >
                  Get the price first
                  <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison table ─────────────────────────────────────── */}
      <section className="border-t border-slate-200/80 px-5 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-[clamp(1.6rem,3.5vw,2.2rem)] font-bold tracking-tight text-zinc-950">
            What is real today, and what is not
          </h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-zinc-600">
            A capability matrix with an honest split. The Free column is what the
            running code does today. The other two describe intended paid
            differentiation — we are not pretending any of it is built.
          </p>

          <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="min-w-[220px]">Capability</th>
                  <th className="w-28 text-center">
                    Free
                    <span className="block font-normal normal-case tracking-normal text-emerald-600">today</span>
                  </th>
                  <th className="w-28 text-center">Full</th>
                  <th className="w-28 text-center">Pro</th>
                </tr>
              </thead>
              <tbody>
                {CAPABILITY_MATRIX.map((row) => (
                  <tr key={row.capability}>
                    <td>
                      <span className="block font-medium text-zinc-900">{row.capability}</span>
                      {row.note && (
                        <span className="mt-0.5 block text-[11px] text-zinc-400">{row.note}</span>
                      )}
                    </td>
                    <td className="text-center"><Cell value={row.free} /></td>
                    <td className="text-center"><Cell value={row.full} /></td>
                    <td className="text-center"><Cell value={row.pro} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-4">
            <Info size={15} className="mt-0.5 flex-shrink-0 text-zinc-400" />
            <p className="text-[12px] leading-relaxed text-zinc-500">
              Reports currently expire after 90 days. Where a figure has not been
              measured, the interface reports it as unmeasured rather than filling
              in a plausible number — so a blank in a report means the data is
              genuinely absent, not zero.
            </p>
          </div>
        </div>
      </section>

      {/* ── Waitlist ─────────────────────────────────────────────── */}
      <section id="waitlist" className="scroll-mt-24 border-t border-slate-200/80 px-5 py-16">
        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_400px] lg:items-start">
          <div>
            <h2 className="text-[clamp(1.7rem,3.5vw,2.3rem)] font-bold tracking-tight text-zinc-950">
              Find out what it costs before it costs anything
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-zinc-600">
              One email, at launch, with the price. We will not put you in a drip
              campaign or sell the address — the waitlist is the only list we keep.
            </p>
            <ul className="mt-6 space-y-2.5">
              {[
                "Actual launch prices, sent before the tiers open",
                "A short note if we ever change the free tier",
                "Nothing else — one email, then silence unless there is pricing news",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check size={15} className="mt-0.5 flex-shrink-0 text-emerald-600" strokeWidth={2.5} />
                  <span className="text-[13px] text-zinc-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <WaitlistForm source="pricing" />
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="border-t border-slate-200/80 px-5 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-[clamp(1.7rem,3.5vw,2.3rem)] font-bold tracking-tight text-zinc-950">
            Questions people actually ask
          </h2>
          <div className="mt-8 space-y-3">
            {FAQS.map((faq) => (
              <details key={faq.q} className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
                <summary className="cursor-pointer list-none text-[14px] font-semibold text-zinc-900">
                  {faq.q}
                </summary>
                <p className="mt-2.5 text-[13px] leading-relaxed text-zinc-600">{faq.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-center text-[13px] text-zinc-500">
            Something not covered here?{" "}
            <a
              href={mailtoLink("Pricing question")}
              className="font-semibold text-rose-600 underline underline-offset-2 hover:text-rose-700"
            >
              Ask us directly
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
