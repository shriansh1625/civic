"""
CivicLens AI — Scheduler (v2)
APScheduler-powered cron-like system for autonomous crawling
and subscription-based deadline notifications.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select, and_

from app.core.config import settings
from app.agents.crawler import crawler_agent
from app.services.notifications import notification_service
from app.core.database import async_session

logger = logging.getLogger("civiclens.scheduler")

scheduler = AsyncIOScheduler()


async def scheduled_crawl():
    """Scheduled job: run a full crawl cycle."""
    logger.info("⏰ Scheduled crawl triggered")
    try:
        await crawler_agent.run_crawl_cycle()
    except Exception as e:
        logger.error(f"Scheduled crawl failed: {e}")


async def scheduled_deadline_check():
    """Scheduled job: check for upcoming deadlines and send alerts (legacy system)."""
    logger.info("⏰ Deadline check triggered")
    try:
        await notification_service.check_deadlines()
    except Exception as e:
        logger.error(f"Deadline check failed: {e}")


async def scheduled_subscription_deadline_check():
    """
    Scheduled job (every 6 hours): check subscribed schemes for approaching deadlines.
    Generates Notification records + sends push notifications for subscribers.
    """
    logger.info("⏰ Subscription deadline check triggered")
    try:
        from app.models.scheme import Scheme
        from app.models.subscription import SchemeSubscription, Notification
        from app.services.push_service import push_service

        async with async_session() as db:
            # Find all schemes with non-trivial deadlines
            schemes_result = await db.execute(
                select(Scheme).where(
                    and_(
                        Scheme.is_active == True,
                        Scheme.deadline != "Ongoing",
                        Scheme.deadline != "",
                        Scheme.deadline != None,
                    )
                )
            )
            schemes = schemes_result.scalars().all()

            notified = 0
            for scheme in schemes:
                deadline_date = _parse_deadline(scheme.deadline)
                if not deadline_date:
                    continue

                days_remaining = (deadline_date - datetime.utcnow()).days
                if days_remaining < 0 or days_remaining > 7:
                    continue

                # Find users subscribed to this scheme
                subs_result = await db.execute(
                    select(SchemeSubscription).where(
                        SchemeSubscription.scheme_id == scheme.id
                    )
                )
                subs = subs_result.scalars().all()

                for sub in subs:
                    # Deduplicate: skip if we already sent a notification today
                    existing = await db.execute(
                        select(Notification).where(
                            and_(
                                Notification.user_id == sub.user_id,
                                Notification.scheme_id == scheme.id,
                                Notification.notification_type == "deadline",
                                Notification.created_at >= datetime.utcnow() - timedelta(hours=12),
                            )
                        )
                    )
                    if existing.scalar_one_or_none():
                        continue

                    title = f"⏰ Deadline in {days_remaining} day{'s' if days_remaining != 1 else ''}: {scheme.title[:80]}"
                    message = (
                        f"The deadline for '{scheme.title}' is approaching!\n"
                        f"Days remaining: {days_remaining}\n"
                        f"Deadline: {scheme.deadline}\n"
                        f"Apply now to avoid missing out."
                    )

                    await push_service.create_and_push_notification(
                        db=db,
                        user_id=sub.user_id,
                        title=title,
                        message=message,
                        notification_type="deadline",
                        scheme_id=scheme.id,
                    )
                    notified += 1

            await db.commit()
            logger.info(f"📢 Subscription deadline check complete: {notified} notifications sent")

    except Exception as e:
        logger.error(f"Subscription deadline check failed: {e}", exc_info=True)


def _parse_deadline(deadline_str: str) -> Optional[datetime]:
    """Parse a deadline string into a datetime."""
    if not deadline_str or deadline_str.lower() in ("ongoing", "open", "no deadline", "continuous"):
        return None
    try:
        from dateutil import parser as date_parser
        return date_parser.parse(deadline_str, fuzzy=True)
    except (ValueError, TypeError):
        return None


def start_scheduler():
    """Initialize and start the APScheduler."""
    # Delay first run so startup completes before any jobs fire
    first_crawl = datetime.now() + timedelta(minutes=2)
    first_deadline = datetime.now() + timedelta(minutes=5)

    # Crawl cycle every N minutes (first run after 2 min delay)
    scheduler.add_job(
        scheduled_crawl,
        trigger=IntervalTrigger(minutes=settings.CRAWL_INTERVAL_MINUTES, start_date=first_crawl),
        id="civic_crawl_cycle",
        name="Civic Portal Crawl Cycle",
        replace_existing=True,
    )

    # Legacy deadline check every 6 hours
    scheduler.add_job(
        scheduled_deadline_check,
        trigger=IntervalTrigger(hours=6, start_date=first_deadline),
        id="deadline_check",
        name="Deadline Reminder Check",
        replace_existing=True,
    )

    # Subscription-based deadline check every 6 hours (offset by 1 hour from legacy)
    scheduler.add_job(
        scheduled_subscription_deadline_check,
        trigger=IntervalTrigger(hours=6, start_date=first_deadline + timedelta(hours=1)),
        id="subscription_deadline_check",
        name="Subscription Deadline Notifications",
        replace_existing=True,
    )

    scheduler.start()
    logger.info(
        f"📅 Scheduler started — crawl every {settings.CRAWL_INTERVAL_MINUTES} min, "
        f"deadline checks every 6 hours (legacy + subscription-based)"
    )


def stop_scheduler():
    """Gracefully stop the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("📅 Scheduler stopped")
