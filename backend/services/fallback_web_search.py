"""
Free-tier live web search with automatic provider fallback.

Tried in order; skip a provider if its key is missing, it rate-limits, or it
errors. Jina (keyless) then DuckDuckGo HTML/Lite always run last so search
never dies for lack of credits.

Used as extra grounding context for Gemini/OpenRouter — does not replace
Gemini's native google_search tool.
"""
from __future__ import annotations

import html as html_lib
import logging
import os
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import parse_qs, quote, unquote, urlparse

import httpx

from api.config import settings

logger = logging.getLogger(__name__)

PROVIDER_TIMEOUT = 8.0
MAX_RESULTS = 5
SNIPPET_CHARS = 500
FAIL_STATUSES = {401, 402, 403, 408, 429, 500, 502, 503, 504}
GROUNDING_HEADER = "LIVE WEB SEARCH SNIPPETS"
_BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


class _Skip(Exception):
    """This provider failed; try the next one."""


@dataclass
class SearchHit:
    title: str
    url: str
    content: str
    provider: str


@dataclass
class SearchBundle:
    provider: str
    query: str
    hits: List[SearchHit] = field(default_factory=list)
    images: List[Dict[str, Any]] = field(default_factory=list)
    direct_answer: str = ""

    def as_markdown(self) -> str:
        if not self.hits:
            return ""
        lines = [
            GROUNDING_HEADER,
            f"(provider: {self.provider}; query: {self.query})",
            "Use these live snippets as evidence. Prefer official sources. "
            "Do not invent ranks, fees, or CTC not supported here or by Google Search.",
            "",
        ]
        for i, hit in enumerate(self.hits, 1):
            title = hit.title.strip() or hit.url
            body = (hit.content or "").strip()
            lines.append(f"### {i}. {title}")
            lines.append(f"- URL: {hit.url}")
            if body:
                lines.append(f"- Content: {body}")
            lines.append("")
        return "\n".join(lines).strip()


def _key(*names: str, setting: str = "") -> str:
    if (setting or "").strip():
        return setting.strip()
    for name in names:
        val = (os.getenv(name) or "").strip()
        if val:
            return val
    return ""


def extract_search_query(prompt: str) -> str:
    """Pull a short query from a long Gemini prompt."""
    text = (prompt or "").strip()
    if not text:
        return ""
    match = re.search(r"Question:\s*(.+)", text, re.IGNORECASE)
    if match:
        return match.group(1).strip().split("\n")[0][:300]
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    compact = " ".join(lines[:6])
    return compact[:300]


def _clip(text: str, limit: int = SNIPPET_CHARS) -> str:
    text = re.sub(r"\s+", " ", (text or "")).strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "…"


def _hits_from_rows(rows: List[Dict[str, Any]], provider: str, n: int) -> List[SearchHit]:
    out: List[SearchHit] = []
    seen = set()
    for row in rows:
        url = (row.get("url") or row.get("link") or row.get("href") or "").strip()
        if not url or url in seen or url.startswith("javascript:"):
            continue
        title = (row.get("title") or row.get("name") or url).strip()
        content = (
            row.get("content")
            or row.get("snippet")
            or row.get("text")
            or row.get("description")
            or row.get("markdown")
            or ""
        )
        seen.add(url)
        out.append(SearchHit(title=title, url=url, content=_clip(str(content)), provider=provider))
        if len(out) >= n:
            break
    return out


async def _request(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    **kwargs: Any,
) -> httpx.Response:
    try:
        res = await client.request(method, url, **kwargs)
    except (httpx.TimeoutException, httpx.NetworkError, httpx.HTTPError) as exc:
        raise _Skip(str(exc)) from exc
    if res.status_code in FAIL_STATUSES or res.status_code >= 400:
        raise _Skip(f"HTTP {res.status_code}")
    return res


_LAST_SEARCH_IMAGES: List[Dict[str, Any]] = []
_LAST_SEARCH_ANSWER: str = ""

