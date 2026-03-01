"""
CivicLens AI — Notification Service
Email simulation + in-app alert generation.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session
from app.core.config import settings
from app.models.alert import Alert
from app.models.scheme import Scheme
from app.models.user import User, UserPreference

logger = logging.getLogger("civiclens.notifications")


class NotificationService:
    """
    Handles:
    1. In-app alert creation when new relevant schemes appear
    2. Simulated email notifications
    3. Deadline reminder system
    """

    async def create_alert(
        self,
        db: AsyncSession,
        user_id: int,
        title: str,
        message: str,
        alert_type: str = "new_scheme",
        priority: str = "normal",
        scheme_id: Optional[int] = None,
    ) -> Alert:
        """Create an in-app alert for a user."""
        alert = Alert(
            user_id=user_id,
            scheme_id=scheme_id,
            title=title,
            message=message,
            alert_type=alert_type,
            priority=priority,
        )
        db.add(alert)
        await db.commit()
        await db.refresh(alert)

        # Simulate email
        await self._simulate_email(user_id, title, message, db)

        logger.info(f"🔔 Alert created for user {user_id}: {title}")
        return alert

    async def notify_new_scheme(self, db: AsyncSession, scheme: Scheme):
        """
        When a new scheme is detected, notify all users whose
        preferences match the scheme's category/audience.
        """
        # Find users with matching preferences
        result = await db.execute(select(User).where(User.is_active == True))
        users = result.scalars().all()

        notified_count = 0
        for user in users:
            # Check relevance
            if self._is_scheme_relevant(scheme, user):
                await self.create_alert(
                    db=db,
                    user_id=user.id,
                    title=f"New Scheme: {scheme.title[:100]}",
                    message=(
                        f"A new scheme relevant to you has been added: {scheme.title}\n\n"
                        f"Ministry: {scheme.ministry}\n"
                        f"Category: {scheme.category}\n"
                        f"Benefits: {scheme.benefits[:200]}\n"
                        f"Deadline: {scheme.deadline}"
                    ),
                    alert_type="new_scheme",
                    priority="high" if scheme.target_audience == user.user_type else "normal",
                    scheme_id=scheme.id,
                )
                notified_count += 1

        logger.info(f"📢 Notified {notified_count} users about new scheme: {scheme.title}")

    async def check_deadlines(self):
        """Check for schemes with upcoming deadlines and send reminders."""
        async with async_session() as db:
            result = await db.execute(
                select(Scheme).where(
                    and_(
                        Scheme.is_active == True,
                        Scheme.deadline != "Ongoing",
                        Scheme.deadline != "",
                    )
                )
            )
            schemes = result.scalars().all()

            for scheme in schemes:
                # Try to parse deadline date
                deadline_date = self._parse_deadline(scheme.deadline)
                if deadline_date:
                    days_remaining = (deadline_date - datetime.utcnow()).days
                    if 0 < days_remaining <= 7:
                        await self._send_deadline_reminders(db, scheme, days_remaining)

    async def _send_deadline_reminders(self, db: AsyncSession, scheme: Scheme, days_remaining: int):
        """Send deadline reminders to relevant users."""
        result = await db.execute(select(User).where(User.is_active == True))
        users = result.scalars().all()

        for user in users:
            if self._is_scheme_relevant(scheme, user):
                # Check if reminder already sent
                existing = await db.execute(
                    select(Alert).where(
                        and_(
                            Alert.user_id == user.id,
                            Alert.scheme_id == scheme.id,
                            Alert.alert_type == "deadline_reminder",
                            Alert.created_at >= datetime.utcnow() - timedelta(days=1),
                        )
                    )
                )
                if not existing.scalar_one_or_none():
                    await self.create_alert(
                        db=db,
                        user_id=user.id,
                        title=f"⏰ Deadline in {days_remaining} days: {scheme.title[:80]}",
                        message=(
                            f"The deadline for '{scheme.title}' is approaching!\n"
                            f"Days remaining: {days_remaining}\n"
                            f"Deadline: {scheme.deadline}\n\n"
                            "Apply now to avoid missing out."
                        ),
                        alert_type="deadline_reminder",
                        priority="urgent" if days_remaining <= 3 else "high",
                        scheme_id=scheme.id,
                    )

    async def _simulate_email(self, user_id: int, subject: str, body: str, db: AsyncSession):
        """
        Simulate sending an email notification.
        In production, this would use SMTP / SendGrid / SES on AMD infrastructure.
        """
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if user:
            logger.info(
                f"📧 [EMAIL SIMULATION] To: {user.email}\n"
                f"   Subject: {subject}\n"
                f"   Body: {body[:200]}..."
            )

            # Log to a file for demo purposes
            try:
                with open("email_log.txt", "a", encoding="utf-8") as f:
                    f.write(
                        f"\n{'='*60}\n"
                        f"Date: {datetime.utcnow().isoformat()}\n"
                        f"To: {user.email}\n"
                        f"Subject: {subject}\n"
                        f"Body:\n{body}\n"
                        f"{'='*60}\n"
                    )
            except Exception:
                pass

    def _is_scheme_relevant(self, scheme: Scheme, user: User) -> bool:
        """Check if a scheme is relevant to a user."""
        # Direct audience match
        if scheme.target_audience == user.user_type:
            return True
        # General citizen schemes are relevant to everyone
        if scheme.target_audience == "citizen":
            return True
        # State match
        if scheme.state == "All India":
            return True
        if user.state and user.state in scheme.state:
            return True
        return False

    def _parse_deadline(self, deadline_str: str) -> Optional[datetime]:
        """Attempt to parse a deadline string into a datetime."""
        import re
        from dateutil import parser as date_parser

        if not deadline_str or deadline_str.lower() in ["ongoing", "open", "no deadline"]:
            return None
        try:
            return date_parser.parse(deadline_str, fuzzy=True)
        except (ValueError, TypeError):
            return None


# Singleton
notification_service = NotificationService()
