"""
CivicLens AI — Scheme Tracking & Push Notification API Routes
Feature 2: Subscribe to schemes, receive notifications, manage push subscriptions.
"""

import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, update, delete, func, and_
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.scheme import Scheme
from app.models.subscription import SchemeSubscription, Notification, PushSubscription

logger = logging.getLogger("civiclens.api.tracking")

router = APIRouter(prefix="/api", tags=["Scheme Tracking & Notifications"])


# ── Pydantic Schemas ─────────────────────────────────────────

class PushSubscriptionCreate(BaseModel):
    endpoint: str
    p256dh_key: str
    auth_key: str


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    read: bool
    scheme_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════════
# SCHEME SUBSCRIPTIONS
# ═══════════════════════════════════════════════════════════════

@router.post("/subscribe/{scheme_id}")
async def subscribe_to_scheme(
    scheme_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Subscribe to a scheme for deadline and update notifications."""
    # Verify scheme exists
    scheme = await db.execute(select(Scheme).where(Scheme.id == scheme_id))
    scheme_obj = scheme.scalar_one_or_none()
    if not scheme_obj:
        raise HTTPException(status_code=404, detail="Scheme not found")

    # Check if already subscribed
    existing = await db.execute(
        select(SchemeSubscription).where(
            and_(
                SchemeSubscription.user_id == current_user.id,
                SchemeSubscription.scheme_id == scheme_id,
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already tracking this scheme")

    sub = SchemeSubscription(user_id=current_user.id, scheme_id=scheme_id)
    db.add(sub)
    await db.flush()

    # Create a welcome notification
    notif = Notification(
        user_id=current_user.id,
        scheme_id=scheme_id,
        title=f"Now tracking: {scheme_obj.title[:100]}",
        message=f"You'll receive updates and deadline reminders for {scheme_obj.title}.",
        notification_type="system",
    )
    db.add(notif)
    await db.flush()

    logger.info(f"User {current_user.id} subscribed to scheme {scheme_id}")
    return {"status": "subscribed", "scheme_id": scheme_id, "scheme_title": scheme_obj.title}


@router.delete("/subscribe/{scheme_id}")
async def unsubscribe_from_scheme(
    scheme_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Unsubscribe from a scheme."""
    result = await db.execute(
        delete(SchemeSubscription).where(
            and_(
                SchemeSubscription.user_id == current_user.id,
                SchemeSubscription.scheme_id == scheme_id,
            )
        )
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")

    logger.info(f"User {current_user.id} unsubscribed from scheme {scheme_id}")
    return {"status": "unsubscribed", "scheme_id": scheme_id}


@router.get("/subscriptions")
async def get_subscriptions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all schemes the user is tracking."""
    result = await db.execute(
        select(SchemeSubscription)
        .where(SchemeSubscription.user_id == current_user.id)
        .order_by(desc(SchemeSubscription.created_at))
    )
    subs = result.scalars().all()

    # Enrich with scheme details
    out = []
    for sub in subs:
        sch = await db.execute(select(Scheme).where(Scheme.id == sub.scheme_id))
        scheme = sch.scalar_one_or_none()
        out.append({
            "subscription_id": sub.id,
            "scheme_id": sub.scheme_id,
            "scheme_title": scheme.title if scheme else "Unknown",
            "scheme_category": scheme.category if scheme else "",
            "scheme_deadline": scheme.deadline if scheme else "",
            "created_at": str(sub.created_at),
        })
    return out


# ═══════════════════════════════════════════════════════════════
# NOTIFICATIONS (IN-APP)
# ═══════════════════════════════════════════════════════════════

@router.get("/notifications")
async def get_notifications(
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user notifications."""
    query = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        query = query.where(Notification.read == False)
    query = query.order_by(desc(Notification.created_at)).limit(limit)

    result = await db.execute(query)
    notifs = result.scalars().all()

    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "notification_type": n.notification_type,
            "read": n.read,
            "scheme_id": n.scheme_id,
            "created_at": str(n.created_at),
        }
        for n in notifs
    ]


@router.get("/notifications/count")
async def get_notification_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get unread notification count."""
    result = await db.execute(
        select(func.count(Notification.id)).where(
            and_(Notification.user_id == current_user.id, Notification.read == False)
        )
    )
    count = result.scalar() or 0
    return {"unread_count": count}


@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a notification as read."""
    await db.execute(
        update(Notification)
        .where(and_(Notification.id == notification_id, Notification.user_id == current_user.id))
        .values(read=True)
    )
    return {"status": "ok"}


@router.put("/notifications/read-all")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all notifications as read."""
    await db.execute(
        update(Notification)
        .where(and_(Notification.user_id == current_user.id, Notification.read == False))
        .values(read=True)
    )
    return {"status": "ok"}


# ═══════════════════════════════════════════════════════════════
# PUSH SUBSCRIPTIONS (Web Push)
# ═══════════════════════════════════════════════════════════════

@router.post("/push/subscribe")
async def register_push_subscription(
    data: PushSubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Register a Web Push subscription for the current user."""
    # Check if this endpoint already registered
    existing = await db.execute(
        select(PushSubscription).where(
            and_(
                PushSubscription.user_id == current_user.id,
                PushSubscription.endpoint == data.endpoint,
            )
        )
    )
    if existing.scalar_one_or_none():
        return {"status": "already_registered"}

    sub = PushSubscription(
        user_id=current_user.id,
        endpoint=data.endpoint,
        p256dh_key=data.p256dh_key,
        auth_key=data.auth_key,
    )
    db.add(sub)
    await db.flush()

    logger.info(f"Push subscription registered for user {current_user.id}")
    return {"status": "registered"}


@router.delete("/push/subscribe")
async def unregister_push_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove all push subscriptions for the current user."""
    await db.execute(
        delete(PushSubscription).where(PushSubscription.user_id == current_user.id)
    )
    return {"status": "unregistered"}
