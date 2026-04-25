"""Deep module: LLM-based site generation via Anthropic Claude tool-use."""

from __future__ import annotations

from typing import Protocol

from pydantic import ValidationError

from schemas import (
    GeneratedSite,
    GitHubProfile,
    SiteType,
    Theme,
    Tone,
)


class LLMError(Exception):
    """Raised when the LLM fails to produce a valid GeneratedSite."""


class AnthropicClient(Protocol):
    """Minimal protocol so tests can inject a mock."""

    class messages:  # noqa: N801
        @staticmethod
        def create(**kwargs: object) -> object: ...


_TOOL_SCHEMA: dict[str, object] = {
    "name": "generate_site",
    "description": "Generate structured content for a developer portfolio site.",
    "input_schema": GeneratedSite.model_json_schema(),
}


def _build_system_prompt() -> str:
    return (
        "You are an expert copywriter who creates compelling developer portfolio websites. "
        "Given a GitHub profile, write polished, concise copy for a personal developer site. "
        "Always use the generate_site tool to return your output. "
        "Match the requested tone and theme in your writing style. "
        "If the user has no qualifying repositories, still produce a reasonable site "
        "with generic developer-focused copy and mention they are building their public portfolio."
    )


def _build_user_prompt(
    profile: GitHubProfile,
    site_title: str | None,
    site_type: SiteType,
    theme: Theme,
    tone: Tone,
    extra_instructions: str | None,
) -> str:
    parts: list[str] = []

    parts.append(f"GitHub username: {profile.username}")
    if profile.name:
        parts.append(f"Name: {profile.name}")
    if profile.bio:
        parts.append(f"Bio: {profile.bio}")
    if profile.location:
        parts.append(f"Location: {profile.location}")
    if profile.blog:
        parts.append(f"Blog/Website: {profile.blog}")
    parts.append(f"Public repos: {profile.public_repos}")
    parts.append(f"Followers: {profile.followers}")

    if profile.languages:
        parts.append(f"Languages: {', '.join(profile.languages)}")

    if profile.profile_readme:
        parts.append(f"\nProfile README:\n{profile.profile_readme}")

    if profile.top_repos:
        parts.append("\nTop Repositories:")
        for repo in profile.top_repos:
            line = f"- {repo.name}"
            if repo.description:
                line += f": {repo.description}"
            line += f" ({repo.stars} stars"
            if repo.language:
                line += f", {repo.language}"
            line += ")"
            parts.append(line)

    parts.append(
        f"\nSite title: {site_title or f'{profile.name or profile.username} — Developer'}"
    )
    parts.append(f"Site type: {site_type.value}")
    parts.append(f"Theme: {theme.value}")
    parts.append(f"Tone: {tone.value}")

    if site_type in (SiteType.portfolio, SiteType.both):
        parts.append(
            "\nGenerate a hero section, about section, and project cards "
            "based on the user's real repositories."
        )
    if site_type in (SiteType.blog, SiteType.both):
        parts.append(
            "\nGenerate a blog section with 2-3 plausible stub blog posts "
            "related to the user's tech stack and interests."
        )
    if site_type == SiteType.portfolio:
        parts.append("\nDo NOT include a blog section (set blog to null).")

    if extra_instructions:
        parts.append(f"\nAdditional instructions: {extra_instructions}")

    return "\n".join(parts)


def _parse_tool_result(message: object) -> GeneratedSite:
    """Extract and validate GeneratedSite from an Anthropic tool-use response."""
    for block in message.content:  # type: ignore[attr-defined]
        if block.type == "tool_use" and block.name == "generate_site":
            return GeneratedSite.model_validate(block.input)
    raise ValidationError.from_exception_data(
        title="GeneratedSite",
        line_errors=[],
    )


def generate_site(
    profile: GitHubProfile,
    site_title: str | None = None,
    site_type: SiteType = SiteType.portfolio,
    theme: Theme = Theme.minimal,
    tone: Tone = Tone.professional,
    extra_instructions: str | None = None,
    *,
    client: AnthropicClient,
) -> GeneratedSite:
    """Call Anthropic Claude to generate portfolio site content.

    Retries once with temperature=0 on schema-validation failure.
    Raises LLMError if both attempts fail.
    """
    system_prompt = _build_system_prompt()
    user_prompt = _build_user_prompt(
        profile, site_title, site_type, theme, tone, extra_instructions
    )

    call_kwargs: dict[str, object] = {
        "model": "claude-3-5-haiku-latest",
        "max_tokens": 4096,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_prompt}],
        "tools": [_TOOL_SCHEMA],
        "tool_choice": {"type": "tool", "name": "generate_site"},
    }

    last_error: Exception | None = None

    for attempt in range(2):
        try:
            if attempt == 1:
                call_kwargs["temperature"] = 0

            message = client.messages.create(**call_kwargs)  # type: ignore[attr-defined]
            return _parse_tool_result(message)
        except (ValidationError, Exception) as exc:
            if isinstance(exc, LLMError):
                raise
            last_error = exc

    raise LLMError(f"LLM failed to produce valid output after 2 attempts: {last_error}")
