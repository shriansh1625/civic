"""
CivicLens AI — Scheme Subscription & Notification Models
Feature 2: Smart Scheme Tracking + Push Notifications
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class SchemeSubscription(Base):
    """Tracks which schemes a user has subscribed to for updates."""
    __tablename__ = "scheme_subscriptions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="subscriptions")
    scheme = relationship("Scheme", backref="subscribers")


class Notification(Base):
    """In-app notifications for tracked scheme events."""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    scheme_id = Column(Integer, nullable=True)
    title = Column(String(500), nullable=False)
    message = Column(Text, default="")
    notification_type = Column(String(50), default="info")  # deadline, update, extension, system
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="notifications")


class PushSubscription(Base):
    """Stores Web Push subscription info per user/browser."""
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    endpoint = Column(Text, nullable=False)
    p256dh_key = Column(Text, nullable=False)
    auth_key = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="push_subscriptions")
