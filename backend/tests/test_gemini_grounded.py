from backend.services.gemini_grounded import GeminiGroundedClient, extract_json_object
from backend.services.personal_intelligence import present_personal_intelligence


def test_extract_json_object_from_fence():
    raw = '```json\n{"headline": "ok", "nodes": []}\n```'
    data = extract_json_object(raw)
    assert data["headline"] == "ok"


def test_parse_interactions_citations_without_duplicating_output_text():
    client = GeminiGroundedClient()
    payload = {
        "output_text": "Spain won Euro 2024.",
        "steps": [
            {"type": "google_search_call", "arguments": {"queries": ["UEFA Euro 2024 winner"]}},
            {
                "type": "google_search_result",
                "result": [{"search_suggestions": "<div>More</div>"}],
            },
            {
                "type": "model_output",
                "content": [
                    {
                        "type": "text",
                        "text": "Spain won Euro 2024.",
                        "annotations": [
                            {
                                "type": "url_citation",
                                "url": "https://www.uefa.com/euro2024",
                                "title": "uefa.com",
                                "start_index": 0,
                                "end_index": 21,
                            }
                        ],
                    }
                ],
            },
        ],
    }
    answer = client._parse_interactions(payload)
    assert answer.text == "Spain won Euro 2024."
    assert answer.grounded is True
    assert answer.citations[0].url == "https://www.uefa.com/euro2024"
    assert answer.search_suggestions_html == "<div>More</div>"


def test_present_personal_intelligence_normalizes_row():
    presented = present_personal_intelligence(
        {
            "token": "abc",
            "model_version": "gemini-3.7-flash",
            "profile_data": {"target_field": "engineering-cs"},
            "intelligence": {"headline": "Payback first", "strengths": ["budget"], "risks": []},
            "path_graph": {"nodes": [{"id": "n1", "label": "JEE"}], "edges": []},
            "citations": {"grounded": True, "citations": []},
        }
    )
    assert presented["token"] == "abc"
    assert presented["headline"] == "Payback first"
    assert presented["persisted"] is True
    assert presented["path"]["nodes"][0]["id"] == "n1"


def test_parse_generate_content_citations():
    client = GeminiGroundedClient()
    payload = {
        "candidates": [
            {
                "content": {"parts": [{"text": "NIT Trichy CSE median was reported for 2024."}]},
                "groundingMetadata": {
                    "webSearchQueries": ["NIT Trichy CSE placement 2024"],
                    "groundingChunks": [
                        {"web": {"uri": "https://nirfindia.org/example", "title": "NIRF"}}
                    ],
                    "groundingSupports": [
                        {
                            "segment": {"startIndex": 0, "endIndex": 20},
                            "groundingChunkIndices": [0],
                        }
                    ],
                },
            }
        ]
    }
    answer = client._parse_generate_content(payload)
    assert answer.grounded is True
    assert answer.citations[0].url == "https://nirfindia.org/example"
    assert answer.search_queries == ["NIT Trichy CSE placement 2024"]
