"""
CivicLens AI — Scheme & Update Models
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float
from datetime import datetime

from app.core.database import Base


class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(500), nullable=False, index=True)
    ministry = Column(String(255), default="")
    department = Column(String(255), default="")
    category = Column(String(100), default="general")  # education, agriculture, health, business, welfare, infrastructure
    description = Column(Text, default="")
    eligibility = Column(Text, default="")
    benefits = Column(Text, default="")
    documents_required = Column(Text, default="")
    deadline = Column(String(100), default="")
    state = Column(String(100), default="All India")
    target_audience = Column(String(255), default="citizen")  # student, msme, startup, farmer, ngo, citizen
    budget_allocated = Column(Float, default=0.0)  # in crores
    source_url = Column(String(1000), default="")
    ai_summary = Column(Text, default="")
    content_hash = Column(String(64), default="")  # SHA-256 for change detection
    is_active = Column(Boolean, default=True)
    last_crawled_at = Column(DateTime, default=None)
    published_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Update(Base):
    __tablename__ = "updates"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scheme_id = Column(Integer, nullable=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, default="")
    summary = Column(Text, default="")
    source_url = Column(String(1000), default="")
    category = Column(String(100), default="general")
    change_type = Column(String(50), default="new")  # new, modified, deadline_extended, closed
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class CrawlSource(Base):
    """Configurable URLs for the autonomous crawler."""
    __tablename__ = "crawl_sources"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    url = Column(String(1000), nullable=False)
    category = Column(String(100), default="general")
    is_active = Column(Boolean, default=True)
    last_crawled_at = Column(DateTime, default=None)
    last_status = Column(String(50), default="pending")  # pending, success, error
    crawl_frequency_minutes = Column(Integer, default=60)
    created_at = Column(DateTime, default=datetime.utcnow)
