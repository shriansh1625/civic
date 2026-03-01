"""
CivicLens AI — Web Push Notification Service
Feature 2: Send browser push notifications using pywebpush.
"""

import json
import logging
from typing import Optional

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.subscription import PushSubscription, Notification

logger = logging.getLogger("civiclens.push")


class PushNotificationService:
    """
    Sends Web Push notifications to subscribed browser endpoints.
    Uses pywebpush for VAPID-authenticated push messages.
    """

    def __init__(self):
        self.vapid_private_key = getattr(settings, "VAPID_PRIVATE_KEY", "")
        self.vapid_claims_email = getattr(settings, "VAPID_CLAIMS_EMAIL", "mailto:admin@civiclens.ai")

    async def send_push_to_user(
        self,
        db: AsyncSession,
        user_id: int,
        title: str,
        body: str,
        url: str = "/app/alerts",
        scheme_id: Optional[int] = None,
    ):
        """Send a push notification to all of a user's subscribed browsers."""
        # Get all push subscriptions for this user
        result = await db.execute(
            select(PushSubscription).where(PushSubscription.user_id == user_id)
        )
        subscriptions = result.scalars().all()

        if not subscriptions:
            logger.debug(f"No push subscriptions for user {user_id}")
            return

        payload = json.dumps({
            "title": title,
            "body": body,
            "icon": "/civiclens-icon.png",
            "badge": "/civiclens-badge.png",
            "url": url,
            "scheme_id": scheme_id,
        })

        for sub in subscriptions:
            await self._send_push(sub, payload)

    async def _send_push(self, subscription: PushSubscription, payload: str):
        """Send a single push notification."""
        try:
            from pywebpush import webpush, WebPushException

            sub_info = {
                "endpoint": subscription.endpoint,
                "keys": {
                    "p256dh": subscription.p256dh_key,
                    "auth": subscription.auth_key,
                },
            }

            if self.vapid_private_key:
                webpush(
                    subscription_info=sub_info,
                    data=payload,
                    vapid_private_key=self.vapid_private_key,
                    vapid_claims={"sub": self.vapid_claims_email},
                )
                logger.info(f"Push sent to endpoint: {subscription.endpoint[:50]}...")
            else:
                # VAPID key not configured — simulate
                logger.info(
                    f"[PUSH SIMULATION] To user {subscription.user_id}: {payload[:200]}"
                )
        except ImportError:
            logger.warning("pywebpush not installed — simulating push notification")
            logger.info(f"[PUSH SIMULATION] To user {subscription.user_id}: {payload[:200]}")
        except Exception as e:
            logger.error(f"Push notification failed: {e}")

    async def create_and_push_notification(
        self,
        db: AsyncSession,
        user_id: int,
        title: str,
        message: str,
        notification_type: str = "info",
        scheme_id: Optional[int] = None,
    ):
        """Create an in-app notification AND send a push notification."""
        # Create in-app notification
        notif = Notification(
            user_id=user_id,
            scheme_id=scheme_id,
            title=title,
            message=message,
            notification_type=notification_type,
        )
        db.add(notif)
        await db.flush()

        # Send push
        await self.send_push_to_user(
            db=db,
            user_id=user_id,
            title=title,
            body=message,
            url=f"/app/schemes" if scheme_id else "/app/alerts",
            scheme_id=scheme_id,
        )

        return notif


# Singleton
push_service = PushNotificationService()
