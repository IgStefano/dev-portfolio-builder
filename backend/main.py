from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from fixtures.sample import SAMPLE_GENERATED_SITE, SAMPLE_PROFILE
from schemas import (
    ErrorResponse,
    GeneratedSite,
    GenerateRequest,
    GitHubProfile,
    HealthResponse,
    IngestRequest,
)

app = FastAPI(title="Dev Portfolio Builder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.post(
    "/api/ingest",
    response_model=GitHubProfile,
    responses={
        404: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
    },
)
async def ingest(body: IngestRequest) -> GitHubProfile:
    """Accept a GitHub URL and return a structured profile (stub)."""
    return SAMPLE_PROFILE


@app.post(
    "/api/generate",
    response_model=GeneratedSite,
    responses={
        422: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
    },
)
async def generate(body: GenerateRequest) -> GeneratedSite:
    """Accept a profile + preferences and return a generated site (stub)."""
    return SAMPLE_GENERATED_SITE
