"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, UserRound, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { BRAND } from "@/lib/brand";

/**
 * AuthGate — route-level guard for pages that require a signed-in student.
 *
 * The three states are deliberately distinct:
 *
 *   1. `isLoading`  → neutral skeleton. NOT a login wall. Supabase hydrates the
 *      session asynchronously, so on a cold load a guard that renders "sign in"
 *      first shows a logged-out flash to users who are in fact signed in. That
 *      is the classic hydration bug, and it is the reason `isLoading` is
 *      checked before `user` rather than merged with it.
 *   2. `!user`       → sign-in affordance. Opening the modal is the same
 *      trigger the Navbar uses, so there is one sign-in surface, not two.
 *   3. `user`        → children.
 *
 * The destination is preserved for the user without a redirect: this component
 * never navigates away from the route they asked for. The path is captured in
 * sessionStorage by the auth context on every login attempt, so when OAuth
 * finally returns, `/auth/callback` sends them back to the page they started
 * from. See `rememberReturnTo` in src/lib/auth-context.tsx.
 *
 * Integration (one line, inside the protected page's own default export):
 *
 *   import { AuthGate } from "@/components/AuthGate";
 *   ...
 *   return <AuthGate>{existingTree}</AuthGate>;
 *
 * Wrap at the top of the returned tree, not around the whole file, so a page
 * that already handles its own 404 still gets to render that first.
 */
export function AuthGate({
  children,
  /** What the user is trying to reach. Shown so the wall is explicable. */
  title,
  description,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
}) {
  const { user, isLoading, setIsAuthModalOpen } = useAuth();

  // `isMounted` exists purely to suppress the skeleton on the very first
  // client render, so the server-rendered markup and the first client render
  // agree. Without it React logs a hydration mismatch on every gated route.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (isLoading || !isMounted) {
    return <AuthGateSkeleton title={title} />;
  }

  if (!user) {
    return <SignInWall title={title} description={description} onSignIn={() => setIsAuthModalOpen(true)} />;
  }

  return <>{children}</>;
}

/**
 * Neutral loading shape. Mirrors the layout of a gated page (a heading bar, a
 * row of content blocks) rather than a spinner, so the transition into real
 * content does not jump.
 */
function AuthGateSkeleton({ title }: { title?: string }) {
  return (
    <div className="min-h-[70vh] bg-[#F8FAFC] text-zinc-950">
      <div className="container-lg py-20">
        <div className="h-3 w-28 rounded-full bg-slate-200/80 animate-pulse" />
        <div className="mt-5 h-9 w-2/3 max-w-xl rounded-lg bg-slate-200/80 animate-pulse" />
        <div className="mt-3 h-4 w-1/2 max-w-md rounded bg-slate-200/60 animate-pulse" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-40 rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className="h-full w-full rounded-2xl bg-slate-100/70" />
            </div>
          ))}
        </div>
        <span className="sr-only" role="status">
          {title ? `Loading ${title}` : "Checking your session"}
        </span>
      </div>
    </div>
  );
}

function SignInWall({
  title,
  description,
  onSignIn,
}: {
  title?: string;
  description?: string;
  onSignIn: () => void;
}) {
  return (
    <div className="min-h-[70vh] bg-[#F8FAFC] text-zinc-950 flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-5">
          <Lock size={18} className="text-zinc-600" />
        </div>

        <p className="kicker-web mb-2">{title ?? "Members only"}</p>
        <h1 className="text-xl font-bold tracking-tight text-zinc-950">
          Sign in to open {title ?? "this page"}
        </h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          {description ??
            `Your ${BRAND.name} workspace, saved analyses and psychometric profile live behind an account so they survive a page refresh. You will come straight back here once you sign in.`}
        </p>

        <button
          onClick={onSignIn}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 active:scale-[0.99] text-white text-sm font-semibold rounded-xl transition"
        >
          <UserRound size={15} />
          Sign in to continue
        </button>

        <p className="mt-4 text-[11px] text-slate-400 font-mono text-center">
          No password. Google, GitHub, or a one-time email link.
        </p>

        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck size={11} className="text-emerald-600" /> Session encrypted
          </span>
          <Link href="/" className="hover:text-zinc-700 transition">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
