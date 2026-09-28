"use client";

import { openCookieSettings } from "@/lib/consent";

/**
 * Reopens the consent dialog in place, for anyone who lands on a page without
 * scrolling to the footer. `/cookies` carries the same control for the
 * standalone page.
 */
export function CookieSettingsButton({
  className = "",
  label = "Cookie settings",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => openCookieSettings()}
      className={
        "rounded-full border border-[var(--border-focus)] px-4 py-2 text-sm font-semibold " +
        "transition hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 " +
        "focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 " +
        "focus-visible:ring-offset-[var(--bg-elevated)] cursor-pointer " +
        className
      }
    >
      {label}
    </button>
  );
}
