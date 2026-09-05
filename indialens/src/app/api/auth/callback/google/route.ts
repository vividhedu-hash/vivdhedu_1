import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const callbackUrl = new URL("/auth/callback", url.origin);
  // Forward all query parameters (code, state, etc.)
  url.searchParams.forEach((value, key) => {
    callbackUrl.searchParams.set(key, value);
  });
  return NextResponse.redirect(callbackUrl);
}
