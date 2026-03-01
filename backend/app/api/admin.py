"""
CivicLens AI — Admin Crawl Control API Routes (v2 — demo simulation)
"""

import asyncio
import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.scheme import Scheme, CrawlSource, Update
from app.models.alert import Alert
from app.schemas.models import CrawlSourceCreate, CrawlSourceOut

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# ── In-memory crawl tracking ─────────────────────────────
_crawl_state = {
    "last_crawl_time": None,
    "total_crawls": 0,
    "last_results": {},
}

# Demo schemes that get "discovered" by crawl simulation
_DEMO_DISCOVERED_SCHEMES = [
    dict(title="PM Gram Sadak Yojana Phase-IV", ministry="Ministry of Rural Development",
         category="infrastructure", target_audience="citizen", budget_allocated=19000,
         state="All India",
         description="All-weather road connectivity to remaining unconnected habitations with population 500+ in plain areas and 250+ in hilly areas.",
         eligibility="All unconnected rural habitations. Implementation through state agencies.",
         benefits="All-weather roads, Bridge construction, Road maintenance for 5 years.",
         documents_required="Not applicable — infrastructure project",
         deadline="March 2029", source_url="https://pmgsy.nic.in/",
         ai_summary="Phase-IV: All-weather roads to remaining unconnected villages. ₹19,000 crore allocation."),

    dict(title="National Green Hydrogen Mission", ministry="Ministry of New & Renewable Energy",
         category="technology", target_audience="startup", budget_allocated=19744,
         state="All India",
         description="Development of green hydrogen production ecosystem targeting 5 MMT annual production by 2030.",
         eligibility="Companies, startups, and research institutions in hydrogen/renewable energy sector.",
         benefits="Production incentives, Electrolyser manufacturing support, R&D grants, Export facilitation.",
         documents_required="Company registration, Project proposal, Technology assessment",
         deadline="2030", source_url="https://mnre.gov.in/",
         ai_summary="₹19,744 crore for green hydrogen: 5 MMT/year target, production incentives, R&D grants."),

    dict(title="PM Matsya Kisan Samridhi Yojana", ministry="Ministry of Fisheries",
         category="agriculture", target_audience="farmer", budget_allocated=6000,
         state="All India",
         description="Formalization of fisheries sector with insurance, credit access, and value chain development for fish farmers.",
         eligibility="Fish farmers, aquaculture workers, and fisheries cooperatives registered on national platform.",
         benefits="Micro-insurance coverage, Working capital loans, Cold chain infrastructure, Performance grants.",
         documents_required="Aadhaar, Fisherman ID, Bank account, Registration on fisheries platform",
         deadline="Ongoing", source_url="https://pmmsy.dof.gov.in/",
         ai_summary="₹6,000 crore for fish farmers: insurance, credit access, cold chain, and performance grants."),
]


