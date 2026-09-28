"use client";

import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { functionalAllowed } from "@/lib/consent";
import { THEME_KEY } from "@/lib/session-policy";

type Theme = "dark" | "light";

/**
 * The theme switch.
 *
 * There was a `.theme-toggle` class in globals.css and a `ThemeProvider` in
 * `lib/theme-context.tsx`, but neither was ever mounted: no route rendered a
 * toggle and the provider was imported nowhere. So `[data-theme="dark"]` was
 * unreachable and the "dual-mode" claim in the stylesheet was not true. This
 * component is what makes dark mode real, and it is self-contained so it does
 * not depend on a context provider that is not in the tree.
 *
 * `lib/theme-boot.ts` has already written `data-theme` before first paint, so
 * the initial state here is read from the DOM rather than guessed — reading it
 * avoids a second render that would flash the wrong icon.
 *
 * The choice is stored under the `functional` consent category. If functional
 * storage is not allowed the toggle still works for the session (the attribute
 * is set either way) but nothing is persisted, which is the whole point of
 * gating storage on consent.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
    setMounted(true);
  }, []);

  const apply = useCallback((next: Theme) => {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    if (!functionalAllowed()) return;
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      /* private mode */
    }
  }, []);

  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => apply(next)}
      // `mounted` is not read in the class, but until it flips the button must
      // not be announced with a label that contradicts what is on screen.
      aria-label={mounted ? `Switch to ${next} theme` : "Switch theme"}
      title={mounted ? `Switch to ${next} theme` : "Switch theme"}
      className={
        "theme-toggle " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] " +
        "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] " + className
      }
    >
      {theme === "dark" ? (
        <Sun size={14} aria-hidden="true" />
      ) : (
        <Moon size={14} aria-hidden="true" />
      )}
    </button>
  );
}
