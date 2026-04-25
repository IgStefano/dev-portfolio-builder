"""Tests for github_client.fetch_profile using httpx.MockTransport.

No real network calls are made.  The HTTP transport is injected via the
``client`` parameter.
"""

from __future__ import annotations

import base64

import httpx
import pytest

from github_client import (
    GitHubNotFoundError,
    GitHubRateLimitError,
    fetch_profile,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_USER_JSON = {
    "login": "octocat",
    "name": "The Octocat",
    "avatar_url": "https://avatars.githubusercontent.com/u/583231?v=4",
    "bio": "GitHub mascot",
    "location": "San Francisco",
    "blog": "https://github.blog",
    "public_repos": 8,
    "followers": 12345,
}

_REPOS_JSON = [
    {
        "name": "hello-world",
        "description": "My first repo",
        "html_url": "https://github.com/octocat/hello-world",
        "stargazers_count": 2500,
        "language": "Python",
        "fork": False,
        "archived": False,
        "pushed_at": "2025-03-01T00:00:00Z",
    },
    {
        "name": "Spoon-Knife",
        "description": "Demo repo",
        "html_url": "https://github.com/octocat/Spoon-Knife",
        "stargazers_count": 1200,
        "language": "HTML",
        "fork": False,
        "archived": False,
        "pushed_at": "2025-02-01T00:00:00Z",
    },
    {
        "name": "test-repo",
        "description": "A test repo",
        "html_url": "https://github.com/octocat/test-repo",
        "stargazers_count": 800,
        "language": "TypeScript",
        "fork": False,
        "archived": False,
        "pushed_at": "2025-01-15T00:00:00Z",
    },
    {
        "name": "forked-repo",
        "description": "A fork",
        "html_url": "https://github.com/octocat/forked-repo",
        "stargazers_count": 9999,
        "language": "Rust",
        "fork": True,
        "archived": False,
        "pushed_at": "2025-04-01T00:00:00Z",
    },
    {
        "name": "archived-repo",
        "description": "Archived",
        "html_url": "https://github.com/octocat/archived-repo",
        "stargazers_count": 5000,
        "language": "Go",
        "fork": False,
        "archived": True,
        "pushed_at": "2024-01-01T00:00:00Z",
    },
]

_README_CONTENT = base64.b64encode(b"# Hello World\n\nThis is a README.").decode()
_PROFILE_README_CONTENT = base64.b64encode(b"# Hi, I'm Octocat!").decode()


def _make_transport(
    user_status: int = 200,
    repos_json: list[dict] | None = None,
    profile_readme_status: int = 200,
    top_repo_readme_status: int = 200,
) -> httpx.MockTransport:
    """Build a mock transport that responds to the expected GitHub API calls."""
    if repos_json is None:
        repos_json = _REPOS_JSON

    def handler(request: httpx.Request) -> httpx.Response:
        path = request.url.path

        # /users/{user}
        if path == "/users/octocat":
            if user_status == 404:
                return httpx.Response(404, json={"message": "Not Found"})
            if user_status == 403:
                return httpx.Response(
                    403,
                    json={"message": "rate limit"},
                    headers={"X-RateLimit-Remaining": "0"},
                )
            return httpx.Response(200, json=_USER_JSON)

        # /users/{user}/repos
        if path == "/users/octocat/repos":
            if user_status == 403:
                return httpx.Response(
                    403,
                    json={"message": "rate limit"},
                    headers={"X-RateLimit-Remaining": "0"},
                )
            return httpx.Response(200, json=repos_json)

        # /repos/{user}/{user}/readme  (profile README)
        if path == "/repos/octocat/octocat/readme":
            if profile_readme_status == 404:
                return httpx.Response(404, json={"message": "Not Found"})
            return httpx.Response(200, json={"content": _PROFILE_README_CONTENT})

        # /repos/{user}/{repo}/readme  (top-repo README)
        if path.startswith("/repos/octocat/") and path.endswith("/readme"):
            if top_repo_readme_status == 404:
                return httpx.Response(404, json={"message": "Not Found"})
            return httpx.Response(200, json={"content": _README_CONTENT})

        return httpx.Response(404, json={"message": "Not Found"})

    return httpx.MockTransport(handler)


def _make_client(transport: httpx.MockTransport) -> httpx.Client:
    return httpx.Client(
        transport=transport,
        base_url="https://api.github.com",
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestFetchProfileHappyPath:
    def test_returns_populated_profile(self) -> None:
        client = _make_client(_make_transport())
        profile = fetch_profile("https://github.com/octocat", client=client)

        assert profile.username == "octocat"
        assert profile.name == "The Octocat"
        assert profile.bio == "GitHub mascot"
        assert profile.avatar_url.startswith("https://")
        assert profile.followers == 12345

    def test_top_repos_excludes_forks_and_archived(self) -> None:
        client = _make_client(_make_transport())
        profile = fetch_profile("https://github.com/octocat", client=client)

        repo_names = [r.name for r in profile.top_repos]
        assert "forked-repo" not in repo_names
        assert "archived-repo" not in repo_names
        assert "hello-world" in repo_names
        assert "Spoon-Knife" in repo_names

    def test_top_repos_sorted_by_stars_desc(self) -> None:
        client = _make_client(_make_transport())
        profile = fetch_profile("https://github.com/octocat", client=client)

        stars = [r.stars for r in profile.top_repos]
        assert stars == sorted(stars, reverse=True)

    def test_languages_extracted(self) -> None:
        client = _make_client(_make_transport())
        profile = fetch_profile("https://github.com/octocat", client=client)

        assert "Python" in profile.languages
        assert "HTML" in profile.languages

    def test_profile_readme_present(self) -> None:
        client = _make_client(_make_transport())
        profile = fetch_profile("https://github.com/octocat", client=client)

        assert profile.profile_readme is not None
        assert "Octocat" in profile.profile_readme


class TestFetchProfileUserNotFound:
    def test_raises_not_found_error(self) -> None:
        client = _make_client(_make_transport(user_status=404))

        with pytest.raises(GitHubNotFoundError):
            fetch_profile("https://github.com/octocat", client=client)


class TestFetchProfileRateLimit:
    def test_raises_rate_limit_error(self) -> None:
        client = _make_client(_make_transport(user_status=403))

        with pytest.raises(GitHubRateLimitError):
            fetch_profile("https://github.com/octocat", client=client)


class TestFetchProfileZeroRepos:
    def test_empty_repos_still_returns_profile(self) -> None:
        client = _make_client(_make_transport(repos_json=[]))
        profile = fetch_profile("https://github.com/octocat", client=client)

        assert profile.username == "octocat"
        assert profile.top_repos == []
        assert profile.languages == []


class TestFetchProfileMissingReadme:
    def test_profile_readme_none_on_404(self) -> None:
        client = _make_client(_make_transport(profile_readme_status=404))
        profile = fetch_profile("https://github.com/octocat", client=client)

        assert profile.profile_readme is None


class TestReadmeTruncation:
    def test_long_readme_is_truncated(self) -> None:
        long_content = base64.b64encode(b"x" * 5000).decode()

        def handler(request: httpx.Request) -> httpx.Response:
            path = request.url.path
            if path == "/users/octocat":
                return httpx.Response(200, json=_USER_JSON)
            if path == "/users/octocat/repos":
                return httpx.Response(200, json=_REPOS_JSON)
            if path.endswith("/readme"):
                return httpx.Response(200, json={"content": long_content})
            return httpx.Response(404)

        client = _make_client(httpx.MockTransport(handler))
        profile = fetch_profile("https://github.com/octocat", client=client)

        assert profile.profile_readme is not None
        assert len(profile.profile_readme) <= 3100
        assert profile.profile_readme.endswith("[truncated]")
