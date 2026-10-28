"use client";

import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function HeroCta() {
  const { user, isLoading } = useAuth();

  if (!isLoading && user) {
    return (
      <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/workspace"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-8 py-3.5 text-[15px] font-bold text-white shadow-md transition-all hover:opacity-95 active:scale-[0.98] sm:w-auto"
        >
          <Zap size={16} />
          Open Workspace
          <ArrowRight size={15} />
        </Link>
        <Link
          href="/explore"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line/10 bg-transparent px-7 py-3.5 text-[15px] font-medium text-ink transition-all hover:border-line/25 hover:bg-overlay/50 active:scale-[0.98] sm:w-auto"
        >
          Browse programs
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <Link
        href="/onboard"
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-7 py-3.5 text-[15px] font-semibold text-bg shadow-md transition-all hover:shadow-lg active:scale-[0.98] sm:w-auto"
      >
        Get started free
        <ArrowRight size={15} />
      </Link>
      <Link
        href="/explore"
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line/10 bg-transparent px-7 py-3.5 text-[15px] font-medium text-ink transition-all hover:border-line/25 hover:bg-overlay/50 active:scale-[0.98] sm:w-auto"
      >
        Browse programs
      </Link>
    </div>
  );
}
