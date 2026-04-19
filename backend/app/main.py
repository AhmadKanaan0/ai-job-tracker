from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings
from app.core.database import Base, engine
from app.routers import auth, cv, jobs, tracker, analyze, cover_letter

# ── Create all tables on startup (safe for local dev) ───────────────────────
# For production, use Alembic migrations instead.
import app.models  # noqa: F401 — registers all models with Base
Base.metadata.create_all(bind=engine)

# ── Ensure upload directory exists ───────────────────────────────────────────
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="AI-powered job search backend — search jobs, analyse CV fit, track applications.",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS — allow your frontend origin ────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Serve uploaded files locally (skip in production with S3) ────────────────
if settings.STORAGE_BACKEND == "local":
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(cv.router)
app.include_router(jobs.router)
app.include_router(tracker.router)
app.include_router(analyze.router)
app.include_router(cover_letter.router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "app": settings.APP_NAME}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
