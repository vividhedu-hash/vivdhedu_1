/**
 * Client-safe Supabase Instance
 *
 * Provides a singleton SupabaseClient for client components with auto-token refresh
 * and session persistence in localStorage, as well as safe fallback during SSR.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "./supabase";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (typeof window === "undefined") {
    // Server-side / SSR execution
    return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  // Client-side execution: singleton with local storage persistence
  if (!cachedClient) {
    cachedClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "theproject_auth_token",
      },
    });
  }

  return cachedClient;
}

export const supabase = getSupabaseClient();
