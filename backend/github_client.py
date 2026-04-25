"""Deep module: GitHub profile ingestion.

Single entry point: ``fetch_profile(url, client=None)`` accepts a GitHub URL
(or shorthand) and returns a ``GitHubProfile``.  HTTP transport is injected
via the optional *client* parameter so tests can supply ``httpx.MockTransport``.
"""

from __future__ import annotations

import base64
import re
from urllib.parse import urlparse

import httpx

from schemas import GitHubProfile, RepoInfo

# ---------------------------------------------------------------------------
# Typed exceptions
# ---------------------------------------------------------------------------


class GitHubNotFoundError(Exception):
    """Raised when the GitHub user does not exist (HTTP 404)."""


class GitHubRateLimitError(Exception):
    """Raised when GitHub returns HTTP 403 with rate-limit headers."""


class GitHubValidationError(Exception):
    """Raised when the input cannot be parsed into a GitHub username."""


# ---------------------------------------------------------------------------
# URL parsing
# ---------------------------------------------------------------------------

_GITHUB_PATH_RE = re.compile(r"^/?([a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?)(?:/.*)?$")


def parse_github_input(raw: str) -> str:
    """Extract a GitHub username from various input formats.

    Accepted shapes:
    - ``https://github.com/foo``
    - ``http://github.com/foo/bar``
    - ``github.com/foo``
    - ``github.com/foo/bar/baz``
    - ``@foo``
    - Any of the above with trailing slash or query strings.

    Returns the lowercase username.  Raises ``GitHubValidationError`` on
    unrecognisable input.
    """
    text = raw.strip()
    if not text:
        raise GitHubValidationError("Input is empty")

    # Handle @username shorthand
    if text.startswith("@"):
        username = text[1:]
        if re.fullmatch(r"[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?", username):
            return username.lower()
        raise GitHubValidationError(f"Invalid GitHub username: {username}")

    # Normalise: add scheme if missing so urlparse works
    if not text.startswith(("http://", "https://")):
        text = "https://" + text

    parsed = urlparse(text)
    host = (parsed.hostname or "").lower()
    if host not in ("github.com", "www.github.com"):
        raise GitHubValidationError(f"Not a GitHub URL: {raw}")

    match = _GITHUB_PATH_RE.match(parsed.path)
    if not match:
        raise GitHubValidationError(f"Cannot extract username from: {raw}")

    return match.group(1).lower()


# ---------------------------------------------------------------------------
# Profile fetching
# ---------------------------------------------------------------------------

_README_MAX_CHARS = 3000
_API_BASE = "https://api.github.com"


def _default_client() -> httpx.Client:
    return httpx.Client(
        base_url=_API_BASE,
        headers={"Accept": "application/vnd.github.v3+json"},
        timeout=15.0,
    )


def _decode_readme(content_b64: str) -> str:
    """Decode a base64-encoded README and truncate to ~3000 chars."""
    try:
        text = base64.b64decode(content_b64).decode("utf-8", errors="replace")
    except Exception:
        return ""
    if len(text) > _README_MAX_CHARS:
        return text[:_README_MAX_CHARS] + "\n\n[truncated]"
    return text


def _fetch_readme(client: httpx.Client, owner: str, repo: str) -> str | None:
    """Fetch a repo's README via the API.  Returns None on 404 or error."""
    resp = client.get(f"/repos/{owner}/{repo}/readme")
    if resp.status_code == 404:
        return None
    if resp.status_code == 403:
        raise GitHubRateLimitError("GitHub API rate limit exceeded")
    if resp.status_code >= 400:
        return None
    data = resp.json()
    return _decode_readme(data.get("content", ""))


def _select_top_repos(
    repos: list[dict],
) -> list[dict]:
    """Select top 6 non-fork, non-archived repos by stars then pushed_at.

    If fewer than 3 qualify, fall back to all non-fork repos.
    """
    qualifying = [r for r in repos if not r.get("fork") and not r.get("archived")]
    if len(qualifying) < 3:
        qualifying = [r for r in repos if not r.get("fork")]

    qualifying.sort(
        key=lambda r: (
            r.get("stargazers_count", 0),
            r.get("pushed_at", ""),
        ),
        reverse=True,
    )
    return qualifying[:6]


def fetch_profile(
    raw_url: str,
    client: httpx.Client | None = None,
) -> GitHubProfile:
    """Ingest a GitHub profile from a URL / shorthand.

    Parameters
    ----------
    raw_url:
        Any accepted input shape (see ``parse_github_input``).
    client:
        Optional ``httpx.Client`` — pass a client with a mock transport for
        testing.  If ``None``, a default client targeting ``api.github.com``
        is created.
    """
    username = parse_github_input(raw_url)
    own_client = client is None
    if own_client:
        client = _default_client()

    try:
        return _fetch_profile_impl(client, username)
    finally:
        if own_client:
            client.close()


def _fetch_profile_impl(
    client: httpx.Client,
    username: str,
) -> GitHubProfile:
    # 1. User info
    resp = client.get(f"/users/{username}")
    if resp.status_code == 404:
        raise GitHubNotFoundError(f"GitHub user not found: {username}")
    if resp.status_code == 403:
        raise GitHubRateLimitError("GitHub API rate limit exceeded")
    resp.raise_for_status()
    user = resp.json()

    # 2. Repos (first page, 100 per page — sufficient for top-6 selection)
    resp = client.get(
        f"/users/{username}/repos",
        params={"per_page": "100", "sort": "pushed"},
    )
    if resp.status_code == 403:
        raise GitHubRateLimitError("GitHub API rate limit exceeded")
    repos_json: list[dict] = resp.json() if resp.status_code == 200 else []

    top_repos_raw = _select_top_repos(repos_json)

    # 3. Profile README (username/username repo)
    profile_readme = _fetch_readme(client, username, username)

    # 4. Top-repo README (first qualifying repo — fetched for LLM context)
    if top_repos_raw:
        _fetch_readme(client, username, top_repos_raw[0]["name"])

    # Build language list (deduplicated, ordered by frequency)
    lang_counts: dict[str, int] = {}
    for r in repos_json:
        lang = r.get("language")
        if lang:
            lang_counts[lang] = lang_counts.get(lang, 0) + 1
    languages = sorted(lang_counts, key=lambda lang: lang_counts[lang], reverse=True)

    top_repos = [
        RepoInfo(
            name=r["name"],
            description=r.get("description"),
            url=r.get("html_url", ""),
            stars=r.get("stargazers_count", 0),
            language=r.get("language"),
            is_fork=r.get("fork", False),
        )
        for r in top_repos_raw
    ]

    return GitHubProfile(
        username=user.get("login", username),
        name=user.get("name"),
        avatar_url=user.get("avatar_url", ""),
        bio=user.get("bio"),
        location=user.get("location"),
        blog=user.get("blog") or None,
        public_repos=user.get("public_repos", 0),
        followers=user.get("followers", 0),
        top_repos=top_repos,
        languages=languages,
        profile_readme=profile_readme,
    )
