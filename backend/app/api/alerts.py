"""
CivicLens AI — Alerts API Routes
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, update, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.alert import Alert
from app.schemas.models import AlertOut

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("")
async def get_alerts(
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user alerts."""
    query = select(Alert).where(Alert.user_id == current_user.id)
    if unread_only:
        query = query.where(Alert.is_read == False)
    query = query.order_by(desc(Alert.created_at)).limit(limit)

    result = await db.execute(query)
    alerts = result.scalars().all()

    if not alerts:
        # Return sample alerts for demo
        return _get_sample_alerts()

    return [
        {
            "id": a.id, "title": a.title, "message": a.message,
            "alert_type": a.alert_type, "priority": a.priority,
            "is_read": a.is_read, "is_email_sent": a.is_email_sent,
            "scheme_id": a.scheme_id,
            "created_at": str(a.created_at),
        }
        for a in alerts
    ]


@router.put("/{alert_id}/read")
async def mark_alert_read(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark an alert as read."""
    await db.execute(
        update(Alert)
        .where(Alert.id == alert_id, Alert.user_id == current_user.id)
        .values(is_read=True)
    )
    return {"status": "ok"}


@router.put("/read-all")
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all alerts as read."""
    await db.execute(
        update(Alert)
        .where(Alert.user_id == current_user.id, Alert.is_read == False)
        .values(is_read=True)
    )
    return {"status": "ok"}


@router.get("/count")
async def get_alert_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get unread alert count."""
    result = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.user_id == current_user.id,
            Alert.is_read == False,
        )
    )
    return {"unread_count": result.scalar() or 3}


def _get_sample_alerts():
    """Sample alerts for demo."""
    from datetime import datetime, timedelta
    return [
        {
            "id": 1, "title": "🆕 New Scheme: PM Vishwakarma Yojana",
            "message": "A new scheme for traditional artisans and craftspeople has been launched with ₹13,000 crore allocation. Check eligibility now.",
            "alert_type": "new_scheme", "priority": "high",
            "is_read": False, "is_email_sent": True, "scheme_id": 1,
            "created_at": datetime.utcnow().isoformat(),
        },
        {
            "id": 2, "title": "⏰ Deadline in 5 days: Startup India Seed Fund",
            "message": "The application deadline for Startup India Seed Fund is approaching. Submit your application before 31-March-2026.",
            "alert_type": "deadline_reminder", "priority": "urgent",
            "is_read": False, "is_email_sent": True, "scheme_id": 2,
            "created_at": (datetime.utcnow() - timedelta(hours=3)).isoformat(),
        },
        {
            "id": 3, "title": "📢 Update: NSP Scholarships Portal Refreshed",
            "message": "The National Scholarship Portal has been updated with new schemes for 2026-27. 15 new scholarships added for post-graduate students.",
            "alert_type": "update", "priority": "normal",
            "is_read": False, "is_email_sent": False, "scheme_id": 5,
            "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
        },
        {
            "id": 4, "title": "🆕 New: PM Surya Ghar Yojana",
            "message": "Free electricity up to 300 units per month through rooftop solar. 1 crore households targeted. Subsidy up to ₹78,000.",
            "alert_type": "new_scheme", "priority": "normal",
            "is_read": True, "is_email_sent": True, "scheme_id": None,
            "created_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
        },
        {
            "id": 5, "title": "💰 Budget Update: Agriculture Allocation Increased",
            "message": "Union Budget 2026-27 has increased agriculture allocation by 12%. New focus on organic farming and crop insurance.",
            "alert_type": "update", "priority": "normal",
            "is_read": True, "is_email_sent": True, "scheme_id": None,
            "created_at": (datetime.utcnow() - timedelta(days=5)).isoformat(),
        },
    ]
