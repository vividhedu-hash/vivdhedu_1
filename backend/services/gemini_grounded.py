"""
Gemini 3.7 Flash with Grounding (Google Search).

This is the API equivalent of Google AI Mode: the model searches the live web,
synthesizes an answer, and returns citations. We never invent sources.

Primary: Interactions API (google_search tool).
Fallback: generateContent + google_search (same model).
"""
from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import httpx

from api.config import settings
from services.external_apis import IntegrationUnavailable

logger = logging.getLogger(__name__)

SYSTEM_EDUCATION = """You are IndiaLens Grounded Advisor — an education-and-career intelligence engine for Indian students.
Rules:
- Use Google Search for any current fact: ranks, cutoffs, fees, placements, exam dates, labour-market numbers.
- Do not invent college names, ranks, CTC figures, or cutoffs. If search does not support a number, say it is unverified.
- Prefer official sources: NIRF, AISHE, institute sites, RBI, MoE, NTA, university placement PDFs.
- Distinguish brochure medians from distributions. Flag sample-size and year.
- IndiaLens prices the student × program pair (NPV, P10 downside, AI-occupation risk), not a NIRF reprint.
- Never fabricate citations."""


@dataclass
class Citation:
    url: str
    title: str
    start_index: Optional[int] = None
    end_index: Optional[int] = None
    snippet: Optional[str] = None

    def as_dict(self) -> Dict[str, Any]:
        return {
            "url": self.url,
            "title": self.title,
            "start_index": self.start_index,
            "end_index": self.end_index,
            "snippet": self.snippet,
        }


@dataclass
class GroundedAnswer:
    text: str
    citations: List[Citation] = field(default_factory=list)
    search_queries: List[str] = field(default_factory=list)
    search_suggestions_html: Optional[str] = None
    model: str = ""
    grounded: bool = False
    api: str = ""

    def as_dict(self) -> Dict[str, Any]:
        return {
            "engine": self.model,
            "status": "live",
            "grounded": self.grounded,
            "api": self.api,
            "text": self.text,
            "advice_markdown": self.text,
            "citations": [c.as_dict() for c in self.citations],
            "search_queries": self.search_queries,
            "search_suggestions_html": self.search_suggestions_html,
        }


def extract_json_object(text: str) -> Dict[str, Any]:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        data = json.loads(cleaned)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        data = json.loads(cleaned[start : end + 1])
        if isinstance(data, dict):
            return data
    raise ValueError("Model did not return a JSON object")


