"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function DashboardRedirect() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const isPublic = params.get("public") === "true";
    // If user is authenticated and hasn't explicitly requested the public landing page via ?public=true
    if (!isLoading && user && !isPublic) {
      router.replace("/workspace");
    }
  }, [user, isLoading, router]);

  return null;
}
