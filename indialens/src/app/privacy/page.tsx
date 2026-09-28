import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, Trash2, Mail } from "lucide-react";
import { APP_URL, BRAND, mailtoLink } from "@/lib/brand";
import { CookiePolicyTable } from "@/components/CookiePolicyTable";

export const dynamic = "force-static";

export const metadata: Metadata = {
  // Brand suffix comes from the root layout's `%s | VividhEdu` template.
  title: "Privacy Policy",
  description:
    "What data VividhEdu collects, why, how long it is kept, and how to have it deleted. Written for India, under the DPDP Act 2023.",
  alternates: { canonical: `${APP_URL}/privacy` },
};

const LAST_UPDATED = "28 September 2026";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-lg font-bold tracking-tight text-ink">
        <span className="font-mono text-[11px] text-accent">{id}.</span>{" "}
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-ink-2">
        {children}
      </div>
    </section>
  );
}

const TOC = [
  { id: "1", title: "Who runs this" },
  { id: "2", title: "What this product handles" },
  { id: "3", title: "What we collect" },
  { id: "4", title: "What we do not do with it" },
  { id: "5", title: "Why we are permitted to hold it" },
  { id: "6", title: "Who else can see it" },
  { id: "7", title: "How long we keep it" },
  { id: "8", title: "Cookies and sessions" },
  { id: "9", title: "Your rights" },
  { id: "10", title: "Children" },
  { id: "11", title: "Security" },
  { id: "12", title: "Changes and complaints" },
];


