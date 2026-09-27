/**
 * Client-safe Supabase Instance
 *
 * Provides a singleton SupabaseClient for client components with auto-token refresh
 * and session persistence in localStorage, as well as safe fallback during SSR.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "./supabase";

let cachedClient: SupabaseClient | null = null;

// The auth-js default is flowType: 'implicit', which returns the session in the
// URL *fragment* of whatever page the user lands on. That only stays safe while
// the Redirect URL allow list is closed. While it was empty, anyone could point
// `redirect_to` at their own host and receive a live access_token for whoever
// signed in — full account takeover, with no interaction from the victim.
// PKCE removes that whole class: the token is only ever obtainable by the client
// that initiated the flow and still holds the verifier.
const AUTH_STORAGE_KEY = "theproject_auth_token";

export function getSupabaseClient(): SupabaseClient {
  if (typeof window === "undefined") {
    // Server-side / SSR execution
    return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        flowType: "pkce",
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
        flowType: "pkce",
        storageKey: AUTH_STORAGE_KEY,
      },
    });
  }

  return cachedClient;
}

export const supabase = getSupabaseClient();
