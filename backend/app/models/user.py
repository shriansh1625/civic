"""
CivicLens AI — User Model
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    user_type = Column(String(50), nullable=False, default="citizen")  # student, msme, startup, farmer, ngo, citizen
    state = Column(String(100), default="All India")
    district = Column(String(100), default="")
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    preferences = relationship("UserPreference", back_populates="user", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="user", cascade="all, delete-orphan")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    category = Column(String(100), nullable=False)  # education, agriculture, health, business, etc.
    keywords = Column(Text, default="")  # comma-separated keywords
    notify_email = Column(Boolean, default=True)
    notify_in_app = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="preferences",
                        foreign_keys=[user_id],
                        primaryjoin="UserPreference.user_id == User.id")

    from sqlalchemy import ForeignKey
    __table_args__ = (
        # Ensure user_id references users.id
    )

# Fix the foreign key after table definition
from sqlalchemy import ForeignKey
UserPreference.__table__.c.user_id.append_foreign_key(ForeignKey("users.id"))
