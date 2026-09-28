/**
 * What this browser is allowed to store, and the rules for session handles.
 *
 * The privacy page, the cookie banner, the cookie table, and the code that
 * writes storage all read this list. A store that is not on the list is a bug:
 * either add it here or stop writing it.
 *
 * The `STORAGE_POLICY` table is rendered verbatim on `/cookies` and inside
 * §8 of `/privacy`. Every row in it was traced to a line of code:
 *
 *   - `theproject_auth_token`  → `lib/supabase-client.ts:20` (`storageKey`)
 *   - `indialens_report_token` → `hooks/useAnalyze.ts:113`
 *   - `vividhedu_auth_return_to` → `lib/auth-context.tsx` sign-in redirect
 *   - `il-theme`               → `lib/theme-context.tsx` (functional gate)
 *   - `vividhedu_consent`      → `lib/consent.ts:39`
 *   - `ph_*_posthog`           → posthog-js default, only after opt-in
 *
 * If a row here stops matching the code, the code is wrong — do not let the
 * policy document drift away from the product.
 *
 * Categories
 * ----------
 * necessary  — required to sign in, to finish the page the person asked for,
 *              or to remember this choice. Always on. Not a tracker.
 * functional — a preference. Written only after the person allows it.
 * analytics  — PostHog. Not loaded until the person allows it. No ads.
 *
 * There is no "marketing" category in this table because the product does not
 * run marketing tracking. `MARKS_MISSING` is rendered on /cookies so the
 * absence is stated rather than left to be discovered by an auditor.
 */

export const POLICY_VERSION = 2;

export const CONSENT_COOKIE = "vividhedu_consent";
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export const CONSENT_EVENT = "vividhedu:consent";
export const OPEN_COOKIE_SETTINGS_EVENT = "vividhedu:open-cookies";

/** Supabase's own session blob. Renaming it would sign every current user out. */
export const SUPABASE_SESSION_KEY = "theproject_auth_token";

/**
 * A second copy of the access token used to be written here. Nothing reads it
 * anymore. Sign-out still deletes it so an old copy cannot linger.
 */
export const LEGACY_ACCESS_TOKEN_KEY = "vividhedu_auth_token";

export const RETURN_TO_KEY = "vividhedu_auth_return_to";
export const REPORT_TOKEN_KEY = "indialens_report_token";
export const THEME_KEY = "il-theme";

export type StorageCategory = "necessary" | "functional" | "analytics";

export type StorageRecord = {
  name: string;
  store: "cookie" | "localStorage" | "sessionStorage" | "url";
  category: StorageCategory;
  /** Who can read it. First-party unless a named processor is listed. */
  party: string;
  vendor?: string;
  duration: string;
  purpose: string;
};

