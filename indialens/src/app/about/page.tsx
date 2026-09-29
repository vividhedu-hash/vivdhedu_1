import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Database, ShieldCheck, Scale } from "lucide-react";
import { WaitlistForm } from "@/components/WaitlistForm";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { RevealGroup } from "@/components/Reveal";
import { APP_URL, BRAND, mailtoLink } from "@/lib/brand";

export const dynamic = "force-static";

export const metadata: Metadata = {
  // Brand suffix comes from the root layout's `%s | VividhEdu` template.
  // openGraph.title below does not pass through that template, so it keeps it.
  title: "About",
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

const AUDIENCE = [
  { who: "A student choosing", body: "You have shortlists, not a decision. The gap between a good college and a ruinous one is rarely obvious from the brochure, and the debt that funds it is invisible on the page." },
  { who: "A parent funding", body: "You are underwriting four to six years of cost against an outcome nobody can promise. You want the downside case, not the brochure median, and you want it in rupees." },
  { who: "A counsellor advising", body: "You are running the same analysis for many students, and the honest answer is usually a distribution rather than a winner. That is what the tooling gives you." },
];

const COMMITMENTS = [
  { title: "No invented precision", body: "When a figure is not measured we say so. A missing value is displayed as missing, never backfilled with something plausible. An estimate that looks certain is worse than one that admits its uncertainty." },
  { title: "No pay-to-rank", body: "We do not accept payment from a college, university, or programme in exchange for its score or its position. Rankings funded by the ranked are marketing, and the whole point of this product is that a ranking is not the answer." },
  { title: "Open methodology", body: "The weights, the formulas, and the assumptions are published. If our reasoning is wrong, you should be able to see exactly where and disagree with it in specifics rather than in general." },
];

function SourceTable() {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title flex items-center gap-2">
          <Database size={12} aria-hidden="true" />
          Source register
        </span>
        <span className="num num-0 t-faint">
          {DATA_SOURCES.length} sources
        </span>
      </div>
      {/* Horizontal scroll rather than a card layout below `md`: the source
          name, what it feeds, and its collection state are three genuinely
          different column types, and re-flowing them into stacked cards
          loses the comparison the table exists to make. */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <caption className="sr-only">
            Data sources, what each one feeds, and how it is collected
          </caption>
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
                <td className="font-medium t-text">{s.name}</td>
                <td className="t-muted">{s.what}</td>
                <td>
                  <span
                    className={`badge ${
                      s.state === "Automated" ? "badge-green" : "badge-amber"
                    }`}
                  >
                    {s.state === "Automated" ? "Automated" : "Needs credentials"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


export default function AboutPage() {
  return (
    <div className="page-shell">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="container-xl page-header">
        <PageHeader
          kicker="What this is"
          title={
            <>
              A degree is an asset.
              <br />
              <span className="t-faint">Most people price it like a receipt.</span>
            </>
          }
          lead={`Rankings describe institutions. Brochures describe the best year a department ever had. Neither one tells you what the next four years of your life cost, or what happens if the salary does not arrive. ${BRAND.name} models the degree as you hold it: your budget, your loan appetite, your risk tolerance, your tolerance for a bad year.`}
        />
      </div>

      {/* ── Who it is for ────────────────────────────────────────── */}
      <section className="page-band page-section-tight">
        <div className="container-xl">
          <SectionHeader kicker="Audience" title="Who it is for" />
          <RevealGroup className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {AUDIENCE.map((item) => (
              <div key={item.who} className="panel panel-pad">
                <h3 className="text-[14px] font-bold t-text">{item.who}</h3>
                <p className="mt-2 text-[13px] leading-relaxed t-muted">{item.body}</p>
              </div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── What it does ────────────────────────────────────────── */}
      <section className="page-band page-section">
        <div className="container-xl">
          <SectionHeader
            kicker="Capabilities"
            title="What it actually does"
            lead={
              <>
                <span className="num">{CAPABILITIES.length}</span> working parts,
                not a pitch deck. The{" "}
                <Link
                  href="/methodology"
                  className="font-semibold text-accent underline underline-offset-2"
                >
                  methodology
                </Link>{" "}
                sets out the mathematics behind each one.
              </>
            }
          />
          <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {CAPABILITIES.map((cap) => (
              <div key={cap.name} className="panel panel-pad">
                <h3 className="text-[14px] font-bold t-text">{cap.name}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed t-muted">{cap.body}</p>
              </div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── Data sources ─────────────────────────────────────────── */}
      <section className="page-band page-section">
        <div className="container-xl">
          <SectionHeader
            kicker="Provenance"
            title="Where the numbers come from"
            lead="Public and institutional sources, collected on a schedule. Where a source needs an API credential that has not been provisioned, we say so rather than implying the feed is running."
          />
          <SourceTable />
          <p className="mt-4 text-[12px] leading-relaxed t-faint">
            Institution-reported figures are reproduced as published. Colleges
            report those numbers to NIRF and to their own stakeholders, and they
            are not independently audited by us. If a record looks wrong, you can{" "}
            <Link
              href="/explore"
              className="font-semibold text-accent underline underline-offset-2"
            >
              flag a correction
            </Link>{" "}
            and it enters our review queue.
          </p>
        </div>
      </section>

      {/* ── Principles ───────────────────────────────────────────── */}
      <section className="page-band page-section">
        <div className="container-xl">
          <SectionHeader kicker="Principles" title="Three commitments" />
          <RevealGroup className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {COMMITMENTS.map((item) => (
              <div
                key={item.title}
                className="card-accent border-line/10"
              >
                <ShieldCheck size={14} style={{ color: "var(--accent)" }} aria-hidden="true" />
                <h3 className="mt-2.5 text-[14px] font-bold t-text">{item.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed t-muted">{item.body}</p>
              </div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── Limitations ──────────────────────────────────────────── */}
      <section className="page-band page-section">
        <div className="container-xl">
          <SectionHeader
            kicker="Limits"
            title="What it cannot do"
            lead="The limits are part of the product, not a footnote. If any of these would change your decision, weigh them yourself."
          />
          <RevealGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {LIMITATIONS.map((item) => (
              <div key={item.title} className="panel panel-pad">
                <h3 className="text-[14px] font-bold t-text">{item.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed t-muted">{item.body}</p>
              </div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── Waitlist ─────────────────────────────────────────────── */}
      <section className="page-band page-section">
        <div className="container-xl">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            <div>
              <SectionHeader kicker="Evaluate" title="Try it before you judge it" />
              <p className="body-p max-w-xl">
                Everything described on this page is free during launch and needs
                no account for a first report. Run your own case and see whether the
                output is worth trusting for your situation — that is the only
                evaluation that counts.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/onboard" className="btn-primary">
                  Start your free analysis
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
                <Link href="/pricing" className="btn-secondary">
                  Read the pricing
                </Link>
              </div>
              <div className="mt-7 flex items-start gap-2.5">
                <Scale size={14} className="mt-0.5 flex-shrink-0 t-faint" aria-hidden="true" />
                <p className="text-[12px] leading-relaxed t-faint">
                  Questions about the data or the method?{" "}
                  <a
                    href={mailtoLink("Question about your data")}
                    className="font-semibold text-accent underline underline-offset-2"
                  >
                    Email us
                  </a>{" "}
                  and a person will reply.
                </p>
              </div>
            </div>
            <WaitlistForm source="about" />
          </div>
        </div>
      </section>
    </div>
  );
}
