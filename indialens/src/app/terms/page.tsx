import type { Metadata } from "next";
import Link from "next/link";
import { Scale, AlertTriangle } from "lucide-react";
import { APP_URL, BRAND, mailtoLink } from "@/lib/brand";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: `Terms of Use | ${BRAND.name}`,
  description:
    "The terms governing use of VividhEdu. What the product is, what it is not, acceptable use, disclaimers, liability, and governing law.",
  alternates: { canonical: `${APP_URL}/terms` },
};

const LAST_UPDATED = "27 September 2026";

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
      <h2 className="text-lg font-bold tracking-tight text-zinc-950">
        <span className="font-mono text-[11px] text-rose-600">{id}.</span>{" "}
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-zinc-600">
        {children}
      </div>
    </section>
  );
}

const TOC = [
  { id: "1", title: "Agreement" },
  { id: "2", title: "The service, and the free launch" },
  { id: "3", title: "Not advice" },
  { id: "4", title: "Model limits" },
  { id: "5", title: "Data quality" },
  { id: "6", title: "Acceptable use" },
  { id: "7", title: "Accounts and reports" },
  { id: "8", title: "Intellectual property" },
  { id: "9", title: "No warranty" },
  { id: "10", title: "Limitation of liability" },
  { id: "11", title: "Third-party content" },
  { id: "12", title: "Changes and termination" },
  { id: "13", title: "Governing law" },
];


