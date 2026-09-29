"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Loader2, Send } from "lucide-react";
import { capture } from "@/lib/analytics";
import { BRAND, mailtoLink } from "@/lib/brand";

/**
 * Contact form.
 *
 * Submits through the same waitlist lead pipeline as the commercial CTAs, so
 * there is a single place enquiries land and a single rate limit protecting it.
 * `payload.topic` records what the enquiry is about; `payload.message` carries
 * the body.
 *
 * The message is not stored in a separate ticketing system — there isn't one.
 * So the failure path points the sender straight at the support inbox, which is
 * a working channel rather than a dead end.
 */

const TOPICS = [
  { value: "counsellor", label: "Counsellor or institution enquiry" },
  { value: "data", label: "Report a data error" },
  { value: "privacy", label: "Privacy or deletion request" },
  { value: "partnership", label: "Partnership" },
  { value: "general", label: "Something else" },
] as const;

const contactSchema = z.object({
  email: z
    .string()
    .min(1, "Enter your email address so we can reply.")
    .email("That does not look like a valid email address."),
  fullName: z
    .string()
    .min(1, "Tell us your name so we know who we are replying to.")
    .max(200, "That name is too long."),
  topic: z.enum(["counsellor", "data", "privacy", "partnership", "general"], {
    required_error: "Pick the closest topic.",
  }),
  message: z
    .string()
    .min(10, "A little more detail helps us answer properly — at least 10 characters.")
    .max(2000, "Please keep it under 2000 characters."),
});

type ContactValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [sent, setSent] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { email: "", fullName: "", topic: "general", message: "" },
  });

  const onSubmit = async (values: ContactValues) => {
    setServerError(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          full_name: values.fullName,
          // The waitlist column is a closed set of audience tracks, so a
          // support enquiry maps onto one of them and the actual topic is
          // carried in the payload.
          interest: "counsellor",
          payload: {
            source: "contact",
            topic: values.topic,
            message: values.message.slice(0, 2000),
          },
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { reason?: string }
          | null;
        setServerError(
          res.status === 429
            ? "Too many messages from this device. Wait a minute, or email us directly."
            : body?.reason || "We could not send that. Please email us instead.",
        );
        return;
      }

      setSent(values.email);
      capture("contact_message_sent", { topic: values.topic });
    } catch {
      setServerError(
        "We could not reach the contact service. Email us directly and we will pick it up.",
      );
    }
  };

  if (sent) {
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
            <p className="text-[15px] font-semibold t-text">
              Message received.
            </p>
            <p className="mt-1 text-[13px] leading-relaxed t-muted">
              We have logged it against{" "}
              <span className="font-mono t-text">{sent}</span> and a
              person will reply. If it is urgent, or you would rather not wait,
              email{" "}
              <a
                href={mailtoLink()}
                className="font-semibold text-rose-600 underline underline-offset-2"
              >
                {BRAND.supportEmail}
              </a>{" "}
              directly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-2xl border t-border t-surface p-6 shadow-sm sm:p-7"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="form-label">
            Your name
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            placeholder="Asha Sharma"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={
              errors.fullName ? "contact-name-error" : undefined
            }
            className={`form-input ${errors.fullName ? "border-rose-400" : ""}`}
            {...register("fullName")}
          />
          {errors.fullName && (
            <p
              id="contact-name-error"
              role="alert"
              className="mt-1.5 text-[12px] font-medium text-rose-600"
            >
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="contact-email" className="form-label">
            Your email
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={
              errors.email ? "contact-email-error" : undefined
            }
            className={`form-input ${errors.email ? "border-rose-400" : ""}`}
            {...register("email")}
          />
          {errors.email && (
            <p
              id="contact-email-error"
              role="alert"
              className="mt-1.5 text-[12px] font-medium text-rose-600"
            >
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="contact-topic" className="form-label">
          What is this about?
        </label>
        <select
          id="contact-topic"
          aria-invalid={Boolean(errors.topic)}
          className={`form-input form-select ${errors.topic ? "border-rose-400" : ""}`}
          {...register("topic")}
        >
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {errors.topic && (
          <p role="alert" className="mt-1.5 text-[12px] font-medium text-rose-600">
            {errors.topic.message}
          </p>
        )}
      </div>

      <div className="mt-4">
        <label htmlFor="contact-message" className="form-label">
          Message
        </label>
        <textarea
          id="contact-message"
          rows={5}
          placeholder="Tell us what you need. If you are reporting a data error, please include the college and the field."
          aria-invalid={Boolean(errors.message)}
          aria-describedby={
            errors.message ? "contact-message-error" : undefined
          }
          className={`form-input ${errors.message ? "border-rose-400" : ""}`}
          style={{ resize: "vertical" }}
          {...register("message")}
        />
        {errors.message && (
          <p
            id="contact-message-error"
            role="alert"
            className="mt-1.5 text-[12px] font-medium text-rose-600"
          >
            {errors.message.message}
          </p>
        )}
      </div>

      {serverError && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3"
        >
          <p className="text-[12px] leading-relaxed text-amber-900">
            {serverError}{" "}
            <a
              href={mailtoLink()}
              className="font-semibold underline underline-offset-2"
            >
              Email us
            </a>
            .
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send size={14} />
            Send message
          </>
        )}
      </button>

      <p className="mt-3 text-center text-[11px] leading-relaxed t-faint">
        We use your message to reply and for nothing else. See the{" "}
        <a href="/privacy" className="underline underline-offset-2 hover:t-muted">
          privacy policy
        </a>
        .
      </p>
    </form>
  );
}
