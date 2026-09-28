"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Check, Loader2, Mail } from "lucide-react";
import { capture } from "@/lib/analytics";

/**
 * The single conversion form for the launch. Every commercial page renders
 * this — pricing, home, about, contact — so the validation, the event name
 * and the failure copy only exist in one place.
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
  description = "VividhEdu is free during launch. Join the list and we will tell you the moment a paid tier opens — and what it costs, before it goes live.",
  fallbackHref = "/contact",
  compact = false,
}: WaitlistFormProps) {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<WaitlistValues>({
    resolver: zodResolver(waitlistSchema),
    mode: "onSubmit",
    defaultValues: { email: "", fullName: "", interest: "student" },
  });

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
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Check size={14} strokeWidth={3} />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-zinc-950">
              You are on the list.
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-zinc-600">
              We will write to{" "}
              <span className="font-mono text-zinc-900">{maskEmail(submittedEmail)}</span>{" "}
              when paid tiers open, with prices in advance. Nothing else goes out
              to this address, and you can ask us to delete it at any time.
            </p>
            <p className="mt-3 text-[12px] text-zinc-500">
              Want to use the product now?{" "}
              <a
                href="/onboard"
                className="font-semibold text-rose-600 underline underline-offset-2 hover:text-rose-700"
              >
                Start your free analysis
              </a>{" "}
              — it is free during launch and does not need an account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div
      className={
        compact
          ? "rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
          : "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
      }
    >
      {!compact && title && (
        <h3 className="text-[17px] font-bold tracking-tight text-zinc-950">
          {title}
        </h3>
      )}
      {!compact && description && (
        <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">
          {description}
        </p>
      )}
      {compact && (
        <p className="mb-4 text-[13px] font-semibold text-zinc-950">
          Get launch pricing first
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className={compact ? "space-y-3" : "mt-5 space-y-4"} noValidate>
        {/* Email */}
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
            className={`form-input ${errors.email ? "border-rose-400" : ""}`}
            {...register("email")}
          />
          {errors.email && (
            <p
              id={`waitlist-email-error-${source}`}
              role="alert"
              className="mt-1.5 text-[12px] font-medium text-rose-600"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Name (optional) */}
        <div>
          <label htmlFor={`waitlist-name-${source}`} className="form-label">
            Name <span className="font-normal normal-case tracking-normal text-zinc-400">(optional)</span>
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
            className={`form-input ${errors.fullName ? "border-rose-400" : ""}`}
            {...register("fullName")}
          />
          {errors.fullName && (
            <p
              id={`waitlist-name-error-${source}`}
              role="alert"
              className="mt-1.5 text-[12px] font-medium text-rose-600"
            >
              {errors.fullName.message}
            </p>
          )}
        </div>

        {/* Interest */}
        <fieldset>
          <legend className="form-label">Which describes you best?</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {INTEREST_OPTIONS.map((option) => {
              const selected = getValues("interest") === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer flex-col rounded-xl border p-3 transition-all ${
                    selected
                      ? "border-rose-500 bg-rose-50/70 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      value={option.value}
                      {...register("interest")}
                      className="h-3.5 w-3.5 accent-rose-600"
                    />
                    <span
                      className={`text-[13px] font-semibold ${selected ? "text-rose-700" : "text-zinc-900"}`}
                    >
                      {option.label}
                    </span>
                  </span>
                  <span className="mt-1 pl-5.5 text-[11px] leading-snug text-zinc-500">
                    {option.hint}
                  </span>
                </label>
              );
            })}
          </div>
          {errors.interest && (
            <p role="alert" className="mt-1.5 text-[12px] font-medium text-rose-600">
              {errors.interest.message}
            </p>
          )}
        </fieldset>

        {/* Server-side error */}
        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3"
          >
            <Mail size={14} className="mt-0.5 flex-shrink-0 text-amber-700" />
            <p className="text-[12px] leading-relaxed text-amber-900">
              {serverError}{" "}
              <a
                href={fallbackHref}
                className="font-semibold underline underline-offset-2"
              >
                Contact us
              </a>
              .
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Adding you to the list…
            </>
          ) : (
            <>
              Join the waitlist
              <ArrowRight size={14} />
            </>
          )}
        </button>

        <p className="text-center text-[11px] leading-relaxed text-zinc-400">
          No spam, no reselling your address, one email when pricing opens.
          Delete requests honoured under the{" "}
          <a
            href="/privacy"
            className="underline underline-offset-2 hover:text-zinc-600"
          >
            privacy policy
          </a>
          .
        </p>
      </form>
    </div>
  );
}
