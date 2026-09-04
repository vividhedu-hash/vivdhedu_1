import { NextResponse } from "next/server";
import { fetchBackend, unavailablePayload } from "../../../../lib/backend";

async function proxy(request: Request, path: string[], method: string) {
  const subpath = (path ?? []).join("/");
  const url = new URL(request.url);
  const qs = url.search;
  const headers: Record<string, string> = {};
  const contentType = request.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
  const apiKey = request.headers.get("x-api-key");
  if (apiKey) headers["X-API-KEY"] = apiKey;

  const body = method === "GET" || method === "HEAD" ? undefined : await request.text();

  const resp = await fetchBackend(`/api/v2/${subpath}${qs}`, {
    method,
    headers,
    body: body || undefined,
    timeoutMs: subpath.startsWith("ai/") ? 6000 : 3000,
  });

  if (resp) {
    const text = await resp.text();
    try {
      return NextResponse.json(JSON.parse(text), { status: resp.status });
    } catch {
      return new NextResponse(text, { status: resp.status });
    }
  }

  // Pure Vercel Serverless Fallback Handlers
  if (subpath === "health") {
    return NextResponse.json({ status: "healthy", runtime: "vercel-serverless", v2: true });
  }

  return NextResponse.json({
    status: "ok",
    _source: "serverless",
    message: `Serverless fallback active for /api/v2/${subpath}`,
  });
}

export async function GET(request: Request, { params }: { params: { path: string[] } }) {
  return proxy(request, params.path, "GET");
}

export async function POST(request: Request, { params }: { params: { path: string[] } }) {
  return proxy(request, params.path, "POST");
}
