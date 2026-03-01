"""
CivicLens AI — Pydantic Schemas for API request/response validation.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Auth Schemas ─────────────────────────────────────────────

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    user_type: str = "citizen"
    state: str = "All India"
    district: str = ""


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    user_type: str
    state: str
    district: str
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Scheme Schemas ───────────────────────────────────────────

class SchemeOut(BaseModel):
    id: int
    title: str
    ministry: str
    department: str
    category: str
    description: str
    eligibility: str
    benefits: str
    documents_required: str
    deadline: str
    state: str
    target_audience: str
    budget_allocated: float
    source_url: str
    ai_summary: str
    is_active: bool
    published_date: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class SchemeCreate(BaseModel):
    title: str
    ministry: str = ""
    department: str = ""
    category: str = "general"
    description: str = ""
    eligibility: str = ""
    benefits: str = ""
    documents_required: str = ""
    deadline: str = ""
    state: str = "All India"
    target_audience: str = "citizen"
    budget_allocated: float = 0.0
    source_url: str = ""


# ── Update Schemas ───────────────────────────────────────────

class UpdateOut(BaseModel):
    id: int
    scheme_id: Optional[int]
    title: str
    content: str
    summary: str
    source_url: str
    category: str
    change_type: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Alert Schemas ────────────────────────────────────────────

class AlertOut(BaseModel):
    id: int
    title: str
    message: str
    alert_type: str
    priority: str
    is_read: bool
    is_email_sent: bool
    scheme_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Preference Schemas ───────────────────────────────────────

class PreferenceCreate(BaseModel):
    category: str
    keywords: str = ""
    notify_email: bool = True
    notify_in_app: bool = True


class PreferenceOut(BaseModel):
    id: int
    category: str
    keywords: str
    notify_email: bool
    notify_in_app: bool

    class Config:
        from_attributes = True


# ── Chat Schemas ─────────────────────────────────────────────

class ChatRequest(BaseModel):
    question: str
    context: Optional[str] = None


class SchemeCard(BaseModel):
    """Structured scheme card returned in chat responses."""
    id: int = 0
    title: str
    ministry: str = ""
    category: str = ""
    eligibility: str = ""
    benefits: str = ""
    budget_cr: float = 0.0
    deadline: str = ""
    source_url: str = ""
    relevance_tag: str = ""


class ChatResponse(BaseModel):
    answer: str
    sources: List[str] = []
    confidence: float = 0.85
    scheme_cards: List[SchemeCard] = []
    suggested_actions: List[str] = []


# ── Crawl Source Schemas ─────────────────────────────────────

class CrawlSourceCreate(BaseModel):
    name: str
    url: str
    category: str = "general"
    crawl_frequency_minutes: int = 60


class CrawlSourceOut(BaseModel):
    id: int
    name: str
    url: str
    category: str
    is_active: bool
    last_crawled_at: Optional[datetime]
    last_status: str
    crawl_frequency_minutes: int

    class Config:
        from_attributes = True


# ── Dashboard Schemas ────────────────────────────────────────

class DashboardStats(BaseModel):
    total_schemes: int
    active_schemes: int
    new_today: int
    total_alerts: int
    unread_alerts: int
    schemes_by_category: dict
    budget_by_ministry: dict
    recent_updates: List[UpdateOut]
    relevant_schemes: List[SchemeOut]
