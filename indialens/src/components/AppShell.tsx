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
 * `pt-[60px]` clears the fixed navbar. It is a magic number that has to track
 * the navbar's own height; if the navbar's vertical padding changes, this
 * needs to change with it. The row inside the nav is `h-11` (44px) plus
 * `py-2.5` (10px above and below) plus a 1px border, so 60px of clearance keeps
 * the first content row clear of the bar without leaving a visible gap.
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
      <main className="flex-1 pt-[60px]">{children}</main>
      <Footer />
    </div>
  );
}
