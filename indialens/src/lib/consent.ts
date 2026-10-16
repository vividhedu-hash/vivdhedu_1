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
  decodeConsent,
  encodeConsent,
  readConsentCookie,
} from "./session-policy";

export type ConsentCategories = { functional: boolean; analytics: boolean };

export function readConsent(): ConsentChoice | null {
  if (typeof document === "undefined") return null;
  const cookieChoice = readConsentCookie(document.cookie);
  if (cookieChoice) {
    // Keep localStorage synchronized
    try {
      window.localStorage.setItem(CONSENT_COOKIE, encodeConsent(cookieChoice));
    } catch {}
    return cookieChoice;
  }

  // Resilient fallback to localStorage if cookie was blocked, wiped by ITP, or not sent
  try {
    const rawLocal = window.localStorage.getItem(CONSENT_COOKIE);
    if (rawLocal) {
      const localChoice = decodeConsent(rawLocal);
      if (localChoice) {
        // Restore to cookie so server/edge can also read it
        const secure = window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `${CONSENT_COOKIE}=${encodeConsent(localChoice)}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
        return localChoice;
      }
    }
  } catch {
    // Private browsing mode
  }

  return null;
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
  const encoded = encodeConsent(saved);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${encoded}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  try {
    window.localStorage.setItem(CONSENT_COOKIE, encoded);
  } catch {
    /* private mode */
  }

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
 * Drops temporary tab- and leftover-session data. Does not touch the consent choice
 * or the Supabase session blob — signOut owns that blob.
 */
export function clearBrowserSession(includeReportToken: boolean = false): void {
  try {
    window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  } catch { /* private mode */ }
  try {
    window.sessionStorage.removeItem(RETURN_TO_KEY);
    if (includeReportToken) {
      window.sessionStorage.removeItem(REPORT_TOKEN_KEY);
      window.localStorage.removeItem(REPORT_TOKEN_KEY);
    }
  } catch { /* private mode */ }
}
