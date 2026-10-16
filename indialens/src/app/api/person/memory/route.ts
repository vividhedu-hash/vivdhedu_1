import { NextRequest, NextResponse } from "next/server";
import { fetchBackend, proxyRequestHeaders } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const headers = proxyRequestHeaders(req);
  if (!headers.Authorization) {
    return NextResponse.json(
      { error: "Sign in to load the durable graph. The browser copy still works locally." },
      { status: 401 },
    );
  }
  const upstream = await fetchBackend("/api/v1/person/memory", {
    method: "GET",
    headers,
    timeoutMs: 4000,
  });
  if (!upstream) {
    return NextResponse.json({ error: "backend_unavailable", persisted: false }, { status: 503 });
  }
  const text = await upstream.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: upstream.status });
  } catch {
    return new NextResponse(text, { status: upstream.status });
  }
}

export async function DELETE(req: NextRequest) {
  const headers = proxyRequestHeaders(req);
  if (!headers.Authorization) {
    return NextResponse.json({ ok: true, persisted: false });
  }
  const upstream = await fetchBackend("/api/v1/person/memory", {
    method: "DELETE",
    headers,
    timeoutMs: 4000,
  });
  if (!upstream) return NextResponse.json({ ok: true, persisted: false });
  const text = await upstream.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: upstream.status });
  } catch {
    return new NextResponse(text, { status: upstream.status });
  }
}