export const STORAGE_POLICY: StorageRecord[] = [
  {
    name: CONSENT_COOKIE,
    store: "cookie",
    category: "necessary",
    party: "First-party",
    duration: "180 days, or until you clear it.",
    purpose:
      "Remembers the choice you made here. It holds a policy version number, " +
      "two yes/no flags, and the time you decided. It is not an account id and " +
      "it is not readable by any other site.",
  },
  {
    name: SUPABASE_SESSION_KEY,
    store: "localStorage",
    category: "necessary",
    party: "First-party",
    vendor: "Supabase (auth)",
    duration:
      "Until you sign out. The access token inside it expires on Supabase's " +
      "clock; the refresh token stays until sign-out.",
    purpose:
      "The signed-in session. This is the only copy of the access token the " +
      "app keeps. It is set by the Supabase client, not by this codebase.",
  },
  {
    name: LEGACY_ACCESS_TOKEN_KEY,
    store: "localStorage",
    category: "necessary",
    party: "First-party",
    duration: "Deleted on sign-out. New sessions do not write it.",
    purpose:
      "Leftover key from when the access token was stored twice. It is " +
      "cleared, not renewed, so an old copy cannot linger.",
  },
  {
    name: RETURN_TO_KEY,
    store: "sessionStorage",
    category: "necessary",
    party: "First-party",
    duration: "Until sign-in finishes, or the tab closes. One use.",
    purpose:
      "The page you were on when you chose to sign in, so you come back to " +
      "it. Only a same-site path is stored.",
  },
  {
    name: REPORT_TOKEN_KEY,
    store: "sessionStorage",
    category: "necessary",
    party: "First-party",
    duration: "Until you sign out, or the tab closes.",
    purpose:
      "The handle for the report you just generated, so the same tab can " +
      "reopen it.",
  },
  {
    name: "/report/[token]",
    store: "url",
    category: "necessary",
    party: "First-party",
    duration: "The report row carries a 90-day expiry set by the database.",
    purpose:
      "The report link itself. /report responses send Referrer-Policy: " +
      "no-referrer so the token is not attached to the next site you open.",
  },
  {
    name: THEME_KEY,
    store: "localStorage",
    category: "functional",
    party: "First-party",
    duration: "Until you turn functional storage off, or clear site data.",
    purpose:
      "Light or dark theme. Not written unless you allow functional storage.",
  },
  {
    name: "ph_*_posthog",
    store: "localStorage",
    category: "analytics",
    party: "Processor",
    vendor: "PostHog",
    duration:
      "Only created after you allow analytics. Cleared if you withdraw that.",
    purpose:
      "Page views, and the waitlist and contact events the forms send. " +
      "posthog-js defaults to localStorage, not cookies — these are " +
      "localStorage entries under the ph_ prefix, not Set-Cookie headers.",
  },
];

/**
 * Categories the banner offers that have nothing behind them today.
 *
 * GDPR/ePrivacy requires the choice to be granular, which means the choices
 * must correspond to real processing. A "marketing" toggle that switches off
 * nothing is a lie about the product. This list is rendered on /cookies: the
 * category is named, and the reason it is empty is stated.
 */
export const EMPTY_CATEGORIES: { id: string; label: string; reason: string }[] = [
  {
    id: "marketing",
    label: "Marketing",
    reason:
      "Nothing is sent. The product runs no advertising pixels, no remarketing, " +
      "and no cross-site profile, so there is no marketing storage to turn off. " +
      "If that ever changes, this row becomes a real toggle on the same banner.",
  },
];

export type ConsentChoice = {
  version: number;
  necessary: true;
  functional: boolean;
  analytics: boolean;
  decidedAt: number;
};

/** `2.0.1.1750000000` — version, functional, analytics, unix seconds. */
export function encodeConsent(choice: ConsentChoice): string {
  return [
    choice.version,
    choice.functional ? 1 : 0,
    choice.analytics ? 1 : 0,
    choice.decidedAt,
  ].join(".");
}

export function decodeConsent(raw: string | null | undefined): ConsentChoice | null {
  if (!raw) return null;
  const match = /^(\d+)\.([01])\.([01])\.(\d+)$/.exec(raw.trim());
  if (!match) return null;
  const version = Number(match[1]);
  // A cookie written by an older policy version is not silently honoured: the
  // categories it recorded predate the current page, so the banner asks again
  // rather than guessing what the person agreed to.
  if (version !== POLICY_VERSION) return null;
  const decidedAt = Number(match[4]);
  if (!Number.isFinite(decidedAt) || decidedAt <= 0) return null;
  return {
    version,
    necessary: true,
    functional: match[2] === "1",
    analytics: match[3] === "1",
    decidedAt,
  };
}

export function readConsentCookie(cookieHeader: string | null | undefined): ConsentChoice | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const row = parts.find((part) => part.startsWith(`${CONSENT_COOKIE}=`));
  if (!row) return null;
  return decodeConsent(decodeURIComponent(row.slice(CONSENT_COOKIE.length + 1)));
}
