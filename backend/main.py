import os

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from llm_generator import LLMError, generate_site
from schemas import (
    ErrorCode,
    ErrorResponse,
    GeneratedSite,
    GenerateRequest,
    GitHubProfile,
    HealthResponse,
    IngestRequest,
)

load_dotenv()

from fixtures.sample import SAMPLE_PROFILE  # noqa: E402

app = FastAPI(title="Dev Portfolio Builder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _anthropic_key_present() -> bool:
    return bool(os.environ.get("ANTHROPIC_API_KEY", "").strip())


@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        anthropic_key_present=_anthropic_key_present(),
    )


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
async def generate(body: GenerateRequest) -> GeneratedSite | JSONResponse:
    """Accept a profile + preferences and return a generated site."""
    if not _anthropic_key_present():
        return JSONResponse(
            status_code=502,
            content=ErrorResponse(
                error_code=ErrorCode.llm_error,
                detail="Anthropic API key is not configured.",
            ).model_dump(),
        )

    client = anthropic.Anthropic()

    try:
        return generate_site(
            profile=body.profile,
            site_title=body.site_title,
            site_type=body.site_type,
            theme=body.theme,
            tone=body.tone,
            extra_instructions=body.instructions,
            client=client,
        )
    except LLMError as exc:
        return JSONResponse(
            status_code=502,
            content=ErrorResponse(
                error_code=ErrorCode.llm_error,
                detail=str(exc),
            ).model_dump(),
        )
