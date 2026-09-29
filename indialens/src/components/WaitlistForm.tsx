"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Check, Mail } from "lucide-react";
import { capture } from "@/lib/analytics";
import { BRAND } from "@/lib/brand";

/**
 * The single conversion form for the launch. Every commercial page renders
 * this — pricing, home, about, contact — so the validation, the event name
 * and the failure copy only exist in one place.
 *
 * Validation, the payload shape and the analytics event are unchanged. What
 * changed is that all four states — default, invalid, submitting, confirmed,
 * and server-error — are now expressed in tokens, so a form in the footer
 * looks identical to the same form on /pricing in both themes.
 */

const INTEREST_OPTIONS = [
  {
    value: "student",
    label: "I'm a student",
    hint: "Choosing a degree, or already in one.",
  },
  {
    value: "parent",
    label: "I'm a parent",
    hint: "Funding and comparing options for my child.",
  },
  {
    value: "counsellor",
    label: "I'm a counsellor",
    hint: "Admissions, education, or career guidance.",
  },
] as const;

const waitlistSchema = z.object({
  email: z
    .string()
    .min(1, "Enter your email address.")
    .email("That does not look like a valid email address."),
  fullName: z
    .string()
    .max(200, "That name is too long.")
    .optional()
    .or(z.literal("")),
  interest: z.enum(["student", "parent", "counsellor"], {
    required_error: "Pick the option that describes you best.",
  }),
});

type WaitlistValues = z.infer<typeof waitlistSchema>;

export interface WaitlistFormProps {
  /** Which page rendered the form. Recorded on the row as `payload.source`. */
  source?: string;
  /** Optional UTM context. Read from the URL when not passed explicitly. */
  utm?: Record<string, string>;
  /** Optional referral note — a podcast, a newsletter, a friend's name. */
  referralSource?: string;
  /** Visible heading above the fields. Pass "" to render fields only. */
  title?: string;
  /** Visible sub-heading under the title. */
  description?: string;
  /** Where the fallback link points when the backend is down. */
  fallbackHref?: string;
  /** Compact single-row-ish layout for the footer. */
  compact?: boolean;
}

/** Mask an address for the confirmation line: a***a@example.com */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "your email";
  const head = local.slice(0, 1);
  const tail = local.length > 2 ? local.slice(-1) : "";
  return `${head}${"*".repeat(Math.max(3, local.length - 2))}${tail}@${domain}`;
}

