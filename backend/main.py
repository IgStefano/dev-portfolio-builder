from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Dev Portfolio Builder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MessageResponse(BaseModel):
    message: str


class HealthResponse(BaseModel):
    status: str


@app.get("/", response_model=MessageResponse)
async def root():
    return MessageResponse(message="Dev Portfolio Builder API is running")


@app.get("/api/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok")
