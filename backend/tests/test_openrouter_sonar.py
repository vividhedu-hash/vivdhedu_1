"""Sonar answers count as grounded only when citations are present."""

from services.openrouter_grounded import openrouter_grounded


def test_parse_accepts_top_level_url_citations():
    answer = openrouter_grounded._parse(
        {
            "choices": [{"message": {"content": "IIT Bombay CSE median is published by the institute."}}],
            "citations": [
                "https://www.nirfindia.org/Rankings/2024/EngineeringRanking.html",
                "https://www.iitb.ac.in/placements",
            ],
        },
        "perplexity/sonar",
    )
    assert answer.grounded is True
    assert answer.model == "perplexity/sonar"
    assert len(answer.citations) == 2
    assert answer.citations[0].url.startswith("https://www.nirfindia.org")


def test_parse_dedupes_message_and_root_citations():
    url = "https://www.iitb.ac.in/placements"
    answer = openrouter_grounded._parse(
        {
            "choices": [{
                "message": {
                    "content": "See the placement report.",
                    "citations": [{"url": url, "title": "IIT Bombay placements"}],
                }
            }],
            "citations": [url],
        },
        "perplexity/sonar",
    )
    assert len(answer.citations) == 1
    assert answer.citations[0].title == "IIT Bombay placements"


def test_parse_without_citations_is_not_grounded():
    answer = openrouter_grounded._parse(
        {"choices": [{"message": {"content": "A number with no source."}}]},
        "perplexity/sonar",
    )
    assert answer.grounded is False
    assert answer.citations == []
