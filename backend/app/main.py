import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import interview

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

app = FastAPI(
    title="AI Interview Agent API",
    version="1.0.0",
    description="Gemini-powered interview generation and evaluation (server-side only).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview.router)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": "AI Interview Agent API",
        "health": "/health",
        "docs": "/docs",
        "api_prefix": "/api/interview",
    }


@app.get("/health")
def health() -> dict[str, str]:
    key_ok = bool(settings.gemini_api_key)
    return {
        "status": "ok",
        "gemini_configured": "yes" if key_ok else "no",
    }
