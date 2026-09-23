"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isImmersive =
    pathname.startsWith("/workspace") || pathname.startsWith("/onboard");

  if (isImmersive) {
    return (
      <div className="min-h-screen bg-black text-[#F5F5F7]">{children}</div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-[#F5F5F7]">
      <Navbar />
      <main className="flex-1 pt-[58px]">{children}</main>
      <Footer />
    </div>
  );
}
