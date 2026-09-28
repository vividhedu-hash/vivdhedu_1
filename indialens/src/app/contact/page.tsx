import type { Metadata } from "next";
import { Mail, Clock, ShieldCheck, MessageSquare, AlertTriangle } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { APP_URL, BRAND, mailtoLink } from "@/lib/brand";

export const dynamic = "force-static";

export const metadata: Metadata = {
  // Brand suffix comes from the root layout's `%s | VividhEdu` template.
  // openGraph.title below does not pass through that template, so it keeps it.
  title: "Contact",
  description:
    "Reach the VividhEdu team. Support, data corrections, privacy and deletion requests, and counsellor or institution enquiries.",
  alternates: { canonical: `${APP_URL}/contact` },
  openGraph: {
    title: `Contact | ${BRAND.name}`,
    description: "Support, data corrections, privacy requests, and partnerships.",
    url: `${APP_URL}/contact`,
  },
};

const CHANNELS = [
  {
    icon: Mail,
    title: "Email",
    body: `The fastest route. A person reads every message, and we reply in the order they arrive.`,
    action: { label: BRAND.supportEmail, href: mailtoLink() },
  },
  {
    icon: ShieldCheck,
    title: "Privacy & deletion",
    body: "Deletion and access requests are handled as a priority. No charge, no reason required, and no account needed.",
    action: { label: "Request deletion", href: mailtoLink("Data deletion request") },
  },
  {
    icon: AlertTriangle,
    title: "Data errors",
    body: "If a number on a college or programme page is wrong, tell us which college and which field. Corrections enter our review queue and are checked against a source.",
    action: { label: "Report an error", href: mailtoLink("Data correction: college / field / value") },
  },
  {
    icon: MessageSquare,
    title: "Counsellors & institutions",
    body: "Running the same analysis for many students, or interested in a cohort view? Tell us roughly how many students you work with.",
    action: { label: "Institution enquiry", href: mailtoLink("Institution enquiry") },
  },
];

export default function ContactPage() {
  return (
    <div className="bg-[#F8FAFC] text-zinc-950">
      {/* ── Header ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-200/80 px-5 py-14">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-64 w-[560px] rounded-full bg-gradient-to-tr from-rose-100/45 via-purple-100/20 to-blue-100/25 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-rose-600">
            <span className="h-[1.5px] w-2.5 bg-rose-600" />
            Get in touch
          </p>
          <h1 className="mt-4 text-[clamp(2.2rem,5vw,3.2rem)] font-extrabold leading-[1.06] tracking-[-0.04em] text-zinc-950">
            Talk to a person.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-600">
            Support, corrections, privacy requests, or a question about what the
            numbers mean. {BRAND.name} is operated from India, and every message
            is read by the team rather than a ticket router.
          </p>
        </div>
      </section>

      {/* ── Form + channels ──────────────────────────────────────── */}
      <section className="px-5 py-14">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <div className="order-2 lg:order-1">
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight text-zinc-950">
              Other ways to reach us
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
              If one of these is more direct than the form, use it — it reaches
              the same inbox.
            </p>
            <div className="mt-6 space-y-4">
              {CHANNELS.map((c) => (
                <div key={c.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                      <c.icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14px] font-bold text-zinc-950">{c.title}</h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-zinc-600">{c.body}</p>
                      <a
                        href={c.action.href}
                        className="mt-2.5 inline-block break-all text-[13px] font-semibold text-rose-600 underline underline-offset-2 hover:text-rose-700"
                      >
                        {c.action.label}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-4">
              <Clock size={15} className="mt-0.5 flex-shrink-0 text-zinc-400" />
              <p className="text-[12px] leading-relaxed text-zinc-500">
                <strong className="font-semibold text-zinc-700">Response time.</strong>{" "}
                We aim to reply within two working days. Deletion and access
                requests are handled first and completed within 30 days, usually
                much sooner. The product is free during launch and there is no
                support queue behind paying customers — every message gets read.
              </p>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:sticky lg:top-24">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ── Entity ───────────────────────────────────────────────── */}
      <section className="border-t border-slate-200/80 px-5 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-zinc-400">
              Registered details
            </h2>
            <dl className="mt-3 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-[11px] font-mono text-zinc-400">Operated by</dt>
                <dd className="mt-0.5 text-[13px] font-medium text-zinc-900">{BRAND.legalEntity}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-mono text-zinc-400">Jurisdiction</dt>
                <dd className="mt-0.5 text-[13px] font-medium text-zinc-900">{BRAND.jurisdiction}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-mono text-zinc-400">Support email</dt>
                <dd className="mt-0.5 text-[13px] font-medium">
                  <a href={mailtoLink()} className="break-all text-rose-600 underline underline-offset-2 hover:text-rose-700">
                    {BRAND.supportEmail}
                  </a>
                </dd>
              </div>
            </dl>
            <p className="mt-4 border-t border-slate-100 pt-4 text-[12px] leading-relaxed text-zinc-500">
              These terms are governed by the laws of India, and data protection
              matters are handled under the Digital Personal Data Protection Act,
              2023. Full details are in the{" "}
              <a href="/privacy" className="font-semibold text-rose-600 underline underline-offset-2">privacy policy</a>{" "}
              and the{" "}
              <a href="/terms" className="font-semibold text-rose-600 underline underline-offset-2">terms of use</a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
