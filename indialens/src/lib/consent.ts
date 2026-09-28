"use client";

import {
  CONSENT_COOKIE,
  CONSENT_EVENT,
  CONSENT_MAX_AGE_SECONDS,
  LEGACY_ACCESS_TOKEN_KEY,
  OPEN_COOKIE_SETTINGS_EVENT,
  POLICY_VERSION,
  REPORT_TOKEN_KEY,
  RETURN_TO_KEY,
  THEME_KEY,
  type ConsentChoice,
  encodeConsent,
  readConsentCookie,
} from "./session-policy";

export type ConsentCategories = { functional: boolean; analytics: boolean };

export function readConsent(): ConsentChoice | null {
  if (typeof document === "undefined") return null;
  return readConsentCookie(document.cookie);
}

/** Necessary storage is always on — it is not a switch, it is the sign-in. */
export function necessaryAllowed(): boolean {
  return true;
}

export function functionalAllowed(): boolean {
  return readConsent()?.functional === true;
}

export function analyticsAllowed(): boolean {
  return readConsent()?.analytics === true;
}

export function writeConsent(choice: ConsentCategories): ConsentChoice {
  const saved: ConsentChoice = {
    version: POLICY_VERSION,
    necessary: true,
    functional: choice.functional,
    analytics: choice.analytics,
    decidedAt: Math.floor(Date.now() / 1000),
  };
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${encodeConsent(saved)}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  if (!saved.functional) {
    try { window.localStorage.removeItem(THEME_KEY); } catch { /* private mode */ }
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: saved }));
  return saved;
}

export function openCookieSettings(): void {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}

/**
 * Drops tab- and leftover-session data. Does not touch the consent cookie
 * or the Supabase session blob — signOut owns that blob.
 */
export function clearBrowserSession(): void {
  try {
    window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  } catch { /* private mode */ }
  try {
    window.sessionStorage.removeItem(RETURN_TO_KEY);
    window.sessionStorage.removeItem(REPORT_TOKEN_KEY);
  } catch { /* private mode */ }
}
