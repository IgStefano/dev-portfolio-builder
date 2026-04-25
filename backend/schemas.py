from enum import Enum

from pydantic import BaseModel, Field


# --- Enums ---


class SiteType(str, Enum):
    portfolio = "portfolio"
    blog = "blog"
    both = "both"


class Theme(str, Enum):
    minimal = "minimal"
    terminal = "terminal"
    editorial = "editorial"


class Tone(str, Enum):
    professional = "professional"
    playful = "playful"
    minimal = "minimal"


class ErrorCode(str, Enum):
    github_not_found = "github_not_found"
    github_rate_limit = "github_rate_limit"
    validation_error = "validation_error"
    llm_error = "llm_error"


# --- GitHub Profile ---


class RepoInfo(BaseModel):
    name: str
    description: str | None = None
    url: str
    stars: int = 0
    language: str | None = None
    is_fork: bool = False


class GitHubProfile(BaseModel):
    username: str
    name: str | None = None
    avatar_url: str
    bio: str | None = None
    location: str | None = None
    blog: str | None = None
    public_repos: int = 0
    followers: int = 0
    top_repos: list[RepoInfo] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    profile_readme: str | None = None


# --- Generated Site ---


class Hero(BaseModel):
    headline: str
    subheadline: str


class About(BaseModel):
    text: str


class ProjectCard(BaseModel):
    title: str
    description: str
    url: str
    tags: list[str] = Field(default_factory=list)


class BlogPostStub(BaseModel):
    title: str
    summary: str
    date: str


class BlogSection(BaseModel):
    heading: str
    posts: list[BlogPostStub] = Field(default_factory=list)


class GeneratedSite(BaseModel):
    hero: Hero
    about: About
    projects: list[ProjectCard] = Field(default_factory=list)
    blog: BlogSection | None = None


# --- Request / Response Bodies ---


class IngestRequest(BaseModel):
    github_url: str


class GenerateRequest(BaseModel):
    profile: GitHubProfile
    site_title: str | None = None
    site_type: SiteType = SiteType.portfolio
    theme: Theme = Theme.minimal
    tone: Tone = Tone.professional
    instructions: str | None = None


class HealthResponse(BaseModel):
    status: str
    anthropic_key_present: bool


class ErrorResponse(BaseModel):
    error_code: ErrorCode
    detail: str
