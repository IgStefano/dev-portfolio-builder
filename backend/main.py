from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from fixtures.sample import SAMPLE_GENERATED_SITE
from github_client import (
    GitHubNotFoundError,
    GitHubRateLimitError,
    GitHubValidationError,
    fetch_profile,
)
from schemas import (
    ErrorCode,
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
async def ingest(body: IngestRequest) -> GitHubProfile | JSONResponse:
    """Accept a GitHub URL and return a structured profile."""
    try:
        return fetch_profile(body.github_url)
    except GitHubValidationError as exc:
        return JSONResponse(
            status_code=422,
            content=ErrorResponse(
                error_code=ErrorCode.validation_error,
                detail=str(exc),
            ).model_dump(),
        )
    except GitHubNotFoundError as exc:
        return JSONResponse(
            status_code=404,
            content=ErrorResponse(
                error_code=ErrorCode.github_not_found,
                detail=str(exc),
            ).model_dump(),
        )
    except GitHubRateLimitError as exc:
        return JSONResponse(
            status_code=429,
            content=ErrorResponse(
                error_code=ErrorCode.github_rate_limit,
                detail=str(exc),
            ).model_dump(),
        )


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
