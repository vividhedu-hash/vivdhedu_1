"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, UserRound, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { BRAND } from "@/lib/brand";
import { Skeleton, SkeletonCards } from "@/components/Skeleton";

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
    <div className="page-shell">
      <div className="container-xl page-section">
        <div className="max-w-2xl">
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="mt-5 h-9 w-2/3 max-w-xl" delay={60} />
          <Skeleton className="mt-3 h-4 w-1/2 max-w-md" delay={110} />
        </div>

        <div className="mt-10">
          <SkeletonCards count={3} />
        </div>

        <span className="sr-only" role="status" aria-live="polite">
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
    <div className="t-bg t-text flex min-h-[70vh] items-center justify-center px-4 py-20">
      <div className="t-surface t-border t-shadow-card w-full max-w-md rounded-2xl border p-8">
        <div
          className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: "var(--bg-chip)", border: "1px solid var(--border)" }}
          aria-hidden="true"
        >
          <Lock size={18} className="t-muted" />
        </div>

        <p className="kicker-web mb-2">{title ?? "Members only"}</p>
        <h1 className="text-xl font-bold tracking-tight t-text">
          Sign in to open {title ?? "this page"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed t-muted">
          {description ??
            `Your ${BRAND.name} workspace, saved analyses and psychometric profile live behind an account so they survive a page refresh. You will come straight back here once you sign in.`}
        </p>

        <button type="button" onClick={onSignIn} className="btn-primary mt-6 w-full">
          <UserRound size={15} aria-hidden="true" />
          Sign in to continue
        </button>

        <p className="mono mt-4 text-center text-[11px] t-faint">
          No password. Google, GitHub, or a one-time email link.
        </p>

        <div
          className="mt-6 flex items-center justify-between border-t pt-4 t-faint"
          style={{ borderColor: "var(--divider)" }}
        >
          <span className="mono flex items-center gap-1 text-[11px]">
            <ShieldCheck size={11} style={{ color: "var(--green)" }} aria-hidden="true" />
            Session encrypted
          </span>
          <Link href="/" className="mono text-[11px] transition-colors hover:t-text">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
