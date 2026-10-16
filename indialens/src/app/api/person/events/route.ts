import { NextRequest, NextResponse } from "next/server";
import { fetchBackend, proxyRequestHeaders } from "@/lib/backend";
import { applyBatch, compileLlmContext, emptyState, type PersonState } from "@/lib/person-memory";

export const dynamic = "force-dynamic";

/**
 * Merge a client snapshot + new events. Forward to FastAPI when the student
 * is signed in. Always return a compiled LLM packet so advisor routes can
 * keep working with the graph even if Postgres is not migrated yet.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events = Array.isArray(body?.events) ? body.events : [];
    const facts = Array.isArray(body?.facts) ? body.facts : [];
    const snapshot = (body?.snapshot && typeof body.snapshot === "object"
      ? body.snapshot
      : emptyState("anonymous")) as PersonState;
    const merged = applyBatch(snapshot, events.slice(0, 50), facts.slice(0, 30), body?.profile);
    const memory = compileLlmContext(merged, false);

    const headers = proxyRequestHeaders(req);
    if (headers.Authorization) {
      const upstream = await fetchBackend("/api/v1/person/events", {
        method: "POST",
        headers,
        body: JSON.stringify({ events, facts, profile: body?.profile }),
        timeoutMs: 4000,
      });
      if (upstream?.ok) {
        const data = await upstream.json().catch(() => null);
        if (data) return NextResponse.json(data);
      }
    }

    return NextResponse.json({ ok: true, persisted: false, memory, _source: "local" });
  } catch (err) {
    console.error("[/api/person/events]", err);
    return NextResponse.json({ error: "Could not record events." }, { status: 400 });
  }
}
