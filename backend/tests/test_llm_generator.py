"""Tests for llm_generator — mock Anthropic client, no real API calls."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import pytest

from fixtures.sample import SAMPLE_PROFILE
from llm_generator import LLMError, generate_site
from schemas import SiteType, Theme, Tone


# --- helpers ----------------------------------------------------------------


@dataclass
class _ToolBlock:
    type: str = "tool_use"
    name: str = "generate_site"
    input: dict[str, Any] = field(default_factory=dict)


@dataclass
class _Message:
    content: list[_ToolBlock] = field(default_factory=list)


VALID_TOOL_INPUT: dict[str, Any] = {
    "hero": {
        "headline": "Test Developer",
        "subheadline": "Building things.",
    },
    "about": {"text": "About me."},
    "projects": [
        {
            "title": "my-repo",
            "description": "A cool project.",
            "url": "https://github.com/test/my-repo",
            "tags": ["Python"],
        }
    ],
    "blog": None,
}

INVALID_TOOL_INPUT: dict[str, Any] = {
    "hero": {"headline": "Oops"},
    # missing subheadline, about, etc.
}


class _MockMessages:
    """Tracks calls and returns pre-configured responses."""

    def __init__(self, responses: list[_Message]) -> None:
        self._responses = list(responses)
        self.call_count = 0
        self.calls: list[dict[str, Any]] = []

    def create(self, **kwargs: Any) -> _Message:
        self.calls.append(kwargs)
        self.call_count += 1
        return self._responses.pop(0)


class _MockClient:
    def __init__(self, responses: list[_Message]) -> None:
        self.messages = _MockMessages(responses)


# --- tests ------------------------------------------------------------------


def test_happy_path_returns_generated_site() -> None:
    """Single successful call returns a valid GeneratedSite."""
    client = _MockClient([_Message([_ToolBlock(input=VALID_TOOL_INPUT)])])

    result = generate_site(
        profile=SAMPLE_PROFILE,
        site_type=SiteType.portfolio,
        theme=Theme.minimal,
        tone=Tone.professional,
        client=client,
    )

    assert result.hero.headline == "Test Developer"
    assert result.about.text == "About me."
    assert len(result.projects) == 1
    assert result.blog is None
    assert client.messages.call_count == 1


def test_retry_success_on_schema_violation() -> None:
    """First call returns invalid schema, retry succeeds."""
    bad_msg = _Message([_ToolBlock(input=INVALID_TOOL_INPUT)])
    good_msg = _Message([_ToolBlock(input=VALID_TOOL_INPUT)])
    client = _MockClient([bad_msg, good_msg])

    result = generate_site(
        profile=SAMPLE_PROFILE,
        client=client,
    )

    assert result.hero.headline == "Test Developer"
    assert client.messages.call_count == 2
    # Second call should have temperature=0
    assert client.messages.calls[1].get("temperature") == 0


def test_double_schema_failure_raises_llm_error() -> None:
    """Two consecutive schema violations raise LLMError."""
    bad_msg1 = _Message([_ToolBlock(input=INVALID_TOOL_INPUT)])
    bad_msg2 = _Message([_ToolBlock(input=INVALID_TOOL_INPUT)])
    client = _MockClient([bad_msg1, bad_msg2])

    with pytest.raises(LLMError, match="2 attempts"):
        generate_site(
            profile=SAMPLE_PROFILE,
            client=client,
        )

    assert client.messages.call_count == 2


def test_blog_type_includes_blog_section() -> None:
    """site_type=blog produces a prompt requesting blog content."""
    tool_input_with_blog = {
        **VALID_TOOL_INPUT,
        "blog": {
            "heading": "Latest Posts",
            "posts": [
                {
                    "title": "My Post",
                    "summary": "A summary.",
                    "date": "2025-01-01",
                }
            ],
        },
    }
    client = _MockClient([_Message([_ToolBlock(input=tool_input_with_blog)])])

    result = generate_site(
        profile=SAMPLE_PROFILE,
        site_type=SiteType.blog,
        client=client,
    )

    assert result.blog is not None
    assert len(result.blog.posts) == 1


def test_extra_instructions_included_in_prompt() -> None:
    """extra_instructions appear in the user prompt sent to the model."""
    client = _MockClient([_Message([_ToolBlock(input=VALID_TOOL_INPUT)])])

    generate_site(
        profile=SAMPLE_PROFILE,
        extra_instructions="Mention I'm based in Berlin",
        client=client,
    )

    user_msg = client.messages.calls[0]["messages"][0]["content"]
    assert "Mention I'm based in Berlin" in user_msg


def test_no_repos_still_works() -> None:
    """Profile with no repos still produces a valid site."""
    empty_profile = SAMPLE_PROFILE.model_copy(update={"top_repos": [], "languages": []})
    client = _MockClient([_Message([_ToolBlock(input=VALID_TOOL_INPUT)])])

    result = generate_site(
        profile=empty_profile,
        client=client,
    )

    assert result.hero.headline == "Test Developer"
    assert client.messages.call_count == 1
