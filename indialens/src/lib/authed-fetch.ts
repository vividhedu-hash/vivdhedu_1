/** Attach the Supabase access token so FastAPI can verify the same session. */
export function authHeaders(token: string | null | undefined): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
