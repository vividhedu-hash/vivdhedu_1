/**
 * Live search via VividhEdu Grounded Engine (Tavily + OpenRouter / Gemini).
 *
 * Searches the web and returns citations. An answer with no citations
 * is refused — it must not be shown as current evidence.
 */
import { geminiGenerate, openrouterKey, tavilyKey } from "./gemini-direct";

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

export class SonarUnavailable extends Error {
  constructor(message: string, public status = 503) {
    super(message);
    this.name = "SonarUnavailable";
  }
}

export async function searchWithSonar(query: string, timeoutMs = 45_000): Promise<SonarSearchResult> {
  try {
    const ans = await geminiGenerate(query, { timeoutMs, useSearch: true });
    return {
      text: ans.text,
      citations: (ans.citations || []).map((c) => ({
        url: c.url,
        title: c.title || c.url,
        snippet: c.snippet || null,
      })),
      engine: ans.engine,
      api: "openrouter",
      grounded: true,
      retrieved_at: new Date().toISOString(),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new SonarUnavailable(msg, 502);
  }
}
