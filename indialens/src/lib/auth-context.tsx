"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  is_premium: boolean;
  premium_tier: string;
  premium_until?: string | null;
  created_at?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  saveReport: (reportToken: string, title?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "theproject_auth_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Hydrate session from localStorage
  useEffect(() => {
    const savedToken = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (savedToken) {
      setToken(savedToken);
      fetchProfile(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchProfile = async (jwtToken: string) => {
    try {
      const res = await fetch("/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        // Token expired or invalid
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
    } catch {
      // Backend not reachable, keep token for retry
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/auth/google/url");
      if (res.ok) {
        const data = await res.json();
        if (data.configured && data.oauth_url) {
          window.location.href = data.oauth_url;
          return;
        }
      }
      // Fallback: seamless dev/demo login if client ID not configured
      const demoRes = await fetch("/api/v1/auth/google/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "demo_code" }),
      });
      if (demoRes.ok) {
        const authData = await demoRes.json();
        localStorage.setItem(TOKEN_KEY, authData.access_token);
        setToken(authData.access_token);
        setUser(authData.user);
        setIsAuthModalOpen(false);
      }
    } catch (err) {
      console.error("Google login failed:", err);
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string, name?: string) => {
    try {
      const res = await fetch("/api/v1/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      if (res.ok) {
        const authData = await res.json();
        localStorage.setItem(TOKEN_KEY, authData.access_token);
        setToken(authData.access_token);
        setUser(authData.user);
        setIsAuthModalOpen(false);
        return { success: true };
      }
      const err = await res.json();
      return { success: false, error: err.detail || "Authentication failed" };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const saveReport = useCallback(async (reportToken: string, title?: string): Promise<boolean> => {
    if (!token) {
      setIsAuthModalOpen(true);
      return false;
    }
    try {
      const res = await fetch("/api/v1/auth/save-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ report_token: reportToken, title: title || "Degree ROI Analysis" }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginWithGoogle,
        loginWithEmail,
        logout,
        saveReport,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