export function WaitlistForm({
  source = "site",
  utm,
  referralSource,
  title = "Get launch pricing before we open",
  description = `${BRAND.name} is free during launch. Join the list and we will tell you the moment a paid tier opens — and what it costs, before it goes live.`,
  fallbackHref = "/contact",
  compact = false,
}: WaitlistFormProps) {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WaitlistValues>({
    resolver: zodResolver(waitlistSchema),
    mode: "onSubmit",
    defaultValues: { email: "", fullName: "", interest: "student" },
  });

  // The interest chips show their selected state, so the choice has to be
  // subscribed to rather than sampled once with `getValues` at render time —
  // `getValues` alone would leave the chip stuck on "student" forever.
  const interest = watch("interest");

  // Read the UTM parameters off the current URL when the caller did not pass
  // them. Only ever on the client, and only what the URL already contains.
  const resolvedUtm = useMemo(() => {
    if (utm) return utm;
    if (typeof window === "undefined") return undefined;
    const params = new URLSearchParams(window.location.search);
    const picked: Record<string, string> = {};
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
      const value = params.get(key);
      if (value) picked[key] = value.slice(0, 200);
    }
    return Object.keys(picked).length > 0 ? picked : undefined;
  }, [utm]);

  const onSubmit = async (values: WaitlistValues) => {
    setServerError(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          full_name: values.fullName || null,
          interest: values.interest,
          referral_source: referralSource || null,
          payload: { source },
          utm: resolvedUtm ?? null,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { reason?: string }
          | null;

        if (res.status === 429) {
          setServerError(
            "Too many attempts from this device. Wait a minute, or email us directly.",
          );
          return;
        }
        setServerError(
          body?.reason ||
            "We could not record that just now. Please try again, or email us.",
        );
        return;
      }

      setSubmittedEmail(values.email);

      capture("waitlist_signup", {
        source,
        interest: values.interest,
        has_name: Boolean(values.fullName),
        has_utm: Boolean(resolvedUtm),
      });
    } catch {
      // Network error or timeout. Never a silent failure.
      setServerError(
        "We could not reach the signup service. Check your connection, or email us instead.",
      );
    }
  };

  // ── Success ──────────────────────────────────────────────────────────────
  if (submittedEmail) {
    return (
      <div role="status" aria-live="polite" className="panel panel-pad">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
            style={{ background: "var(--green)" }}
            aria-hidden="true"
          >
            <Check size={14} strokeWidth={3} style={{ color: "var(--text-inverse)" }} />
          </span>
          <div>
            <p className="text-[15px] font-semibold t-text">You are on the list.</p>
            <p className="mt-1 text-[13px] leading-relaxed t-muted">
              We will write to{" "}
              <span className="num t-text">{maskEmail(submittedEmail)}</span> when
              paid tiers open, with prices in advance. Nothing else goes out to
              this address, and you can ask us to delete it at any time.
            </p>
            <p className="mt-3 text-[12px] t-faint">
              Want to use the product now?{" "}
              <Link href="/onboard" className="t-accent font-semibold underline underline-offset-2">
                Start your free analysis
              </Link>{" "}
              — it is free during launch and does not need an account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className={compact ? "panel panel-pad-sm" : "panel panel-pad"}>
      {!compact && title && (
        <h3 className="text-[17px] font-bold tracking-tight t-text">{title}</h3>
      )}
      {!compact && description && (
        <p className="mt-1.5 text-[13px] leading-relaxed t-muted">{description}</p>
      )}
      {compact && (
        <p className="mb-4 text-[13px] font-semibold t-text">
          Get launch pricing first
        </p>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={compact ? "space-y-3" : "mt-5 space-y-4"}
        noValidate
      >
        <div>
          <label htmlFor={`waitlist-email-${source}`} className="form-label">
            Email address
          </label>
          <input
            id={`waitlist-email-${source}`}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={
              errors.email ? `waitlist-email-error-${source}` : undefined
            }
            className="form-input"
            {...register("email")}
          />
          {errors.email && (
            <p
              id={`waitlist-email-error-${source}`}
              role="alert"
              className="mt-1.5 text-[12px] font-medium"
              style={{ color: "var(--red)" }}
            >
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`waitlist-name-${source}`} className="form-label">
            Name{" "}
            <span className="font-normal normal-case tracking-normal t-faint">
              (optional)
            </span>
          </label>
          <input
            id={`waitlist-name-${source}`}
            type="text"
            autoComplete="name"
            placeholder="What should we call you?"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={
              errors.fullName ? `waitlist-name-error-${source}` : undefined
            }
            className="form-input"
            {...register("fullName")}
          />
          {errors.fullName && (
            <p
              id={`waitlist-name-error-${source}`}
              role="alert"
              className="mt-1.5 text-[12px] font-medium"
              style={{ color: "var(--red)" }}
            >
              {errors.fullName.message}
            </p>
          )}
        </div>

        <fieldset>
          <legend className="form-label">Which describes you best?</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {INTEREST_OPTIONS.map((option) => {
              const selected = interest === option.value;
              return (
                <label
                  key={option.value}
                  className={
                    selected
                      ? "selection-card selected flex cursor-pointer flex-col p-3"
                      : "selection-card flex cursor-pointer flex-col p-3"
                  }
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      value={option.value}
                      aria-label={option.label}
                      {...register("interest")}
                      className="h-3.5 w-3.5"
                      style={{ accentColor: "var(--accent)" }}
                    />
                    <span
                      className={
                        selected ? "text-[13px] font-semibold t-accent" : "text-[13px] font-semibold t-text"
                      }
                    >
                      {option.label}
                    </span>
                  </span>
                  <span className="mt-1 pl-[22px] text-[11px] leading-snug t-muted">
                    {option.hint}
                  </span>
                </label>
              );
            })}
          </div>
          {errors.interest && (
            <p
              role="alert"
              className="mt-1.5 text-[12px] font-medium"
              style={{ color: "var(--red)" }}
            >
              {errors.interest.message}
            </p>
          )}
        </fieldset>

        {serverError && (
          <div role="alert" className="notice notice-warn">
            <Mail size={14} className="notice-icon" style={{ color: "var(--amber)" }} />
            <p className="text-[12px] leading-relaxed">
              {serverError}{" "}
              <Link href={fallbackHref} className="font-semibold underline underline-offset-2">
                Contact us
              </Link>
              .
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Adding you to the list…
            </>
          ) : (
            <>
              Join the waitlist
              <ArrowRight size={14} aria-hidden="true" />
            </>
          )}
        </button>

        <p className="text-center text-[11px] leading-relaxed t-faint">
          No spam, no reselling your address, one email when pricing opens.
          Delete requests honoured under the{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:t-muted">
            privacy policy
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
