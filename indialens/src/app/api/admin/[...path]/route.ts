import { NextResponse } from "next/server";
import { fetchBackend, unavailablePayload } from "../../../../lib/backend";

function mapAdminPath(subpath: string, method: string): string {
  if (subpath === "health") return "stats";
  if (subpath === "scrape-runs") return "scrapes";

  const anomaly = subpath.match(/^anomalies\/([^/]+)$/);
  if (anomaly && method === "POST") return `anomalies/${anomaly[1]}/review`;

  const scrape = subpath.match(/^scrape\/([^/]+)$/);
  if (scrape && method === "POST") {
    return `scrapes/trigger?source=${encodeURIComponent(scrape[1])}`;
  }

  return subpath;
}

async function proxy(request: Request, path: string[], method: string) {
  const mapped = mapAdminPath((path ?? []).join("/"), method);
  const apiKey = request.headers.get("x-api-key") ?? "";
  const body = method === "GET" || method === "HEAD" ? undefined : await request.text();

  const resp = await fetchBackend(`/api/admin/${mapped}`, {
    method,
    headers: {
      "X-API-KEY": apiKey,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body || undefined,
    timeoutMs: 15000,
  });

  if (!resp) {
    return NextResponse.json(unavailablePayload("Admin service unavailable"), { status: 503 });
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
