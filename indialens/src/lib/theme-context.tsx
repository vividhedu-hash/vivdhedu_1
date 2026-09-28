"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { functionalAllowed } from "./consent";
import { THEME_KEY } from "./session-policy";

export type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // On mount, read persisted preference
  useEffect(() => {
    setMounted(true);
    const stored = (typeof localStorage !== "undefined"
      ? localStorage.getItem(THEME_KEY)
      : null) as Theme | null;
    const preferred: Theme = stored ?? "dark";
    setThemeState(preferred);
    document.documentElement.setAttribute("data-theme", preferred);
  }, []);

  const applyTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    if (!functionalAllowed()) return;
    try { localStorage.setItem(THEME_KEY, next); } catch {}
  }, []);

  const toggle = useCallback(() => {
    applyTheme(theme === "dark" ? "light" : "dark");
  }, [theme, applyTheme]);

  const setTheme = useCallback((t: Theme) => { applyTheme(t); }, [applyTheme]);

  // Avoid hydration mismatch by not rendering children until mounted
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: "dark", toggle, setTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
