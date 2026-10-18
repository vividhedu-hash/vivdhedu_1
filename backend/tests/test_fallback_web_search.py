import pytest

from services.fallback_web_search import (
    GROUNDING_HEADER,
    SearchBundle,
    SearchHit,
    apply_to_answer,
    extract_search_query,
    search_web,
)
from services.gemini_grounded import Citation, GroundedAnswer


def test_extract_search_query_from_question_line():
    prompt = "Answer with sources.\n\nQuestion: IIT Bombay CSE median 2025\nCite NIRF."
    assert extract_search_query(prompt) == "IIT Bombay CSE median 2025"


def test_as_markdown_has_title_url_content():
    bundle = SearchBundle(
        provider="tavily",
        query="NIT Trichy CSE placement",
        hits=[
            SearchHit(
                title="NIRF",
                url="https://nirfindia.org/example",
                content="Placement report excerpt",
                provider="tavily",
            )
        ],
    )
    md = bundle.as_markdown()
    assert GROUNDING_HEADER in md
    assert "### 1. NIRF" in md
    assert "URL: https://nirfindia.org/example" in md
    assert "Content: Placement report excerpt" in md


def test_apply_to_answer_grounds_when_model_has_no_citations():
    answer = GroundedAnswer(text="Unverified.", grounded=False, api="generateContent")
    bundle = SearchBundle(
        provider="jina",
        query="test",
        hits=[SearchHit("Title", "https://example.edu", "Body", "jina")],
    )
    out = apply_to_answer(answer, bundle)
    assert out.grounded is True
    assert out.citations[0].url == "https://example.edu"
    assert "web_search:jina" in out.api


def test_apply_to_answer_leaves_google_citations_alone():
    answer = GroundedAnswer(
        text="Cited.",
        grounded=True,
        api="generateContent",
        citations=[Citation(url="https://nirfindia.org", title="NIRF")],
    )
    bundle = SearchBundle(
        provider="duckduckgo",
        query="x",
        hits=[SearchHit("Other", "https://other.example", "n", "duckduckgo")],
    )
    out = apply_to_answer(answer, bundle)
    assert len(out.citations) == 1
    assert out.citations[0].url == "https://nirfindia.org"


@pytest.mark.asyncio
async def test_search_web_skips_429_and_uses_next_provider(monkeypatch):
    from services import fallback_web_search as mod

    async def boom_tavily(client, query, n):
        raise mod._Skip("HTTP 429")

    async def boom_exa(client, query, n):
        raise mod._Skip("no key")

    async def boom_fire(client, query, n):
        raise mod._Skip("no key")

    async def boom_brave(client, query, n):
        raise mod._Skip("no key")

    async def boom_you(client, query, n):
        raise mod._Skip("no key")

    async def jina_ok(client, query, n):
        return [SearchHit("Jina hit", "https://example.com/a", "snippet", "jina")]

    monkeypatch.setattr(mod, "_PROVIDERS", (
        ("tavily", boom_tavily),
        ("exa", boom_exa),
        ("firecrawl", boom_fire),
        ("brave", boom_brave),
        ("you", boom_you),
        ("jina", jina_ok),
        ("duckduckgo", boom_you),
    ))
    bundle = await search_web("IIT Delhi cutoff")
    assert bundle.provider == "jina"
    assert bundle.hits[0].url == "https://example.com/a"


def test_parse_ddg_html_extracts_results():
    from services.fallback_web_search import _parse_ddg_html

    html = """
    <div class="result">
      <a class="result__a" href="https://duckduckgo.com/l/?uddg=https%3A%2F%2Fnirfindia.org%2Frank">NIRF Rankings</a>
      <a class="result__snippet">Official ranking PDF</a>
    </div>
    """
    hits = _parse_ddg_html(html, 5)
    assert hits
    assert hits[0].url == "https://nirfindia.org/rank"
    assert "NIRF" in hits[0].title
