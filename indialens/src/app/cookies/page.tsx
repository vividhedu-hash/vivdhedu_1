import type { Metadata } from "next";
import Link from "next/link";
import { CookiePolicyTable } from "@/components/CookiePolicyTable";
import { CookieSettingsButton } from "@/components/CookieSettingsButton";
import { BRAND, APP_URL, mailtoLink } from "@/lib/brand";

export const dynamic = "force-static";

const LAST_UPDATED = "28 September 2026";

export const metadata: Metadata = {
  // Brand suffix comes from the root layout's `%s | VividhEdu` template.
  title: "Cookies and sessions",
  description:
    "Every cookie, local store, and session handle this site uses, what it is for, who can read it, and how to turn the optional ones off.",
  alternates: { canonical: `${APP_URL}/cookies` },
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="kicker-web">Last updated {LAST_UPDATED}</p>
        <h1 className="mt-3 text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold tracking-tight">
          Cookies and session handles
        </h1>
        <p className="lead-p mt-4">
          This page is the list of what the product actually writes to your
          browser, derived from the code that writes it. Strictly necessary
          storage stays on so sign-in and the report you opened keep working.
          Functional and analytics storage stay off until you allow them.
        </p>
        <p className="body-p mt-3">
          There are no advertising cookies. The site sets no third-party
          marketing or ad-network cookies at all. One analytics processor is
          used — PostHog — and it is not loaded until you allow it, and
          switching analytics off stops it and clears what it stored.
        </p>

        <div className="mt-8">
          <CookiePolicyTable />
        </div>

        <div className="mt-4">
          <CookieSettingsButton />
        </div>

        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight">How the choice is enforced</h2>
          <p className="body-p mt-3">
            The banner records your answer in a first-party cookie for 180 days.
            Until that cookie says analytics is allowed, the analytics library is
            never initialised, so it never opens a connection, never writes a
            storage entry, and never records a page view. If you change your mind
            later, the same dialog stops it and removes what it stored.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight">Withdrawing consent</h2>
          <p className="body-p mt-3">
            You can change or withdraw your choice at any time using the{" "}
            <strong className="font-semibold">Cookie settings</strong> button on
            this page, the same control in the site footer, or the cookie banner
            the first time you arrive. Withdrawing analytics consent stops
            further events and clears the analytics storage described in the
            table above. Turning off functional storage forgets your saved
            theme. Strictly necessary storage cannot be switched off, because it
            is what keeps you signed in and what remembers this choice.
          </p>
          <p className="body-p mt-3">
            You can also clear cookies and site data for this site in your
            browser settings at any time. Doing so resets the banner to its
            first-visit state.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight">Do Not Track</h2>
          <p className="body-p mt-3">
            The product does not read your browser&rsquo;s Do Not Track signal,
            because it already gives you a control that does more than that
            signal does: a per-category, per-site, persistent choice you can see
            and change. Honouring DNT as an on/off switch for all tracking would
            also switch off the storage that keeps you signed in, which would
            break sign-in for no privacy gain. If your browser sends DNT, nothing
            here changes: the banner still appears and analytics still waits for
            your explicit opt-in.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight">Session handles and report links</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[var(--text-secondary)]">
            <li>
              A report token is 16 bytes from a cryptographic random generator
              (128 bits). A shorter string is not issued.
            </li>
            <li>
              A psychometric session id is a UUID version 4. The fixed
              placeholders <span className="font-mono">psy_default</span>,{" "}
              <span className="font-mono">init</span>, and{" "}
              <span className="font-mono">offline</span> are not sessions and are
              refused.
            </li>
            <li>
              An unknown session id is an error. The server does not invent a
              person or a result to fill the gap.
            </li>
            <li>
              The access token is stored once, inside the Supabase session. A
              second copy is not written.
            </li>
            <li>
              Signing out ends the Supabase session and deletes the return path,
              the report handle in that tab, and any leftover second copy of the
              token. It does not delete the record of your cookie choice.
            </li>
            <li>
              Report links live in the URL. Responses for{" "}
              <span className="font-mono">/report</span> send{" "}
              <span className="font-mono">Referrer-Policy: no-referrer</span> so
              the token is not sent to the next website you open.
            </li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight">Contact</h2>
          <p className="body-p mt-3">
            Questions about any item in this table go to{" "}
            <a
              href={mailtoLink("Cookie question")}
              className="font-semibold text-[var(--accent)] underline underline-offset-2"
            >
              {BRAND.supportEmail}
            </a>
            . The same rules are summarised in the{" "}
            <Link
              href="/privacy#cookies"
              className="font-semibold text-[var(--accent)] underline underline-offset-2"
            >
              privacy policy
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
