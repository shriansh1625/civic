"""
CivicLens AI — Main Application Entry Point
Autonomous Civic Intelligence Agent for India

Built with:
  • FastAPI (async Python backend)
  • SQLAlchemy 2.0 (async ORM)
  • APScheduler (autonomous crawling)
  • BeautifulSoup (HTML parsing)
  • React + TailwindCSS (frontend)
  
Optimized for AMD EPYC deployment.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.agents.scheduler import start_scheduler, stop_scheduler

# Import API routers
from app.api.auth import router as auth_router
from app.api.schemes import router as schemes_router
from app.api.alerts import router as alerts_router
from app.api.chat import router as chat_router
from app.api.admin import router as admin_router
from app.api.validate import router as validate_router
from app.api.tracking import router as tracking_router

# ── Logging ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(name)-28s │ %(levelname)-7s │ %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("civiclens")


# ── Lifespan ─────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle manager."""
    logger.info("🚀 CivicLens AI starting up...")
    await init_db()
    logger.info("✅ Database initialized")

    start_scheduler()
    logger.info("✅ Scheduler started")

    yield  # Application is running

    stop_scheduler()
    logger.info("👋 CivicLens AI shutting down")


# ── FastAPI App ──────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Autonomous Civic Intelligence Agent for India — Scans government portals, structures information, and delivers personalized civic dashboards.",
    lifespan=lifespan,
    redirect_slashes=False,
)

# ── CORS ─────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ───────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(schemes_router)
app.include_router(alerts_router)
app.include_router(chat_router)
app.include_router(admin_router)
app.include_router(validate_router)
app.include_router(tracking_router)


@app.get("/", tags=["Root"])
async def root():
    """Health check and API info."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "description": "Autonomous Civic Intelligence Agent for India",
        "endpoints": {
            "docs": "/docs",
            "auth": "/api/auth",
            "dashboard": "/api/dashboard",
            "schemes": "/api/schemes",
            "alerts": "/api/alerts",
            "chat": "/api/ask",
            "admin": "/api/admin",
            "validate": "/api/validate",
            "tracking": "/api/subscribe",
            "notifications": "/api/notifications",
        },
    }


@app.get("/health", tags=["Root"])
async def health_check():
    return {"status": "healthy", "service": settings.APP_NAME}