async def _tavily(client: httpx.AsyncClient, query: str, n: int) -> List[SearchHit]:
    global _LAST_SEARCH_IMAGES, _LAST_SEARCH_ANSWER
    _LAST_SEARCH_IMAGES = []
    _LAST_SEARCH_ANSWER = ""
    key = _key("TAVILY_API_KEY", setting=settings.tavily_api_key)
    if not key:
        raise _Skip("no key")
    res = await _request(
        client,
        "POST",
        "https://api.tavily.com/search",
        json={
            "api_key": key,
            "query": query,
            "search_depth": "basic",
            "max_results": n,
            "include_images": True,
            "include_image_descriptions": True,
            "include_answer": True,
        },
    )
    data = res.json()
    rows = data.get("results") or []
    raw_images = data.get("images") or []
    imgs: List[Dict[str, Any]] = []
    for item in raw_images:
        if isinstance(item, dict) and item.get("url"):
            imgs.append({
                "url": item.get("url", ""),
                "title": item.get("title") or item.get("description") or "",
                "description": item.get("description") or "",
            })
        elif isinstance(item, str) and item.startswith("http"):
            imgs.append({"url": item, "title": "", "description": ""})
    _LAST_SEARCH_IMAGES = imgs
    _LAST_SEARCH_ANSWER = str(data.get("answer") or "").strip()
    return _hits_from_rows(rows, "tavily", n)


async def _exa(client: httpx.AsyncClient, query: str, n: int) -> List[SearchHit]:
    key = _key("EXA_API_KEY", setting=getattr(settings, "exa_api_key", "") or "")
    if not key:
        raise _Skip("no key")
    res = await _request(
        client,
        "POST",
        "https://api.exa.ai/search",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json={"query": query, "numResults": n, "contents": {"text": {"maxCharacters": SNIPPET_CHARS}}},
    )
    data = res.json()
    rows = []
    for item in data.get("results") or []:
        text = ""
        contents = item.get("contents") or {}
        if isinstance(contents, dict):
            text = contents.get("text") or ""
        rows.append(
            {
                "title": item.get("title"),
                "url": item.get("url"),
                "content": text or item.get("text") or item.get("summary") or "",
            }
        )
    return _hits_from_rows(rows, "exa", n)


async def _firecrawl(client: httpx.AsyncClient, query: str, n: int) -> List[SearchHit]:
    key = _key("FIRECRAWL_API_KEY", setting=settings.firecrawl_api_key)
    if not key:
        raise _Skip("no key")
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    last_err: Optional[_Skip] = None
    for url in ("https://api.firecrawl.dev/v1/search", "https://api.firecrawl.dev/v2/search"):
        try:
            res = await _request(client, "POST", url, headers=headers, json={"query": query, "limit": n})
        except _Skip as exc:
            last_err = exc
            continue
        data = res.json()
        rows = data.get("data") or data.get("results") or data.get("web") or []
        hits = _hits_from_rows(rows, "firecrawl", n)
        if hits:
            return hits
    raise last_err or _Skip("empty")


async def _brave(client: httpx.AsyncClient, query: str, n: int) -> List[SearchHit]:
    key = _key(
        "BRAVE_API_KEY",
        "BRAVE_SEARCH_API_KEY",
        setting=(
            getattr(settings, "brave_api_key", "")
            or getattr(settings, "brave_search_api_key", "")
            or ""
        ),
    )
    if not key:
        raise _Skip("no key")
    res = await _request(
        client,
        "GET",
        "https://api.search.brave.com/res/v1/web/search",
        headers={"Accept": "application/json", "X-Subscription-Token": key},
        params={"q": query, "count": n},
    )
    data = res.json()
    web = data.get("web") or {}
    rows = web.get("results") or data.get("results") or []
    return _hits_from_rows(rows, "brave", n)


async def _you(client: httpx.AsyncClient, query: str, n: int) -> List[SearchHit]:
    key = _key(
        "YOU_API_KEY",
        "YDC_API_KEY",
        setting=(
            getattr(settings, "you_api_key", "")
            or getattr(settings, "ydc_api_key", "")
            or ""
        ),
    )
    if not key:
        raise _Skip("no key")
    last_err: Optional[_Skip] = None
    endpoints = (
        ("https://api.ydc-index.io/search", {"query": query, "num_web_results": n}),
        ("https://api.you.com/api/search", {"query": query, "num_web_results": n}),
    )
    for url, params in endpoints:
        try:
            res = await _request(
                client,
                "GET",
                url,
                headers={"X-API-Key": key, "Accept": "application/json"},
                params=params,
            )
        except _Skip as exc:
            last_err = exc
            continue
        data = res.json()
        hits_raw = (
            data.get("hits")
            or (data.get("results") or {}).get("web")
            or data.get("web")
            or data.get("results")
            or []
        )
        if isinstance(hits_raw, dict):
            hits_raw = hits_raw.get("results") or hits_raw.get("web") or []
        rows = []
        for item in hits_raw:
            if not isinstance(item, dict):
                continue
            rows.append(
                {
                    "title": item.get("title") or item.get("name"),
                    "url": item.get("url") or item.get("link"),
                    "content": item.get("snippet") or item.get("description") or item.get("content") or "",
                }
            )
        hits = _hits_from_rows(rows, "you", n)
        if hits:
            return hits
    raise last_err or _Skip("empty")


