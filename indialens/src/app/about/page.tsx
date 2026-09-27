import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Database, AlertTriangle, Users } from "lucide-react";
import { WaitlistForm } from "@/components/WaitlistForm";
import { APP_URL, BRAND, mailtoLink } from "@/lib/brand";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: `About | ${BRAND.name}`,
  description:
    "What VividhEdu is, who it is for, the public data sources it actually uses, and an honest account of its limits.",
  alternates: { canonical: `${APP_URL}/about` },
  openGraph: {
    title: `About | ${BRAND.name}`,
    description:
      "The product, the audience, the real data sources, and the limits — stated plainly.",
    url: `${APP_URL}/about`,
  },
};

const CAPABILITIES = [
  { name: "20-year NPV", body: "Values a degree as a capital asset: discounted lifecycle earnings against the real total cost, not a brochure average package." },
  { name: "Monte Carlo stress testing", body: "Simulates income and repayment paths into a distribution, so you see the downside tail instead of one point estimate." },
  { name: "3PL IRT psychometrics", body: "An adaptive assessment that estimates item difficulty as you respond, and reports its own standard error rather than a confident-looking score." },
  { name: "AI-displacement risk", body: "Scores how exposed a field is to automation, and where the complementary skills sit — inside the composite, not as a footnote." },
  { name: "Admissions intelligence", body: "Cutoffs, seats, and program fit, so a shortlist is grounded in what is actually admissible rather than what sounds good." },
  { name: "Portfolio studio", body: "Structures extracurriculars, research, and outputs into the form admissions committees and employers actually read." },
  { name: "AI advisor, grounded", body: "Answers grounded in live search with citations attached, so you can follow a source instead of trusting the tone." },
  { name: "Global degree valuation", body: "Values international programmes on the same discounted-cash-flow basis as domestic ones, for students weighing a foreign fee against an Indian one." },
];

/**
 * Data sources. Each entry corresponds to a scraper in `backend/scrapers/`
 * registered in the dispatch map in `backend/api/scraper_jobs.py`, or to a
 * public statistical source. Sources needing a credential are marked, because
 * a reader should not have to guess which is which.
 */
const DATA_SOURCES = [
  { name: "NIRF", what: "Government college rankings: ranks, placement shares, enrolment.", state: "Automated" },
  { name: "PLFS / MoSPI", what: "Periodic Labour Force Survey — employment rates and wage distributions.", state: "Automated" },
  { name: "World Bank", what: "PPP conversion factor and macro indicators, via the public REST API.", state: "Automated" },
  { name: "AmbitionBox", what: "College-reported placement and salary aggregates.", state: "Automated" },
  { name: "College placement reports", what: "Official placement PDFs published by institutions.", state: "Automated" },
  { name: "Naukri / Indeed / Internshala", what: "Job postings and internships — volume, salary ranges, skills demand.", state: "Automated" },
  { name: "Payscale", what: "Role-level salary benchmarks, used as a cross-check.", state: "Automated" },
  { name: "Reddit", what: "Public discussion, used as a sentiment and lived-experience signal.", state: "Needs API credentials" },
] as const;

const LIMITATIONS = [
  { title: "These are models, not predictions", body: "A 20-year NPV is a discounted projection built on assumptions you supply and salary distributions we have inferred. The output is an estimate with real uncertainty, not a forecast. Read the ranking as a structured argument, not a verdict." },
  { title: "Data coverage is uneven, and we do not paper over it", body: "Institution-reported data is patchy, and some of it is marketing. Where a figure has not been measured, the interface reports it as unmeasured instead of substituting a plausible number. A gap in a report is missing data, not a zero." },
  { title: "The composite involves judgement", body: "Weighing cost, security, ceiling, location, satisfaction, and network into one score requires choosing weights. Ours are published and the decomposition is shown, but a different weighting would produce a different ranking. That is a value judgement, not a fact." },
  { title: "AI-risk scores are forecasts about occupations", body: "Automation exposure comes from published occupational taxonomies crosswalked to Indian job titles. Those crosswalks are approximate, and the underlying technology changes faster than the data does." },
  { title: "It does not know your family", body: "The model sees what you tell it: budget, loan appetite, risk tolerance, goals. It does not see your household income trajectory, your obligations, or your local opportunities, and it cannot judge them for you." },
  { title: "It is not advice", body: "Nothing here is financial, investment, legal, or admissions advice. Talk to a qualified counsellor, and to a financial adviser before you take on debt to fund a degree." },
];

function SourceTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <table className="data-table">
        <thead>
          <tr>
            <th className="min-w-[180px]">Source</th>
            <th>What we take from it</th>
            <th className="w-40">Collection</th>
          </tr>
        </thead>
        <tbody>
          {DATA_SOURCES.map((s) => (
            <tr key={s.name}>
              <td className="font-medium text-zinc-900">{s.name}</td>
              <td className="text-zinc-600">{s.what}</td>
              <td>
                <span
                  className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${
                    s.state === "Automated"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {s.state}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


export default function AboutPage() {
  return (
    <div className="bg-[#F8FAFC] text-zinc-950">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-200/80 px-5 py-16">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-72 w-[600px] rounded-full bg-gradient-to-tr from-rose-100/45 via-purple-100/25 to-blue-100/30 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-3xl">
          <p className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-rose-600">
            <span className="h-[1.5px] w-2.5 bg-rose-600" />
            What this is
          </p>
          <h1 className="mt-4 text-[clamp(2.2rem,5vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.04em] text-zinc-950">
            A degree is an asset.
            <br />
            <span className="font-light text-zinc-400">Most people price it like a receipt.</span>
          </h1>
          <p className="mt-6 text-[16px] leading-relaxed text-zinc-600">
            Rankings describe institutions. Brochures describe the best year a
            department ever had. Neither one tells you what the next four years
            of your life cost, or what happens if the salary does not arrive.
            {BRAND.name} models the degree <em>as you</em> hold it: your budget,
            your loan appetite, your risk tolerance, your tolerance for a bad
            year.
          </p>
        </div>
      </section>

      {/* ── Who it is for ────────────────────────────────────────── */}
      <section className="border-b border-slate-200/80 px-5 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2.5">
            <Users size={17} className="text-rose-600" />
            <h2 className="text-[clamp(1.6rem,3.5vw,2.2rem)] font-bold tracking-tight text-zinc-950">
              Who it is for
            </h2>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {[
              { who: "A student choosing", body: "You have shortlists, not a decision. The gap between a good college and a ruinous one is rarely obvious from the brochure, and the debt that funds it is invisible on the page." },
              { who: "A parent funding", body: "You are underwriting four to six years of cost against an outcome nobody can promise. You want the downside case, not the brochure median, and you want it in rupees." },
              { who: "A counsellor advising", body: "You are running the same analysis for many students, and the honest answer is usually a distribution rather than a winner. That is what the tooling gives you." },
            ].map((item) => (
              <div key={item.who} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <h3 className="text-[14px] font-bold text-zinc-950">{item.who}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What it does ────────────────────────────────────────── */}
      <section className="border-b border-slate-200/80 px-5 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-[clamp(1.6rem,3.5vw,2.2rem)] font-bold tracking-tight text-zinc-950">
            What it actually does
          </h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-zinc-600">
            Eight working parts, not a pitch deck. The{" "}
            <Link href="/methodology" className="font-semibold text-rose-600 underline underline-offset-2 hover:text-rose-700">
              methodology
            </Link>{" "}
            sets out the mathematics behind each one.
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {CAPABILITIES.map((cap) => (
              <div key={cap.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <h3 className="text-[14px] font-bold text-zinc-950">{cap.name}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">{cap.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Data sources ─────────────────────────────────────────── */}
      <section className="border-b border-slate-200/80 px-5 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2.5">
            <Database size={17} className="text-rose-600" />
            <h2 className="text-[clamp(1.6rem,3.5vw,2.2rem)] font-bold tracking-tight text-zinc-950">
              Where the numbers come from
            </h2>
          </div>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-zinc-600">
            Public and institutional sources, collected on a schedule. Where a
            source needs an API credential that has not been provisioned, we
            say so rather than implying the feed is running.
          </p>
          <div className="mt-7"><SourceTable /></div>
          <p className="mt-4 text-[12px] leading-relaxed text-zinc-500">
            Institution-reported figures are reproduced as published. Colleges
            report those numbers to NIRF and to their own stakeholders, and they
            are not independently audited by us. If a record looks wrong, you can{" "}
            <Link href="/explore" className="font-semibold text-rose-600 underline underline-offset-2 hover:text-rose-700">
              flag a correction
            </Link>{" "}
            and it enters our review queue.
          </p>
        </div>
      </section>

      {/* ── Principles ───────────────────────────────────────────── */}
      <section className="border-b border-slate-200/80 px-5 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-[clamp(1.6rem,3.5vw,2.2rem)] font-bold tracking-tight text-zinc-950">
            Three commitments
          </h2>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {[
              { title: "No invented precision", body: "When a figure is not measured we say so. A missing value is displayed as missing, never backfilled with something plausible. An estimate that looks certain is worse than one that admits its uncertainty." },
              { title: "No pay-to-rank", body: "We do not accept payment from a college, university, or programme in exchange for its score or its position. Rankings funded by the ranked are marketing, and the whole point of this product is that a ranking is not the answer." },
              { title: "Open methodology", body: "The weights, the formulas, and the assumptions are published. If our reasoning is wrong, you should be able to see exactly where and disagree with it in specifics rather than in general." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border-l-2 border-rose-500 bg-white p-5 shadow-xs">
                <h3 className="text-[14px] font-bold text-zinc-950">{item.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Limitations ──────────────────────────────────────────── */}
      <section className="border-b border-slate-200/80 px-5 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={17} className="text-amber-500" />
            <h2 className="text-[clamp(1.6rem,3.5vw,2.2rem)] font-bold tracking-tight text-zinc-950">
              What it cannot do
            </h2>
          </div>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-zinc-600">
            The limits are part of the product, not a footnote. If any of these
            would change your decision, weigh them yourself.
          </p>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {LIMITATIONS.map((item) => (
              <div key={item.title} className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-5">
                <h3 className="text-[14px] font-bold text-zinc-950">{item.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Waitlist ─────────────────────────────────────────────── */}
      <section className="px-5 py-16">
        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_400px] lg:items-start">
          <div>
            <h2 className="text-[clamp(1.7rem,3.5vw,2.3rem)] font-bold tracking-tight text-zinc-950">
              Try it before you judge it
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-zinc-600">
              Everything described on this page is free during launch and needs
              no account for a first report. Run your own case and see whether the
              output is worth trusting for your situation — that is the only
              evaluation that counts.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/onboard"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98]"
              >
                Start your free analysis
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-[14px] font-medium text-zinc-800 transition-all hover:bg-slate-50"
              >
                Read the pricing
              </Link>
            </div>
            <p className="mt-6 text-[12px] leading-relaxed text-zinc-500">
              Questions about the data or the method?{" "}
              <a href={mailtoLink("Question about your data")} className="font-semibold text-rose-600 underline underline-offset-2 hover:text-rose-700">
                Email us
              </a>{" "}
              and a person will reply.
            </p>
          </div>
          <WaitlistForm source="about" />
        </div>
      </section>
    </div>
  );
}