export default function TermsPage() {
  return (
    <div className="bg-[#F8FAFC] text-zinc-950">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-5 py-12">
          <div className="flex items-center gap-2.5">
            <Scale size={18} className="text-rose-600" />
            <h1 className="text-3xl font-black tracking-tight text-zinc-950">
              Terms of Use
            </h1>
          </div>
          <p className="mt-2 text-[13px] font-mono text-zinc-500">
            {BRAND.name} · Last updated {LAST_UPDATED}
          </p>
          <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-zinc-600">
            These terms govern your use of {BRAND.name}. The short version: this
            is a modelling tool that produces estimates, it is not a
            professional adviser, and you are responsible for your own
            decisions. The longer version follows.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 py-12">
        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          <nav className="lg:sticky lg:top-24 lg:self-start">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              On this page
            </p>
            <ol className="mt-3 space-y-1.5">
              {TOC.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="block text-[13px] text-zinc-500 transition-colors hover:text-zinc-950">
                    {item.id}. {item.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-10">
            <Section id="1" title="Agreement">
              <p>
                By using {BRAND.name} you accept these terms. If you do not
                accept them, do not use the service. The service is operated
                from India as{" "}
                <strong className="font-semibold text-zinc-900">{BRAND.legalEntity}</strong>.
              </p>
              <p>
                You must be at least 18 years old, or have the involvement of a
                parent or guardian who accepts these terms on your behalf.
              </p>
            </Section>

            <Section id="2" title="The service, and the free launch">
              <p>
                {BRAND.name} provides quantitative analysis of education
                decisions: valuation of degree costs against projected earnings,
                risk modelling, programme and college data, a psychometric
                assessment, admissions information, and related tools.
              </p>
              <p>
                <strong className="font-semibold text-zinc-900">
                  The service is currently free.
                </strong>{" "}
                There is no subscription, no usage cap, and no payment method
                enabled. Any pricing described on the{" "}
                <Link href="/pricing" className="font-semibold text-rose-600 underline underline-offset-2">
                  pricing page
                </Link>{" "}
                for future tiers is indicative and does not constitute an offer
                capable of acceptance. When paid tiers open, we will publish
                prices and give notice before anything on your account changes to
                a paid state.
              </p>
            </Section>

            <Section id="3" title="Not advice">
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <p className="flex items-start gap-2 text-[13px] font-semibold text-amber-900">
                  <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
                  This is the most important clause on this page.
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-amber-900/90">
                  {BRAND.name} is a decision-support tool. It is{" "}
                  <strong>not</strong> financial advice, investment advice,
                  legal advice, tax advice, or admissions advice, and nothing in
                  the service should be read as a recommendation to take or
                  avoid any particular course of action.
                </p>
              </div>
              <p>
                Outputs are computed from public data and the assumptions you
                supply. They do not account for your complete financial
                circumstances, your family situation, your health, or your goals
                in a way that a qualified professional would. A financial NPV
                is a model, not a forecast.
              </p>
              <p>
                You should consult a qualified financial adviser before taking
                on debt to fund education, and a qualified education or
                admissions counsellor before committing to a programme. Neither
                the operators nor the contributors of data to this service hold
                themselves out as advisers.
              </p>
            </Section>

            <Section id="4" title="Model limits">
              <p>
                Every figure this service produces is an estimate. In
                particular:
              </p>
              <ul className="ml-4 list-disc space-y-2">
                <li>Projected salaries and NPVs depend on assumptions that may not hold.</li>
                <li>Monte Carlo output describes a modelled distribution, not a prediction of your life.</li>
                <li>Psychometric scores have a stated standard error and are not a measurement of ability or worth.</li>
                <li>AI-displacement scores are extrapolations about occupations, not forecasts about a specific job.</li>
                <li>Composite scores involve judgemental weighting, and a different weighting produces a different ranking.</li>
              </ul>
              <p>
                The{" "}
                <Link href="/methodology" className="font-semibold text-rose-600 underline underline-offset-2">
                  methodology
                </Link>{" "}
                sets out the mathematics. Reading it is strongly encouraged before
                relying on any number.
              </p>
            </Section>

            <Section id="5" title="Data quality">
              <p>
                Institutional data — placement rates, salaries, fees — is
                reported by the institutions themselves and is not independently
                audited by us. Some of it is promotional. Data coverage is uneven
                and some fields are missing.
              </p>
              <p>
                Where a figure has not been measured, this service reports it as
                unmeasured rather than filling in an estimate. Users should treat
                absent data as absent, not as zero and not as average. We accept
                correction submissions and review them, but we do not warrant
                that any record is complete, current, or accurate.
              </p>
            </Section>

            <Section id="6" title="Acceptable use">
              <p>You agree not to:</p>
              <ul className="ml-4 list-disc space-y-2">
                <li>scrape, resell, or bulk-harvest the programme and college data;</li>
                <li>circumvent rate limits, or use automated systems to submit signups;</li>
                <li>misrepresent yourself as a student, parent, or counsellor in order to access something you are not entitled to;</li>
                <li>submit false corrections or reviews intended to damage an institution&apos;s standing;</li>
                <li>attempt to access another person&apos;s report, portfolio, or account;</li>
                <li>use the service to harass, defraud, or misrepresent yourself to a college or employer.</li>
              </ul>
            </Section>

            <Section id="7" title="Accounts and reports">
              <p>
                An account is optional. If you create one, you are responsible
                for the security of your credentials. Report links are
                shareable: anyone holding a link can view the report, so treat a
                link as you would a password, and delete the report if it has
                been shared unintentionally.
              </p>
              <p>
                We may suspend or terminate access where we reasonably believe
                these terms have been breached, or where the service is being
                abused. We will not suspend access arbitrarily.
              </p>
            </Section>

            <Section id="8" title="Intellectual property">
              <p>
                The software, models, design, and written content of {BRAND.name}{" "}
                are owned by the operator and protected by Indian law. You may
                use, read, and share outputs freely, including commercially, with
                attribution. You may not resell the underlying data or reverse
                engineer the service.
              </p>
            </Section>

            <Section id="9" title="No warranty">
              <p>
                The service is provided{" "}
                <strong className="font-semibold text-zinc-900">as is</strong>{" "}
                and{" "}
                <strong className="font-semibold text-zinc-900">as available</strong>,
                without warranties of any kind, whether express or implied,
                including fitness for a particular purpose, accuracy, and
                non-infringement. We do not warrant that the service will be
                uninterrupted, error-free, or that any output will be correct for
                your circumstances.
              </p>
            </Section>

            <Section id="10" title="Limitation of liability">
              <p>
                To the maximum extent permitted by law, the operator is not liable
                for any indirect, incidental, special, consequential, or punitive
                damages, nor for any loss of profits, income, opportunity, or
                data, arising out of your use of the service or your reliance on
                its outputs.
              </p>
              <p>
                Nothing in these terms excludes liability that cannot be excluded
                under Indian law, including liability for fraud or wilful
                misconduct.
              </p>
            </Section>

            <Section id="11" title="Third-party content">
              <p>
                The service links to, and summarises, third-party material
                including institutional data, statistics, and AI-generated answers
                with citations. We do not control that content and do not endorse
                it. A statistic attributed to a source reflects that source at
                the time of collection, not our own verification of it.
              </p>
              <p>
                Some course links are affiliate-tracked, and we may earn a
                commission when you click one. This never changes the price you
                pay, the order in which courses appear, or the match score.
              </p>
            </Section>

            <Section id="12" title="Changes and termination">
              <p>
                We may modify these terms, and we may modify or discontinue the
                service. Material changes to these terms will be noted on this
                page with an updated date. Continued use after a change constitutes
                acceptance. You may stop using the service at any time, and you
                may request deletion of your data at any time as described in the{" "}
                <Link href="/privacy" className="font-semibold text-rose-600 underline underline-offset-2">
                  privacy policy
                </Link>
                .
              </p>
            </Section>

            <Section id="13" title="Governing law">
              <p>
                These terms are governed by and construed in accordance with the
                laws of India. The courts of India have exclusive jurisdiction,
                subject to any applicable consumer or statutory protections that
                apply in your place of residence.
              </p>
              <p>
                Questions about these terms:{" "}
                <a href={mailtoLink("Terms question")} className="font-semibold text-rose-600 underline underline-offset-2">
                  {BRAND.supportEmail}
                </a>
                .
              </p>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