@router.get("/crawl-sources")
async def get_crawl_sources(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all configurable crawl sources with status."""
    result = await db.execute(select(CrawlSource).order_by(desc(CrawlSource.created_at)))
    sources = result.scalars().all()

    if not sources:
        return _get_default_sources()

    return [
        {
            "id": s.id, "name": s.name, "url": s.url,
            "category": s.category, "is_active": s.is_active,
            "last_crawled_at": str(s.last_crawled_at) if s.last_crawled_at else None,
            "last_status": s.last_status or "pending",
            "crawl_frequency_minutes": s.crawl_frequency_minutes,
        }
        for s in sources
    ]


@router.get("/crawl-stats")
async def get_crawl_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get crawl system health and statistics."""
    total_sources = await db.execute(select(func.count(CrawlSource.id)))
    active_sources = await db.execute(
        select(func.count(CrawlSource.id)).where(CrawlSource.is_active == True)
    )
    total_schemes = await db.execute(select(func.count(Scheme.id)))
    recent_updates = await db.execute(
        select(func.count(Update.id)).where(
            Update.created_at >= datetime.utcnow() - timedelta(days=7)
        )
    )

    return {
        "total_sources": total_sources.scalar() or 0,
        "active_sources": active_sources.scalar() or 0,
        "total_schemes": total_schemes.scalar() or 0,
        "updates_this_week": recent_updates.scalar() or 0,
        "last_crawl_time": str(_crawl_state["last_crawl_time"]) if _crawl_state["last_crawl_time"] else None,
        "total_crawl_runs": _crawl_state["total_crawls"],
        "last_results": _crawl_state["last_results"],
        "system_health": "healthy",
        "ai_confidence": 0.92,
        "uptime_hours": random.randint(120, 720),
    }


@router.post("/crawl-sources")
async def add_crawl_source(
    data: CrawlSourceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a new crawl source URL."""
    source = CrawlSource(
        name=data.name,
        url=data.url,
        category=data.category,
        crawl_frequency_minutes=data.crawl_frequency_minutes,
    )
    db.add(source)
    await db.flush()
    await db.refresh(source)
    return {"status": "created", "id": source.id}


@router.put("/crawl-sources/{source_id}/toggle")
async def toggle_crawl_source(
    source_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggle a crawl source active/inactive."""
    result = await db.execute(select(CrawlSource).where(CrawlSource.id == source_id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    source.is_active = not source.is_active
    return {"status": "ok", "is_active": source.is_active}


@router.post("/trigger-crawl")
async def trigger_crawl(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger a demo-simulated crawl cycle.
    Adds 1-3 new schemes, creates updates, and returns realistic stats.
    """
    now = datetime.utcnow()

    # Update crawl source timestamps
    result = await db.execute(select(CrawlSource).where(CrawlSource.is_active == True))
    active_sources = result.scalars().all()
    sources_crawled = len(active_sources)
    for src in active_sources:
        src.last_crawled_at = now
        src.last_status = "success"

    # Pick 1-2 new schemes to "discover"
    new_count = 0
    for demo_scheme in _DEMO_DISCOVERED_SCHEMES:
        existing = await db.execute(
            select(Scheme).where(Scheme.title == demo_scheme["title"])
        )
        if existing.scalar_one_or_none() is None:
            s = Scheme(**demo_scheme)
            s.content_hash = f"crawl_{random.randint(1000, 9999)}"
            s.last_crawled_at = now
            s.created_at = now
            s.published_date = now
            db.add(s)
            await db.flush()

            # Create an update entry
            db.add(Update(
                scheme_id=s.id,
                title=f"New: {s.title}",
                content=s.description[:200],
                summary=s.ai_summary or s.description[:150],
                source_url=s.source_url,
                category=s.category,
                change_type="new",
                created_at=now,
            ))

            # Alert the admin
            db.add(Alert(
                user_id=current_user.id,
                scheme_id=s.id,
                title=f"Crawler discovered: {s.title}",
                message=s.ai_summary or s.description[:150],
                alert_type="new_scheme",
                priority="high",
                created_at=now,
            ))

            new_count += 1
            if new_count >= 2:
                break

    # Simulate some "updated" schemes
    updated_count = random.randint(1, 3)

    await db.commit()

    # Update in-memory state
    _crawl_state["last_crawl_time"] = now
    _crawl_state["total_crawls"] += 1
    _crawl_state["last_results"] = {
        "sources_crawled": sources_crawled,
        "pages_scanned": sources_crawled * random.randint(3, 8),
        "new_schemes": new_count,
        "updated_schemes": updated_count,
        "errors": 0,
        "duration_seconds": round(random.uniform(2.1, 5.8), 1),
    }

    return {
        "status": "Crawl cycle completed",
        "results": _crawl_state["last_results"],
        "message": f"Successfully crawled {sources_crawled} sources. Found {new_count} new scheme(s) and updated {updated_count}.",
    }


@router.delete("/crawl-sources/{source_id}")
async def delete_crawl_source(
    source_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a crawl source."""
    result = await db.execute(select(CrawlSource).where(CrawlSource.id == source_id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    await db.delete(source)
    return {"status": "deleted"}


def _get_default_sources():
    """Default crawl sources for demo."""
    return [
        {"id": i, "name": n, "url": u, "category": c, "is_active": True,
         "last_crawled_at": None, "last_status": "pending", "crawl_frequency_minutes": 60}
        for i, (n, u, c) in enumerate([
            ("MyScheme Portal", "https://www.myscheme.gov.in/", "welfare"),
            ("India.gov.in Schemes", "https://www.india.gov.in/my-government/schemes", "general"),
            ("PM India Initiatives", "https://www.pmindia.gov.in/en/major_initiatives/", "flagship"),
            ("Startup India", "https://www.startupindia.gov.in/", "startup"),
            ("MSME Ministry", "https://msme.gov.in/", "business"),
            ("Agriculture Ministry", "https://agricoop.nic.in/", "agriculture"),
            ("Scholarship Portal", "https://scholarships.gov.in/", "education"),
            ("eGazette", "https://egazette.gov.in/", "gazette"),
        ], 1)
    ]
