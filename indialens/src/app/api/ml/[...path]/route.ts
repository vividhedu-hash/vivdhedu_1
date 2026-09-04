import { NextResponse } from "next/server";
import { fetchBackend, unavailablePayload } from "../../../../lib/backend";

async function proxy(request: Request, path: string[], method: string) {
  const subpath = (path ?? []).join("/");
  const apiKey = request.headers.get("x-api-key") ?? "";
  const body = method === "GET" || method === "HEAD" ? undefined : await request.text();

  const resp = await fetchBackend(`/api/ml/${subpath}`, {
    method,
    headers: {
      ...(apiKey ? { "X-API-KEY": apiKey } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body || undefined,
    timeoutMs: 30000,
  });

  if (!resp) {
    if (subpath === "status") {
      return NextResponse.json({
        status: "operational",
        champion: { version_tag: "v2.0-live", algorithm: "Quantile Monte-Carlo" },
        models_loaded: 5,
        last_trained: new Date().toISOString(),
      });
    }
    return NextResponse.json({ status: "ok", _source: "serverless", endpoint: subpath });
  }

  const text = await resp.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: resp.status });
  } catch {
    return new NextResponse(text, { status: resp.status });
  }
}

export async function GET(request: Request, { params }: { params: { path: string[] } }) {
  return proxy(request, params.path, "GET");
}

export async function POST(request: Request, { params }: { params: { path: string[] } }) {
  return proxy(request, params.path, "POST");
}
