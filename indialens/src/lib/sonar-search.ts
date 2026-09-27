/**
 * Live search via Perplexity Sonar on OpenRouter.
 *
 * Sonar searches the web and returns citations. An answer with no citations
 * is refused — it must not be shown as current evidence.
 */

export type SonarCitation = {
  url: string;
  title: string;
  snippet?: string | null;
};

export type SonarSearchResult = {
  text: string;
  citations: SonarCitation[];
  engine: string;
  api: "openrouter";
  grounded: true;
  retrieved_at: string;
};

type SonarCitationRaw = string | { url?: string; title?: string; snippet?: string; text?: string };

export function citationsFromSonarPayload(data: {
  citations?: SonarCitationRaw[];
  choices?: { message?: { citations?: SonarCitationRaw[]; content?: string } }[];
}): SonarCitation[] {
  const message = data.choices?.[0]?.message;
  const raw: SonarCitationRaw[] = [
    ...(Array.isArray(message?.citations) ? message.citations : []),
    ...(Array.isArray(data.citations) ? data.citations : []),
  ];
  const seen = new Set<string>();
  const out: SonarCitation[] = [];
  for (const item of raw) {
    const url = typeof item === "string" ? item.trim() : (item?.url || "").trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({
      url,
      title: typeof item === "string" ? url : item.title || url,
      snippet: typeof item === "string" ? null : item.snippet || item.text || null,
    });
  }
  return out;
}

export async function searchWithSonar(query: string, timeoutMs = 45_000): Promise<SonarSearchResult> {
  const apiKey = (process.env.OPENROUTER_API_KEY || "").trim();
  if (!apiKey) {
    throw new SonarUnavailable("OPENROUTER_API_KEY is not set", 503);
  }

  const model = (process.env.OPENROUTER_PRIMARY_MODEL || "perplexity/sonar").trim();
  if (!model.startsWith("perplexity/sonar")) {
    throw new SonarUnavailable(
      `OPENROUTER_PRIMARY_MODEL (${model}) is not a Sonar model`,
      502,
    );
  }

  const base = (process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/$/, "");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://indialens.in",
      "X-Title": "VividhEdu",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are the VividhEdu Grounded Advisor. Search the live web. Do not invent college names, ranks, fees, cutoffs, or salaries. If a source does not support a number, say it is unverified. Prefer NIRF, institute sites, and official exam bodies. Never fabricate citations.",
        },
        {
          role: "user",
          content: `A student searched: ${query}

Answer from live web sources in 4–8 sentences.
- Name the programs or institutions the sources actually discuss.
- State a fee, placement rate, or salary only when a source supports it, and name the year.
- Say what is missing rather than filling the gap.
- End with the most useful next check for the student.`,
        },
      ],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 240);
    throw new SonarUnavailable(`OpenRouter HTTP ${res.status}: ${detail}`, 502);
  }

  const data = (await res.json()) as {
    citations?: SonarCitationRaw[];
    choices?: { message?: { content?: string; citations?: SonarCitationRaw[] } }[];
  };
  const text = (data.choices?.[0]?.message?.content || "").trim();
  const citations = citationsFromSonarPayload(data);
  if (!text || citations.length === 0) {
    throw new SonarUnavailable(
      "Sonar returned an answer with no citations. Refusing to present it as live evidence.",
      502,
    );
  }

  return {
    text,
    citations,
    engine: model,
    api: "openrouter",
    grounded: true,
    retrieved_at: new Date().toISOString(),
  };
}

export class SonarUnavailable extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