export default function PrivacyPage() {
  return (
    <div className="bg-surface text-ink">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="border-b border-line/10 bg-elevated">
        <div className="mx-auto max-w-4xl px-5 py-12">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={18} className="text-accent" />
            <h1 className="text-3xl font-black tracking-tight text-ink">
              Privacy Policy
            </h1>
          </div>
          <p className="mt-2 text-[13px] font-mono text-ink-2">
            {BRAND.name} · Last updated {LAST_UPDATED}
          </p>
          <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-ink-2">
            This product asks for unusually sensitive information: a student&apos;s
            budget, debt, family income, and tolerance for financial risk. We
            think that deserves a specific policy rather than a boilerplate one,
            so this document names the exact fields we hold, why we hold them,
            and how to get rid of them.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 py-12">
        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          {/* TOC */}
          <nav className="lg:sticky lg:top-24 lg:self-start">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-3">
              On this page
            </p>
            <ol className="mt-3 space-y-1.5">
              {TOC.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="block text-[13px] text-ink-2 transition-colors hover:text-ink"
                  >
                    {item.id}. {item.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-10">
            <Section id="1" title="Who runs this">
              <p>
                This service is operated from India as{" "}
                <strong className="font-semibold text-ink">{BRAND.legalEntity}</strong>.
                Questions about this policy or about your data go to{" "}
                <a href={mailtoLink("Privacy request")} className="font-semibold text-accent underline underline-offset-2">
                  {BRAND.supportEmail}
                </a>
                .
              </p>
            </Section>

            <Section id="2" title="What this product handles">
              <p>
                {BRAND.name} prices a degree as a financial asset. To do that, it
                necessarily processes information about money: what a programme
                costs, what a student can afford, what a family earns, how much
                debt a borrower is willing to carry, and how much volatility in
                income they can tolerate.
              </p>
              <p>
                That makes this <strong>financial information about an
                identifiable person</strong>. It is not anonymous usage data, and
                we do not treat it as if it were. The{" "}
                <Link href="/terms" className="font-semibold text-accent underline underline-offset-2">
                  terms of use
                </Link>{" "}
                also make clear that none of this is financial advice.
              </p>
            </Section>

            <Section id="3" title="What we collect">
              <p>Three distinct categories. They are separable, and you can give us only the first.</p>
              <ul className="ml-4 list-disc space-y-2">
                <li>
                  <strong className="font-semibold text-ink">Analysis inputs you enter.</strong>{" "}
                  Academic scores and interests, your budget range, the loan amount
                  you would consider, family or household income where it affects
                  feasibility, your risk tolerance, career goals, and your answers
                  to the adaptive assessment. These are stored with your report.
                </li>
                <li>
                  <strong className="font-semibold text-ink">Account details, if you sign in.</strong>{" "}
                  Your email address and, if you use Google sign-in, your name and
                  profile image. An account is optional: a full report can be
                  generated without one.
                </li>
                <li>
                  <strong className="font-semibold text-ink">Waitlist details, if you join.</strong>{" "}
                  Your email address, an optional name, which audience you selected
                  (student, parent, or counsellor), the page you submitted from, and
                  any utm campaign parameters present in the URL at the time.
                </li>
              </ul>
              <p>
                We also record coarse, non-identifying product analytics —
                which pages are visited and which features are used — so we can
                tell whether the product is working. Analytics are not tied to
                your analysis inputs.
              </p>
              <p>
                <strong className="font-semibold text-ink">
                  We do not collect:
                </strong>{" "}
                Aadhaar, PAN, or any government identity number. Bank account,
                card, or UPI details. Your contacts, photos, or files. Precise
                location. Health data. Caste, religion, or any other sensitive
                category mentioned in the Special Category list under the DPDP
                Act — the product does not ask for it, and you should not enter
                it into any free-text field.
              </p>
            </Section>

            <Section id="4" title="What we do not do with it">
              <ul className="ml-4 list-disc space-y-2">
                <li>
                  <strong className="font-semibold text-ink">We do not sell your data.</strong>{" "}
                  Not to advertisers, not to data brokers, not to anyone. The
                  waitlist address is used to send you launch pricing, and for
                  nothing else.
                </li>
                <li>
                  <strong className="font-semibold text-ink">
                    We do not sell your analysis to a college.
                  </strong>{" "}
                  We do not disclose that you shortlisted a programme, considered
                  an institution, or ran a scenario. No university sees your
                  activity, and none can buy access to it.
                </li>
                <li>
                  <strong className="font-semibold text-ink">
                    We do not accept payment for rankings.
                  </strong>{" "}
                  No college, university, or programme can pay to change a score
                  or a position. A paid ranking is not a ranking.
                </li>
                <li>
                  <strong className="font-semibold text-ink">
                    We do not use your finances for advertising.
                  </strong>{" "}
                  No lender, insurer, or education-finance provider receives
                  your data or your outputs.
                </li>
              </ul>
              <p>
                <strong className="font-semibold text-ink">What we do earn from:</strong>{" "}
                Some course links in the marketplace are affiliate-tracked, and
                clicking one may earn us a small commission from the provider. The
                commission does not affect course pricing, ordering, or the match
                score you see, and the marketplace discloses it. We do not take
                commission from any college for its ranking.
              </p>
            </Section>

            <Section id="5" title="Why we are permitted to hold it">
              <p>
                Under the Digital Personal Data Protection Act, 2023, processing
                needs a lawful basis. We rely on:
              </p>
              <ul className="ml-4 list-disc space-y-2">
                <li>
                  <strong className="font-semibold text-ink">Consent</strong>{" "}
                  for the waitlist, for optional account creation, and for any
                  marketing email. You can withdraw it at any time, and we will
                  stop.
                </li>
                <li>
                  <strong className="font-semibold text-ink">
                    Performance of a contract
                  </strong>{" "}
                  for processing the inputs needed to produce the report you
                  asked for. Without your budget and risk tolerance we cannot
                  compute an NPV, so this is necessary to deliver the service.
                </li>
                <li>
                  <strong className="font-semibold text-ink">
                    Legitimate interests
                  </strong>{" "}
                  for security logging, abuse prevention, and anonymous product
                  analytics. We do not use it as a blanket justification.
                </li>
              </ul>
              <p>
                We do not rely on consent for the analysis itself, because the
                analysis is what you asked for. We do not sell data, and we do
                not use it for any purpose incompatible with the one you
                consented to.
              </p>
            </Section>

            <Section id="6" title="Who else can see it">
              <p>
                Your report is reachable by anyone holding its link, because a
                shareable report is the point. That is a property of the share
                link, not a leak — treat a shared report link like a password and
                revoke it by deleting the report.
              </p>
              <p>A small number of processors see data in order to run the service:</p>
              <ul className="ml-4 list-disc space-y-2">
                <li>
                  <strong className="font-semibold text-ink">Supabase</strong>{" "}
                  — database and authentication hosting.
                </li>
                <li>
                  <strong className="font-semibold text-ink">
                    Google (and OpenRouter, where used)
                  </strong>{" "}
                  — sign-in, and retrieval-augmented grounding for the AI advisor.
                  A grounding query derived from your profile may be sent to a
                  model provider in order to produce a cited answer.
                </li>
                <li>
                  <strong className="font-semibold text-ink">Vercel</strong>{" "}
                  — hosting the web application.
                </li>
                <li>
                  <strong className="font-semibold text-ink">PostHog</strong>{" "}
                  — product analytics. Initialised with{" "}
                  <code className="rounded bg-chip px-1 py-0.5 font-mono text-[12px]">person_profiles: &quot;identified_only&quot;</code>,
                  so analytics stay pseudonymous unless you sign in.
                </li>
                <li>
                  <strong className="font-semibold text-ink">Resend</strong>{" "}
                  — transactional email, if configured.
                </li>
              </ul>
              <p>
                We do not sell data, and we do not disclose it to colleges,
                lenders, or advertisers under any circumstances. If a court or a
                competent authority compels disclosure, we will tell you unless
                the law forbids it.
              </p>
            </Section>

            <Section id="7" title="How long we keep it">
              <ul className="ml-4 list-disc space-y-2">
                <li>
                  <strong className="font-semibold text-ink">Reports</strong>{" "}
                  — stored for 90 days, then expired by the database. After
                  expiry the record is deleted rather than hidden.
                </li>
                <li>
                  <strong className="font-semibold text-ink">Waitlist entries</strong>{" "}
                  — kept while the waitlist is live, and deleted on request at any
                  time. We will not keep the address after pricing has been sent
                  unless you ask us to.
                </li>
                <li>
                  <strong className="font-semibold text-ink">Accounts</strong>{" "}
                  — until you ask us to delete the account, then within 30 days.
                </li>
                <li>
                  <strong className="font-semibold text-ink">Server logs</strong>{" "}
                  — rotated on a short cycle. Email addresses are reduced to their
                  domain in application logs, so logs cannot be used to rebuild a
                  list of signups.
                </li>
              </ul>
            </Section>

            <Section id="8" title="Cookies and sessions">
              <span id="cookies" className="block scroll-mt-24" />
              <p>
                Necessary storage keeps you signed in and lets you reopen the
                report you just made. Theme and analytics stay off until you
                allow them. We do not use advertising cookies and we do not
                build a cross-site profile. The same list, and the rules for
                session handles, is on the{" "}
                <Link href="/cookies" className="font-semibold text-accent underline underline-offset-2">
                  cookie page
                </Link>.
              </p>
              <CookiePolicyTable />
              <p>
                A report token is 128 bits from a cryptographic random generator.
                A psychometric session id is a UUID. An unknown or placeholder
                id is refused. Signing out ends the session and deletes the
                return path and the report handle in that tab. It does not
                delete the record of your cookie choice.
              </p>
            </Section>

            <Section id="9" title="Your rights">
              <p>
                You can ask us to do any of the following, and we will not
                require you to create an account or cite a statutory ground to
                exercise them:
              </p>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong className="font-semibold text-ink">Access</strong> — tell you what personal data we hold about you.</li>
                <li><strong className="font-semibold text-ink">Correction</strong> — fix anything inaccurate.</li>
                <li><strong className="font-semibold text-ink">Erasure</strong> — delete your waitlist entry, your reports, and your account.</li>
                <li><strong className="font-semibold text-ink">Withdraw consent</strong> — stop the marketing email, immediately.</li>
                <li><strong className="font-semibold text-ink">Nominate</strong> — ask us to stop processing data about a deceased person.</li>
                <li><strong className="font-semibold text-ink">Grievance redressal</strong> — complain, and have it answered.</li>
              </ul>
              <p>
                To exercise any of these, email{" "}
                <a href={mailtoLink("Data deletion request")} className="font-semibold text-accent underline underline-offset-2">
                  {BRAND.supportEmail}
                </a>{" "}
                from the address associated with your account, or use the{" "}
                <Link href="/contact" className="font-semibold text-accent underline underline-offset-2">
                  contact form
                </Link>
                . Include the email address you used. We respond to a deletion
                request within 30 days, and usually within a few days. We do not
                charge for it, and we do not require a reason.
              </p>
              <p>
                Deleting your report removes the analysis but does not, on its
                own, remove the underlying institutional data — that belongs to
                the public record and is not personal to you.
              </p>
            </Section>

            <Section id="10" title="Children">
              <p>
                This service is not directed at children under 18, and we do not
                knowingly collect their personal data. A parent or guardian
                using the product on a child&apos;s behalf is the account holder
                for those purposes. If you believe a minor has submitted personal
                data, email us and we will delete it.
              </p>
            </Section>

            <Section id="11" title="Security">
              <p>
                Reports and portfolios are stored in a Postgres database with
                row-level security enabled. Student-owned tables are not readable
                without the specific report token, and the waitlist table has no
                public read policy at all. Application logs avoid full email
                addresses. The database key used by the server never reaches the
                browser.
              </p>
              <p>
                No system is perfectly secure. If you find a vulnerability,
                report it to{" "}
                <a href={mailtoLink("Security disclosure")} className="font-semibold text-accent underline underline-offset-2">
                  {BRAND.supportEmail}
                </a>{" "}
                and we will investigate and fix it. We would rather hear about
                it from you than read about it.
              </p>
            </Section>

            <Section id="12" title="Changes and complaints">
              <p>
                If this policy changes materially we will update the date at the
                top of the page and, for significant changes, note it in the
                product. Continuing to use the service after a change means you
                accept the revised policy.
              </p>
              <p>
                This policy is governed by the laws of India. Data protection
                matters are addressed under the Digital Personal Data Protection
                Act, 2023. Complaints go to{" "}
                <a href={mailtoLink("Privacy complaint")} className="font-semibold text-accent underline underline-offset-2">
                  {BRAND.supportEmail}
                </a>
                ; we aim to acknowledge a complaint within three working days and
                resolve it within 30. If you are not satisfied, you are entitled
                to approach the Data Protection Board of India.
              </p>
            </Section>
          </div>
        </div>

        {/* ── Quick reference ─────────────────────────────────────── */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Trash2, label: "Delete your data", body: "One email, no charge, no reason required.", href: mailtoLink("Data deletion request") },
            { icon: Mail, label: "Ask a question", body: "A person reads it, not a bot.", href: mailtoLink("Privacy question") },
            { icon: Lock, label: "Read the terms", body: "What we do and do not promise.", href: "/terms" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-2xl border border-line/10 bg-elevated p-5 shadow-xs transition-all hover:border-line/20 hover:shadow-sm"
            >
              <item.icon size={16} className="text-accent" />
              <h3 className="mt-2.5 text-[13px] font-bold text-ink">{item.label}</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{item.body}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
