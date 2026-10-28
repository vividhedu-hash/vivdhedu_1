"use client";

import {
  CONSENT_COOKIE,
  CONSENT_EVENT,
  CONSENT_MAX_AGE_SECONDS,
  LEGACY_ACCESS_TOKEN_KEY,
  OPEN_COOKIE_SETTINGS_EVENT,
  PERSON_ANON_STORAGE_KEY,
  PERSON_MEMORY_STORAGE_KEY,
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

  // 1. Try cookie first
  const cookieChoice = readConsentCookie(document.cookie);
  if (cookieChoice) {
    try {
      window.localStorage.setItem(CONSENT_COOKIE, encodeConsent(cookieChoice));
      window.localStorage.setItem("indialens_consent", encodeConsent(cookieChoice));
      window.localStorage.setItem("cookie_consent", "true");
    } catch {}
    return cookieChoice;
  }

  // 2. Resilient fallback across all possible localStorage keys
  try {
    const candidateKeys = [CONSENT_COOKIE, "indialens_consent", "cookie_consent", "cookie-consent", "vividhedu-consent"];
    for (const key of candidateKeys) {
      const rawLocal = window.localStorage.getItem(key);
      if (rawLocal) {
        const localChoice = decodeConsent(rawLocal);
        if (localChoice) {
          const secure = window.location.protocol === "https:" ? "; Secure" : "";
          const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
          document.cookie = `${CONSENT_COOKIE}=${encodeConsent(localChoice)}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Expires=${expires}; SameSite=Lax${secure}`;
          document.cookie = `indialens_consent=${encodeConsent(localChoice)}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Expires=${expires}; SameSite=Lax${secure}`;
          return localChoice;
        }
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
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();

  // Persist to both current and legacy cookie names with full Expires attribute to survive restarts
  document.cookie = `${CONSENT_COOKIE}=${encoded}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Expires=${expires}; SameSite=Lax${secure}`;
  document.cookie = `indialens_consent=${encoded}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Expires=${expires}; SameSite=Lax${secure}`;

  try {
    window.localStorage.setItem(CONSENT_COOKIE, encoded);
    window.localStorage.setItem("indialens_consent", encoded);
    window.localStorage.setItem("cookie_consent", "true");
  } catch {
    /* private mode */
  }

  if (!saved.functional) {
    try { window.localStorage.removeItem(THEME_KEY); } catch { /* private mode */ }
    try {
      window.localStorage.removeItem(PERSON_ANON_STORAGE_KEY);
      const drop: string[] = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(`${PERSON_MEMORY_STORAGE_KEY}:`)) drop.push(key);
      }
      drop.forEach((key) => window.localStorage.removeItem(key));
    } catch { /* private mode */ }
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
