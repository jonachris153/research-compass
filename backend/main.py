"""
Research Compass AI — FastAPI backend entry point.

Start with:
  uvicorn main:app --reload --port 8000

Swagger UI: http://localhost:8000/docs
ReDoc:       http://localhost:8000/redoc
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import database as db
from routers import papers, analysis, intelligence


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB on startup."""
    db.init_db()
    yield


app = FastAPI(
    title="Research Compass AI",
    description=(
        "Analyzes a corpus of open-access research PDFs to extract paper information, "
        "discover topics, compare ML methods, find similar papers, visualize the research "
        "landscape, identify potential research gaps, and generate novel research directions."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow frontend dev server and any localhost port
# ---------------------------------------------------------------------------
origins_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173",
)
origins = [o.strip() for o in origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(papers.router,       prefix="/api/papers")
app.include_router(analysis.router,     prefix="/api")
app.include_router(intelligence.router, prefix="/api")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/api/health", tags=["meta"])
async def health():
    return {"status": "ok", "service": "Research Compass AI"}


@app.get("/", tags=["meta"])
async def root():
    return {
        "message": "Research Compass AI backend is running.",
        "docs": "/docs",
        "health": "/api/health",
    }