class GeminiGroundedClient:
    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.model = (settings.gemini_model or "gemini-3.7-flash").strip()
        self.base = "https://generativelanguage.googleapis.com/v1beta"

    def _require_key(self) -> None:
        if not self.api_key:
            raise IntegrationUnavailable("gemini", "GEMINI_API_KEY is not set", ["GEMINI_API_KEY"])

    async def generate(
        self,
        prompt: str,
        *,
        system: str = SYSTEM_EDUCATION,
        timeout: float = 45.0,
        require_grounding: bool = True,
    ) -> GroundedAnswer:
        self._require_key()
        try:
            answer = await self._via_interactions(prompt, system, timeout)
        except IntegrationUnavailable as first:
            logger.warning("Interactions API failed (%s); trying generateContent", first)
            try:
                answer = await self._via_generate_content(prompt, system, timeout)
            except IntegrationUnavailable as second:
                reason = str(first)
                if "HTTP 404" in reason or "HTTP 400" in reason:
                    raise second
                raise first

        if require_grounding and not answer.grounded:
            raise IntegrationUnavailable(
                "gemini",
                "Gemini returned an ungrounded answer (no Google Search citations). Refusing to present it as live web evidence.",
                status=502,
            )
        return answer

    async def generate_json(
        self,
        prompt: str,
        *,
        system: str = SYSTEM_EDUCATION,
        timeout: float = 50.0,
        require_grounding: bool = True,
    ) -> Dict[str, Any]:
        answer = await self.generate(
            prompt + "\n\nReturn ONLY a single JSON object. No markdown fences.",
            system=system,
            timeout=timeout,
            require_grounding=require_grounding,
        )
        try:
            payload = extract_json_object(answer.text)
        except ValueError as e:
            raise IntegrationUnavailable("gemini", str(e), status=502)
        payload["_grounding"] = {
            "grounded": answer.grounded,
            "citations": [c.as_dict() for c in answer.citations],
            "search_queries": answer.search_queries,
            "search_suggestions_html": answer.search_suggestions_html,
            "engine": answer.model,
            "api": answer.api,
        }
        return payload

    async def _via_interactions(self, prompt: str, system: str, timeout: float) -> GroundedAnswer:
        body = {
            "model": self.model,
            "input": prompt,
            "system_instruction": system,
            "tools": [{"type": "google_search"}],
        }
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                res = await client.post(
                    f"{self.base}/interactions",
                    headers={
                        "x-goog-api-key": self.api_key,
                        "Content-Type": "application/json",
                        "Api-Revision": "2026-05-20",
                    },
                    json=body,
                )
        except httpx.TimeoutException:
            raise IntegrationUnavailable("gemini", "Interactions request timed out", status=504)
        if res.status_code != 200:
            raise IntegrationUnavailable(
                "gemini",
                f"Interactions HTTP {res.status_code}: {res.text[:240]}",
                status=502,
            )
        return self._parse_interactions(res.json())

    def _parse_interactions(self, data: Dict[str, Any]) -> GroundedAnswer:
        text_parts: List[str] = []
        citations: List[Citation] = []
        queries: List[str] = []
        suggestions_html: Optional[str] = None

        output_text = str(data.get("output_text") or "").strip()

        for step in data.get("steps") or []:
            step_type = step.get("type")
            if step_type == "google_search_call":
                args = step.get("arguments") or {}
                q = args.get("queries") or args.get("query") or []
                if isinstance(q, str):
                    queries.append(q)
                else:
                    queries.extend([str(x) for x in q])
            elif step_type == "google_search_result":
                result = step.get("result") or []
                if isinstance(result, list):
                    for item in result:
                        html = None
                        if isinstance(item, str):
                            html = item
                        elif isinstance(item, dict):
                            html = item.get("search_suggestions") or item.get("renderedContent")
                        if isinstance(html, str) and html.strip():
                            suggestions_html = html
            elif step_type == "model_output":
                for block in step.get("content") or []:
                    if block.get("type") == "text" and block.get("text"):
                        text_parts.append(block["text"])
                        for ann in block.get("annotations") or []:
                            if ann.get("type") in ("url_citation", "citation") or ann.get("url"):
                                citations.append(
                                    Citation(
                                        url=ann.get("url") or "",
                                        title=ann.get("title") or ann.get("url") or "source",
                                        start_index=ann.get("start_index") or ann.get("startIndex"),
                                        end_index=ann.get("end_index") or ann.get("endIndex"),
                                    )
                                )

        text = output_text or "\n\n".join(p for p in text_parts if p).strip()
        if not text:
            raise IntegrationUnavailable("gemini", "Interactions returned no text", status=502)
        return GroundedAnswer(
            text=text,
            citations=self._dedupe_citations(citations),
            search_queries=queries,
            search_suggestions_html=suggestions_html,
            model=self.model,
            grounded=len(citations) > 0 or len(queries) > 0,
            api="interactions",
        )

    async def _via_generate_content(self, prompt: str, system: str, timeout: float) -> GroundedAnswer:
        body = {
            "system_instruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "tools": [{"google_search": {}}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 8192},
        }
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                res = await client.post(
                    f"{self.base}/models/{self.model}:generateContent",
                    params={"key": self.api_key},
                    headers={"Content-Type": "application/json"},
                    json=body,
                )
        except httpx.TimeoutException:
            raise IntegrationUnavailable("gemini", "generateContent request timed out", status=504)
        if res.status_code != 200:
            raise IntegrationUnavailable(
                "gemini",
                f"generateContent HTTP {res.status_code}: {res.text[:240]}",
                status=502,
            )
        return self._parse_generate_content(res.json())

    def _parse_generate_content(self, data: Dict[str, Any]) -> GroundedAnswer:
        candidates = data.get("candidates") or []
        if not candidates:
            raise IntegrationUnavailable("gemini", "generateContent returned no candidates", status=502)
        cand = candidates[0]
        parts = (cand.get("content") or {}).get("parts") or []
        text = "".join(p.get("text") or "" for p in parts).strip()
        if not text:
            raise IntegrationUnavailable("gemini", "generateContent returned empty text", status=502)

        meta = cand.get("groundingMetadata") or data.get("groundingMetadata") or {}
        queries = [str(q) for q in (meta.get("webSearchQueries") or [])]
        suggestions_html = None
        entry = meta.get("searchEntryPoint") or {}
        if isinstance(entry, dict):
            suggestions_html = entry.get("renderedContent")

        chunks = meta.get("groundingChunks") or []
        supports = meta.get("groundingSupports") or []
        citations: List[Citation] = []
        for support in supports:
            segment = support.get("segment") or {}
            indices = support.get("groundingChunkIndices") or []
            for idx in indices:
                if idx >= len(chunks):
                    continue
                web = (chunks[idx] or {}).get("web") or {}
                uri = web.get("uri") or web.get("url") or ""
                if not uri:
                    continue
                citations.append(
                    Citation(
                        url=uri,
                        title=web.get("title") or uri,
                        start_index=segment.get("startIndex"),
                        end_index=segment.get("endIndex"),
                    )
                )
        if not citations:
            for chunk in chunks:
                web = (chunk or {}).get("web") or {}
                uri = web.get("uri") or web.get("url") or ""
                if uri:
                    citations.append(Citation(url=uri, title=web.get("title") or uri))

        return GroundedAnswer(
            text=text,
            citations=self._dedupe_citations(citations),
            search_queries=queries,
            search_suggestions_html=suggestions_html,
            model=self.model,
            grounded=bool(citations or queries),
            api="generateContent",
        )

    @staticmethod
    def _dedupe_citations(citations: List[Citation]) -> List[Citation]:
        seen = set()
        out: List[Citation] = []
        for c in citations:
            key = (c.url, c.start_index, c.end_index)
            if not c.url or key in seen:
                continue
            seen.add(key)
            out.append(c)
        return out


gemini_grounded = GeminiGroundedClient()