def _parse_jina_payload(data: Any, n: int) -> List[SearchHit]:
    rows: List[Dict[str, Any]] = []
    if isinstance(data, dict):
        payload = data.get("data") or data.get("results") or data.get("items") or []
        if isinstance(payload, list):
            rows = payload
        elif isinstance(data.get("content"), str):
            return _parse_jina_markdown(data["content"], n)
    elif isinstance(data, list):
        rows = data
    return _hits_from_rows(rows, "jina", n)


def _parse_jina_markdown(text: str, n: int) -> List[SearchHit]:
    hits: List[SearchHit] = []
    seen = set()
    for match in re.finditer(r"\[([^\]]+)\]\((https?://[^)]+)\)", text or ""):
        title, url = match.group(1).strip(), match.group(2).strip()
        if url in seen:
            continue
        seen.add(url)
        start = match.end()
        snippet = _clip(re.sub(r"\s+", " ", text[start : start + 400]))
        hits.append(SearchHit(title=title, url=url, content=snippet, provider="jina"))
        if len(hits) >= n:
            break
    return hits


async def _jina(client: httpx.AsyncClient, query: str, n: int) -> List[SearchHit]:
    key = _key("JINA_API_KEY", setting=settings.jina_api_key)
    headers = {"Accept": "application/json", "User-Agent": _BROWSER_UA}
    if key:
        headers["Authorization"] = f"Bearer {key}"
    encoded = quote(query, safe="")
    last_err: Optional[_Skip] = None
    for base in (f"https://s.jina.ai/{encoded}", f"https://jina.ai/{encoded}"):
        try:
            res = await _request(client, "GET", base, headers=headers)
        except _Skip as exc:
            last_err = exc
            continue
        ctype = (res.headers.get("content-type") or "").lower()
        if "json" in ctype:
            try:
                hits = _parse_jina_payload(res.json(), n)
            except ValueError:
                hits = _parse_jina_markdown(res.text, n)
        else:
            hits = _parse_jina_markdown(res.text, n)
        if hits:
            return hits
        last_err = _Skip("empty")
    raise last_err or _Skip("empty")


def _ddg_unwrap(href: str) -> str:
    href = html_lib.unescape(href or "").strip()
    if not href:
        return ""
    parsed = urlparse(href)
    if "uddg" in (parsed.query or ""):
        qs = parse_qs(parsed.query)
        if qs.get("uddg"):
            return unquote(qs["uddg"][0])
    if href.startswith("//"):
        return "https:" + href
    return href


def _parse_ddg_html(markup: str, n: int) -> List[SearchHit]:
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(markup or "", "html.parser")
    hits: List[SearchHit] = []
    seen = set()

    for a in soup.select("a.result__a"):
        url = _ddg_unwrap(a.get("href") or "")
        if not url or url in seen or "duckduckgo.com" in url:
            continue
        title = a.get_text(" ", strip=True) or url
        snippet_el = a.find_parent("div", class_=re.compile(r"result"))
        snippet = ""
        if snippet_el:
            sn = snippet_el.select_one(".result__snippet")
            snippet = sn.get_text(" ", strip=True) if sn else ""
        seen.add(url)
        hits.append(SearchHit(title=title, url=url, content=_clip(snippet), provider="duckduckgo"))
        if len(hits) >= n:
            return hits

    for a in soup.select("a[href]"):
        href = a.get("href") or ""
        url = _ddg_unwrap(href)
        if not url.startswith("http"):
            continue
        if "duckduckgo.com" in url or url in seen:
            continue
        title = a.get_text(" ", strip=True)
        if not title or len(title) < 3:
            continue
        seen.add(url)
        parent = a.find_parent("tr") or a.find_parent("td") or a.parent
        snippet = parent.get_text(" ", strip=True) if parent else ""
        hits.append(SearchHit(title=title, url=url, content=_clip(snippet), provider="duckduckgo"))
        if len(hits) >= n:
            break
    return hits


