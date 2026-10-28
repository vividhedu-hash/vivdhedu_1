"use client";

import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

/**
 * The theme switch.
 *
 * Backed by `lib/theme.ts` with reactive multi-component synchronization,
 * zero-flash document head boot script, and accessibility attributes.
 * Also binds `Alt+T` / `⌘Shift+L` as a quick power-user toggle anywhere on the site.
 */
export function ThemeToggle({
  className = "",
  showLabel = false,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const { active, isDark, toggle, mounted } = useTheme();

  // Power user keyboard shortcut (Alt+T or Cmd/Ctrl+Shift+L)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when inside an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if ((e.altKey && e.key.toLowerCase() === "t") || ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "l")) {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  const nextLabel = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted ? `${nextLabel} (Alt+T)` : "Switch theme"}
      title={mounted ? `${nextLabel} (Alt+T)` : "Switch theme"}
      className={
        "theme-toggle " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] " +
        "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] " +
        (showLabel ? " !w-auto !px-3 gap-2 text-xs font-medium" : "") +
        " " +
        className
      }
    >
      {isDark ? (
        <Sun size={14} className="text-amber-400 shrink-0" aria-hidden="true" />
      ) : (
        <Moon size={14} className="shrink-0" aria-hidden="true" />
      )}
      {showLabel && <span>{isDark ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}
