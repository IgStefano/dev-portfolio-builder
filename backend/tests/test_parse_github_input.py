"""Unit tests for parse_github_input — pure function, no network calls."""

import pytest

from github_client import GitHubValidationError, parse_github_input


# --- Valid inputs ---


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("https://github.com/octocat", "octocat"),
        ("http://github.com/octocat", "octocat"),
        ("https://github.com/Octocat", "octocat"),
        ("github.com/octocat", "octocat"),
        ("https://www.github.com/octocat", "octocat"),
        ("www.github.com/octocat", "octocat"),
        # Repo URL → reduces to owner
        ("https://github.com/octocat/hello-world", "octocat"),
        ("github.com/octocat/hello-world", "octocat"),
        ("https://github.com/octocat/hello-world/tree/main", "octocat"),
        # Trailing slash
        ("https://github.com/octocat/", "octocat"),
        ("github.com/octocat/", "octocat"),
        # Query strings
        ("https://github.com/octocat?tab=repositories", "octocat"),
        ("github.com/octocat?tab=repositories&sort=stars", "octocat"),
        # @ shorthand
        ("@octocat", "octocat"),
        ("@Octocat", "octocat"),
        # Hyphenated usernames
        ("https://github.com/my-user", "my-user"),
        ("@my-user", "my-user"),
    ],
)
def test_valid_inputs(raw: str, expected: str) -> None:
    assert parse_github_input(raw) == expected


# --- Invalid inputs ---


@pytest.mark.parametrize(
    "raw",
    [
        "",
        "   ",
        "https://gitlab.com/octocat",
        "https://example.com/octocat",
        "not-a-url",
        "@",
        "@@octocat",
        "https://github.com/",
        "https://github.com",
        "@-invalid",
        "@invalid-",
    ],
)
def test_invalid_inputs(raw: str) -> None:
    with pytest.raises(GitHubValidationError):
        parse_github_input(raw)
