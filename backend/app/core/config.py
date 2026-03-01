"""
CivicLens AI — Core Configuration
Centralizes all environment-based settings using pydantic-settings.
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # ── Application ──────────────────────────────────────────
    APP_NAME: str = "CivicLens AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # ── Database ─────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///./civiclens.db"

    # ── Authentication ───────────────────────────────────────
    SECRET_KEY: str = "civiclens-super-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # ── Crawler ──────────────────────────────────────────────
    CRAWL_INTERVAL_MINUTES: int = 60
    MAX_CONCURRENT_CRAWLS: int = 8

    # ── AI / LLM ─────────────────────────────────────────────
    LLM_PROVIDER: str = "mock"
    OPENAI_API_KEY: str = ""

    # ── Email ────────────────────────────────────────────────
    SMTP_ENABLED: bool = False
    SMTP_HOST: str = "smtp.example.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "alerts@civiclens.ai"
    SMTP_PASSWORD: str = ""

    # ── CORS ─────────────────────────────────────────────────
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000"

    # ── AMD Deployment ───────────────────────────────────────
    AMD_EPYC_OPTIMIZED: bool = True
    WORKER_THREADS: int = 16

    # ── Web Push (VAPID) ─────────────────────────────────────
    VAPID_PRIVATE_KEY: str = ""
    VAPID_PUBLIC_KEY: str = ""
    VAPID_CLAIMS_EMAIL: str = "mailto:admin@civiclens.ai"

    # ── Demo Mode ────────────────────────────────────────────
    DEMO_MODE: bool = True

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
