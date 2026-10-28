"use client";

import { useEffect, useState, useCallback } from "react";
import { THEME_KEY } from "./session-policy";

export type ThemeChoice = "light" | "dark" | "system";
export type ActiveTheme = "light" | "dark";

export const THEME_CHANGE_EVENT = "vividhedu:theme-change";

export function resolveSystemTheme(): ActiveTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getStoredThemeChoice(): ThemeChoice {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(THEME_KEY) || window.localStorage.getItem("il-theme");
    if (stored === "dark" || stored === "light" || stored === "system") {
      return stored as ThemeChoice;
    }
  } catch {
    /* private browsing */
  }
  return "light";
}

export function getActiveTheme(): ActiveTheme {
  if (typeof window === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  const choice = getStoredThemeChoice();
  return choice === "system" ? resolveSystemTheme() : (choice === "dark" ? "dark" : "light");
}

export function applyTheme(choice: ThemeChoice) {
  if (typeof window === "undefined") return;

  const active: ActiveTheme = choice === "system" ? resolveSystemTheme() : choice;

  document.documentElement.setAttribute("data-theme", active);

  try {
    window.localStorage.setItem(THEME_KEY, choice);
  } catch {
    /* private browsing */
  }

  // Notify all listening components across the application
  window.dispatchEvent(
    new CustomEvent(THEME_CHANGE_EVENT, {
      detail: { choice, active },
    })
  );
}

/**
 * React hook to read and change theme reactively with full multi-component sync.
 */
export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>("light");
  const [active, setActive] = useState<ActiveTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const currentChoice = getStoredThemeChoice();
    const currentActive = getActiveTheme();
    setChoice(currentChoice);
    setActive(currentActive);
    setMounted(true);

    const onThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ choice: ThemeChoice; active: ActiveTheme }>;
      if (customEvent.detail) {
        setChoice(customEvent.detail.choice);
        setActive(customEvent.detail.active);
      } else {
        setChoice(getStoredThemeChoice());
        setActive(getActiveTheme());
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY || e.key === "il-theme") {
        const nextChoice = (e.newValue as ThemeChoice) || "light";
        setChoice(nextChoice);
        const resolved = nextChoice === "system" ? resolveSystemTheme() : nextChoice;
        setActive(resolved);
        document.documentElement.setAttribute("data-theme", resolved);
      }
    };

    // System dark mode change listener
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onMediaChange = (e: MediaQueryListEvent) => {
      const stored = getStoredThemeChoice();
      if (stored === "system") {
        const nextActive: ActiveTheme = e.matches ? "dark" : "light";
        setActive(nextActive);
        document.documentElement.setAttribute("data-theme", nextActive);
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
    window.addEventListener("storage", onStorage);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", onMediaChange);
    } else {
      mediaQuery.addListener(onMediaChange);
    }

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
      window.removeEventListener("storage", onStorage);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", onMediaChange);
      } else {
        mediaQuery.removeListener(onMediaChange);
      }
    };
  }, []);

  const setThemeChoice = useCallback((nextChoice: ThemeChoice) => {
    applyTheme(nextChoice);
  }, []);

  const toggle = useCallback(() => {
    const next: ActiveTheme = active === "dark" ? "light" : "dark";
    applyTheme(next);
  }, [active]);

  return {
    choice,
    active,
    mounted,
    setTheme: setThemeChoice,
    toggle,
    isDark: active === "dark",
  };
}