async def _duckduckgo(client: httpx.AsyncClient, query: str, n: int) -> List[SearchHit]:
    headers = {"User-Agent": _BROWSER_UA, "Accept": "text/html"}
    last_err: Optional[_Skip] = None
    attempts: Tuple[Tuple[str, str, Dict[str, str]], ...] = (
        ("POST", "https://html.duckduckgo.com/html/", {"q": query}),
        ("GET", "https://html.duckduckgo.com/html/", {"q": query}),
        ("GET", "https://lite.duckduckgo.com/lite/", {"q": query}),
    )
    for method, url, payload in attempts:
        try:
            if method == "POST":
                res = await _request(client, "POST", url, headers=headers, data=payload)
            else:
                res = await _request(client, "GET", url, headers=headers, params=payload)
        except _Skip as exc:
            last_err = exc
            continue
        hits = _parse_ddg_html(res.text, n)
        if hits:
            return hits
        last_err = _Skip("empty html")
    raise last_err or _Skip("empty")


_PROVIDERS = (
    ("tavily", _tavily),
    ("exa", _exa),
    ("firecrawl", _firecrawl),
    ("brave", _brave),
    ("you", _you),
    ("jina", _jina),
    ("duckduckgo", _duckduckgo),
)


async def search_web(query: str, max_results: int = MAX_RESULTS) -> SearchBundle:
    query = (query or "").strip()
    if not query:
        return SearchBundle(provider="", query="", hits=[])
    n = max(1, min(max_results, 8))
    async with httpx.AsyncClient(timeout=PROVIDER_TIMEOUT, follow_redirects=True) as client:
        for name, fn in _PROVIDERS:
            try:
                hits = await fn(client, query, n)
            except _Skip as exc:
                logger.info("web search skip %s: %s", name, exc)
                continue
            except Exception as exc:  # noqa: BLE001 — never kill the AI path for search
                logger.warning("web search %s crashed: %s", name, exc)
                continue
            if hits:
                logger.info("web search used %s (%s hits)", name, len(hits))
                imgs = list(_LAST_SEARCH_IMAGES) if name == "tavily" else []
                ans = str(_LAST_SEARCH_ANSWER) if name == "tavily" else ""
                return SearchBundle(provider=name, query=query, hits=hits, images=imgs, direct_answer=ans)
    logger.warning("web search: every provider failed for %r", query[:80])
    return SearchBundle(provider="", query=query, hits=[])


async def ground_prompt(prompt: str) -> Tuple[str, Optional[SearchBundle]]:
    """Prepend live search snippets. Idempotent if already injected."""
    if GROUNDING_HEADER in (prompt or ""):
        return prompt, None
    query = extract_search_query(prompt)
    if not query:
        return prompt, None
    bundle = await search_web(query)
    md = bundle.as_markdown()
    if not md:
        return prompt, bundle
    return f"{md}\n\n---\n\n{prompt}", bundle


def apply_to_answer(answer: Any, bundle: Optional[SearchBundle]) -> Any:
    """If the model returned no citations, treat fallback hits as grounding."""
    if answer is None or bundle is None or not bundle.hits:
        return answer
    if getattr(answer, "grounded", False) and getattr(answer, "citations", None):
        return answer
    from services.gemini_grounded import Citation

    extra = [
        Citation(url=h.url, title=h.title or h.url, snippet=h.content)
        for h in bundle.hits
        if h.url
    ]
    existing = list(getattr(answer, "citations", None) or [])
    seen = {c.url for c in existing}
    for c in extra:
        if c.url not in seen:
            existing.append(c)
            seen.add(c.url)
    answer.citations = existing
    queries = list(getattr(answer, "search_queries", None) or [])
    if bundle.query and bundle.query not in queries:
        queries.append(bundle.query)
    answer.search_queries = queries
    answer.grounded = bool(existing)
    api = getattr(answer, "api", "") or ""
    suffix = f"web_search:{bundle.provider}"
    if suffix not in api:
        answer.api = f"{api}+{suffix}" if api else suffix
    if getattr(bundle, "images", None):
        answer.images = list(bundle.images)
    if getattr(bundle, "direct_answer", None):
        answer.direct_answer = str(bundle.direct_answer)
    return answer
