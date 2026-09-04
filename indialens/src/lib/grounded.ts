export type Citation = {
  url: string;
  title: string;
  start_index?: number | null;
  end_index?: number | null;
  snippet?: string | null;
};

export type GroundedPayload = {
  engine?: string;
  status?: string;
  grounded?: boolean;
  api?: string;
  text?: string;
  advice_markdown?: string;
  citations?: Citation[];
  search_queries?: string[];
  search_suggestions_html?: string | null;
  error?: string;
};

export type PathNode = {
  id: string;
  label: string;
  kind?: string;
  layer?: number;
  note?: string;
  catalog_program_id?: string | null;
  citation_urls?: string[];
};

export type PathEdge = {
  from: string;
  to: string;
  label?: string;
  weight?: number;
};

export type IntelligencePayload = {
  token?: string;
  headline?: string;
  archetype?: string;
  confidence?: number;
  strengths?: string[];
  risks?: string[];
  decision_rules?: string[];
  open_questions?: string[];
  catalog_used?: number;
  persisted?: boolean;
  path?: { nodes: PathNode[]; edges: PathEdge[] };
  grounding?: GroundedPayload;
  model?: string;
};

export async function getAi<T>(path: string): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(path);
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export async function postAi<T>(path: string, body: unknown): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export function aiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const body = data as { detail?: unknown; reason?: string };
  const detail = body.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (detail && typeof detail === "object") {
    const reason = (detail as { reason?: string }).reason;
    if (reason) return reason;
  }
  if (typeof body.reason === "string" && body.reason.trim()) return body.reason;
  return fallback;
}
