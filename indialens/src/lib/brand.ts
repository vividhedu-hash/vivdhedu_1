/**
 * Brand + public contact constants.
 *
 * These exist so the name, the canonical domain, and the support address are
 * defined once. They previously lived as inline strings spread across
 * layout metadata, the navbar, the footer, the OG image and sitemap.ts, and
 * they had drifted into three different names ("IndiaLens", "Your Student
 * OS", "TheProject.edu.in").
 *
 * Every value is overridable by env so a deployment can point at its own
 * domain or support inbox without a code change.
 */

const DEFAULT_APP_URL = "https://indialens.in";

/** Canonical public origin, no trailing slash. */
export const APP_URL: string = (() => {
  const raw = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;
  return raw.replace(/\/+$/, "");
})();

export const BRAND = {
  /** Customer-facing name. */
  name: "VividhEdu",
  /** Short form for tight spaces. */
  shortName: "VividhEdu",
  /** What the product does, one line. */
  tagline: "Price the degree as an asset.",
  /** Longer positioning line used in metadata. */
  descriptor: "Student decision operating system for India",
  /** Where legal notices and support requests go. */
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@indialens.in",
  /** Privacy / data-deletion requests go here, per the DPDP grievance route. */
  privacyEmail: process.env.NEXT_PRIVACY_EMAIL || "privacy@indialens.in",
  /**
   * Operating entity. Stated as a trade name rather than an invented
   * registered-company number — no incorporation details exist in this repo,
   * and a fabricated CIN would be exactly the kind of invented fact the
   * product's own methodology forbids. Set NEXT_PUBLIC_LEGAL_ENTITY once the
   * entity is registered and it appears here.
   */
  legalEntity:
    process.env.NEXT_PUBLIC_LEGAL_ENTITY || "VividhEdu (operated from India)",
  jurisdiction: "India",
  governingLaw: "the laws of India",
} as const;

/** Absolute URL helper for canonical/OG links. */
export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${APP_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** `mailto:` link to the support inbox, with an optional prefilled subject. */
export function mailtoLink(subject?: string): string {
  const base = `mailto:${BRAND.supportEmail}`;
  return subject ? `${base}?subject=${encodeURIComponent(subject)}` : base;
}
