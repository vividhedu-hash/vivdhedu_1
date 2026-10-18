/**
 * Direct Gemini generateContent — used when FastAPI is not running.
 *
 * This is a live model call, not a canned answer. Grounding is reported
 * honestly: if Google Search citations come back, grounded is true.
 * If Search grounding is quota-blocked (HTTP 429), we retry without the
 * tool and mark grounded false instead of inventing citations.
 */

export type GeminiDirectAnswer = {
  engine: string;
  status: "live";
  grounded: boolean;
  api: "generateContent";
  text: string;
  advice_markdown: string;
  citations: Array<{ url: string; title: string }>;
  search_queries: string[];
  search_suggestions_html: string | null;
  _source: "gemini-direct";
};

const MODEL = (process.env.GEMINI_MODEL || "gemini-3.8-flash").trim();
const BASE = "https://generativelanguage.googleapis.com/v1beta";

export function geminiKey(): string {
  return (process.env.GEMINI_API_KEY || "").trim();
}

export function geminiConfigured(): boolean {
  return geminiKey().length > 8;
}

type GenerateOpts = { timeoutMs?: number; personContext?: string; useSearch?: boolean };

async function callGenerateContent(
  key: string,
  system: string,
  prompt: string,
  useSearch: boolean,
  timeoutMs: number,
): Promise<{ ok: boolean; status: number; raw: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        ...(useSearch ? { tools: [{ google_search: {} }] } : {}),
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
          thinkingConfig: { thinkingBudget: 256 },
        },
      }),
    });
    const raw = await res.text();
    return { ok: res.ok, status: res.status, raw };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    throw Object.assign(new Error(aborted ? "Gemini timed out" : "Gemini request failed"), {
      status: aborted ? 504 : 502,
    });
  } finally {
    clearTimeout(timer);
  }
}

function parseAnswer(raw: string, useSearch: boolean): GeminiDirectAnswer {
  const data = JSON.parse(raw) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      groundingMetadata?: {
        webSearchQueries?: string[];
        groundingChunks?: Array<{ web?: { uri?: string; url?: string; title?: string } }>;
      };
    }>;
  };

  const cand = data.candidates?.[0];
  const text = (cand?.content?.parts || []).map((p) => p.text || "").join("").trim();
  if (!text) {
    throw Object.assign(new Error("Gemini returned empty text"), { status: 502 });
  }

  const meta = cand?.groundingMetadata || {};
  const queries = (meta.webSearchQueries || []).map(String);
  const citations: Array<{ url: string; title: string }> = [];
  for (const chunk of meta.groundingChunks || []) {
    const uri = chunk.web?.uri || chunk.web?.url || "";
    if (uri) citations.push({ url: uri, title: chunk.web?.title || uri });
  }

  return {
    engine: MODEL,
    status: "live",
    grounded: useSearch && (citations.length > 0 || queries.length > 0),
    api: "generateContent",
    text,
    advice_markdown: text,
    citations,
    search_queries: queries,
    search_suggestions_html: null,
    _source: "gemini-direct",
  };
}

export async function geminiGenerate(
  prompt: string,
  opts: GenerateOpts = {},
): Promise<GeminiDirectAnswer> {
  const key = geminiKey();
  if (!key) {
    throw Object.assign(new Error("GEMINI_API_KEY is not set"), { status: 503 });
  }

  const timeoutMs = opts.timeoutMs ?? 90_000;
  const system = [
    "You are VividhEdu's education advisor for Indian students.",
    "Do not invent ranks, fees, CTC, or cutoffs. If you are not sure, say unverified.",
    "Lead with the downside. Do not flatter.",
    opts.personContext ? `PERSON MEMORY:\n${opts.personContext}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const wantSearch = opts.useSearch !== false;
  let result = await callGenerateContent(key, system, prompt, wantSearch, timeoutMs);

  if (!result.ok && result.status === 429 && wantSearch) {
    const ungroundedPrompt =
      `${prompt}\n\nGoogle Search grounding is unavailable on this call. ` +
      `Label every rank, fee, cutoff, and CTC as unverified unless you are certain it is a well-known fact. ` +
      `Do not invent URLs or citations.`;
    result = await callGenerateContent(key, system, ungroundedPrompt, false, timeoutMs);
    if (result.ok) {
      const answer = parseAnswer(result.raw, false);
      answer.text =
        "Note: live Google Search citations were quota-blocked on this call. Treat numbers as unverified unless you check official sources.\n\n" +
        answer.text;
      answer.advice_markdown = answer.text;
      return answer;
    }
  }

  if (!result.ok) {
    throw Object.assign(new Error(`Gemini HTTP ${result.status}: ${result.raw.slice(0, 220)}`), {
      status: result.status === 429 ? 429 : 502,
    });
  }

  return parseAnswer(result.raw, wantSearch);
}
