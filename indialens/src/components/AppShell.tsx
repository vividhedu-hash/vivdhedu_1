"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

/**
 * The shell every route renders inside.
 *
 * The two hardcoded `bg-surface text-ink` wrappers this replaced were
 * not just a token-debt issue — they were a bug. They painted a fixed light
 * background on a wrapper that sits *inside* `<body>`, so on any page that
 * set `data-theme="dark"` the shell stayed light while the page went dark.
 * Tokens (`t-bg` / `t-text`) are what make the theme reach the shell at all.
 *
 * `pt-[58px]` clears the fixed navbar. It is a magic number that has to track
 * the navbar's own height; if the navbar's vertical padding changes, this
 * needs to change with it.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isImmersive =
    pathname.startsWith("/workspace") || pathname.startsWith("/onboard");

  if (isImmersive) {
    return (
      <div className="t-bg t-text min-h-screen">{children}</div>
    );
  }

  return (
    <div className="t-bg t-text min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-[58px]">{children}</main>
      <Footer />
    </div>
  );
}
