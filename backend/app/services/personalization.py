"""
CivicLens AI — Personalization Engine (v2)
Filters, ranks, and delivers user-relevant civic intelligence.
Enhanced with deadline urgency, budget impact, and freshness signals.
"""

import logging
import re
from typing import List, Dict, Optional
from datetime import datetime, timedelta

from sqlalchemy import select, func, desc, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scheme import Scheme
from app.models.user import User, UserPreference
from app.services.ai_engine import generate_user_relevant_summary

logger = logging.getLogger("civiclens.personalization")


# ── Deadline parsing helper ──────────────────────────────────

_MONTH_MAP = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
    "january": 1, "february": 2, "march": 3, "april": 4,
    "june": 6, "july": 7, "august": 8, "september": 9,
    "october": 10, "november": 11, "december": 12,
}


def _parse_deadline(deadline_str: str) -> Optional[datetime]:
    """Best-effort parse of deadline strings like '31-March-2026', '15-Oct-2025', etc."""
    if not deadline_str or deadline_str.lower() in ("ongoing", "continuous", "open", "n/a", ""):
        return None
    try:
        parts = re.split(r"[-/\s]+", deadline_str.strip())
        if len(parts) >= 3:
            day = int(parts[0])
            month = _MONTH_MAP.get(parts[1].lower(), None) or int(parts[1])
            year = int(parts[2])
            return datetime(year, month, day)
    except (ValueError, KeyError):
        pass
    return None


class PersonalizationEngine:
    """
    Personalizes scheme feeds based on user profiles:
    - Filters by user_type, state, and category preferences
    - Ranks by multi-factor relevance score
    - Deadline urgency weighting
    - Budget impact weighting
    - Freshness / newly-added boost
    - Creates "What's Relevant Today" feeds
    """

    # Mapping user types to relevant categories
    USER_TYPE_CATEGORIES = {
        "student": ["education", "technology", "employment", "welfare"],
        "farmer": ["agriculture", "welfare", "infrastructure", "health"],
        "msme": ["business", "technology", "employment", "infrastructure"],
        "startup": ["startup", "business", "technology", "employment"],
        "ngo": ["welfare", "health", "education", "infrastructure"],
        "citizen": ["welfare", "health", "education", "infrastructure", "technology"],
    }

    # Relevance weights (v2 — expanded)
    WEIGHT_TYPE_MATCH = 10
    WEIGHT_CATEGORY_MATCH = 8
    WEIGHT_STATE_MATCH = 6
    WEIGHT_KEYWORD_MATCH = 4
    WEIGHT_RECENCY = 3
    WEIGHT_DEADLINE_URGENCY = 7   # new
    WEIGHT_BUDGET_IMPACT = 4      # new
    WEIGHT_NEWLY_ADDED = 5        # new — added in last 24h

    async def get_personalized_feed(
        self,
        db: AsyncSession,
        user: User,
        limit: int = 20,
    ) -> List[Dict]:
        """Generate a personalized scheme feed for the user."""

        # Fetch user preferences
        pref_result = await db.execute(
            select(UserPreference).where(UserPreference.user_id == user.id)
        )
        preferences = pref_result.scalars().all()

        # Fetch active schemes
        scheme_result = await db.execute(
            select(Scheme).where(Scheme.is_active == True).order_by(desc(Scheme.created_at)).limit(200)
        )
        all_schemes = scheme_result.scalars().all()

        # Score and rank
        scored_schemes = []
        for scheme in all_schemes:
            score = self._calculate_relevance(scheme, user, preferences)
            scheme_dict = self._scheme_to_dict(scheme)
            scheme_dict["relevance_score"] = round(score, 1)

            # Deadline tag
            dl = _parse_deadline(scheme.deadline or "")
            if dl:
                days_left = (dl - datetime.utcnow()).days
                if days_left < 0:
                    scheme_dict["deadline_tag"] = "expired"
                elif days_left <= 7:
                    scheme_dict["deadline_tag"] = "critical"
                elif days_left <= 30:
                    scheme_dict["deadline_tag"] = "approaching"
                else:
                    scheme_dict["deadline_tag"] = "open"
                scheme_dict["days_until_deadline"] = max(days_left, 0)
            else:
                scheme_dict["deadline_tag"] = "ongoing"
                scheme_dict["days_until_deadline"] = None

            # Freshness flag
            if scheme.created_at and (datetime.utcnow() - scheme.created_at).total_seconds() < 86400:
                scheme_dict["is_newly_added"] = True
            else:
                scheme_dict["is_newly_added"] = False

            # Budget tier
            budget = scheme.budget_allocated or 0
            if budget >= 50000:
                scheme_dict["budget_tier"] = "mega"
            elif budget >= 10000:
                scheme_dict["budget_tier"] = "large"
            elif budget >= 1000:
                scheme_dict["budget_tier"] = "medium"
            else:
                scheme_dict["budget_tier"] = "small"

            scheme_dict["personalized_summary"] = generate_user_relevant_summary(
                {"user_type": user.user_type, "state": user.state},
                scheme_dict,
            )
            scored_schemes.append((score, scheme_dict))

        scored_schemes.sort(key=lambda x: x[0], reverse=True)
        return [s[1] for s in scored_schemes[:limit]]

    async def get_whats_relevant_today(
        self,
        db: AsyncSession,
        user: User,
    ) -> Dict:
        """Generate the 'What's Relevant Today' dashboard section."""
        feed = await self.get_personalized_feed(db, user, limit=15)

        new_schemes = [s for s in feed if s.get("is_newly_added")]
        deadline_soon = [s for s in feed if s.get("deadline_tag") in ("critical", "approaching")]
        high_relevance = [s for s in feed if s.get("relevance_score", 0) >= 15]

        # If not enough in any bucket, extend from remainder
        if not new_schemes:
            new_schemes = [s for s in feed if s.get("created_at") and
                           (datetime.utcnow() - datetime.fromisoformat(str(s["created_at"]))).days <= 7]

        return {
            "new_schemes": new_schemes[:5],
            "deadline_approaching": deadline_soon[:5],
            "top_relevant": high_relevance[:5],
            "total_relevant": len(feed),
            "last_updated": datetime.utcnow().isoformat(),
        }

    async def get_schemes_by_filter(
        self,
        db: AsyncSession,
        category: Optional[str] = None,
        state: Optional[str] = None,
        target_audience: Optional[str] = None,
        search_query: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict:
        """Filter schemes by category, state, audience, and search query with pagination."""
        query = select(Scheme).where(Scheme.is_active == True)

        if category and category != "all":
            query = query.where(Scheme.category == category)
        if state and state != "All India":
            query = query.where(
                or_(Scheme.state == "All India", Scheme.state.contains(state))
            )
        if target_audience and target_audience != "all":
            query = query.where(
                or_(Scheme.target_audience == target_audience, Scheme.target_audience == "citizen")
            )
        if search_query:
            search_term = f"%{search_query}%"
            query = query.where(
                or_(
                    Scheme.title.ilike(search_term),
                    Scheme.description.ilike(search_term),
                    Scheme.ministry.ilike(search_term),
                    Scheme.eligibility.ilike(search_term),
                )
            )

        # Efficient count
        count_query = select(func.count()).select_from(query.subquery())
        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0

        # Paginate
        query = query.order_by(desc(Scheme.created_at)).offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(query)
        schemes = result.scalars().all()

        return {
            "schemes": [self._scheme_to_dict(s) for s in schemes],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, (total + page_size - 1) // page_size),
        }

    def _calculate_relevance(self, scheme: Scheme, user: User, preferences: List[UserPreference]) -> float:
        """Calculate multi-factor relevance score for a scheme given a user profile."""
        score = 0.0

        # ── Target audience match ────────────────────────────
        if scheme.target_audience == user.user_type:
            score += self.WEIGHT_TYPE_MATCH
        elif scheme.target_audience == "citizen":
            score += self.WEIGHT_TYPE_MATCH * 0.5

        # ── Category match ───────────────────────────────────
        relevant_categories = self.USER_TYPE_CATEGORIES.get(user.user_type, [])
        if scheme.category in relevant_categories:
            score += self.WEIGHT_CATEGORY_MATCH

        # ── State match ──────────────────────────────────────
        if scheme.state == "All India":
            score += self.WEIGHT_STATE_MATCH
        elif user.state and user.state.lower() in (scheme.state or "").lower():
            score += self.WEIGHT_STATE_MATCH * 1.2  # exact state match gets bonus

        # ── Keyword match from preferences ───────────────────
        for pref in preferences:
            if pref.category == scheme.category:
                score += self.WEIGHT_KEYWORD_MATCH
            keywords = [kw.strip().lower() for kw in pref.keywords.split(",") if kw.strip()]
            for kw in keywords:
                if kw in scheme.title.lower() or kw in (scheme.description or "").lower():
                    score += 2

        # ── Recency boost ────────────────────────────────────
        if scheme.created_at:
            days_old = (datetime.utcnow() - scheme.created_at).days
            if days_old <= 1:
                score += self.WEIGHT_RECENCY * 3
            elif days_old <= 7:
                score += self.WEIGHT_RECENCY * 2
            elif days_old <= 30:
                score += self.WEIGHT_RECENCY

        # ── NEW: Newly-added boost (< 24h) ───────────────────
        if scheme.created_at and (datetime.utcnow() - scheme.created_at).total_seconds() < 86400:
            score += self.WEIGHT_NEWLY_ADDED

        # ── NEW: Deadline urgency ────────────────────────────
        dl = _parse_deadline(scheme.deadline or "")
        if dl:
            days_left = (dl - datetime.utcnow()).days
            if 0 < days_left <= 7:
                score += self.WEIGHT_DEADLINE_URGENCY * 2   # critical
            elif 7 < days_left <= 30:
                score += self.WEIGHT_DEADLINE_URGENCY       # approaching
            elif 30 < days_left <= 90:
                score += self.WEIGHT_DEADLINE_URGENCY * 0.3

        # ── NEW: Budget impact ───────────────────────────────
        budget = scheme.budget_allocated or 0
        if budget >= 50000:
            score += self.WEIGHT_BUDGET_IMPACT * 1.5   # mega schemes
        elif budget >= 10000:
            score += self.WEIGHT_BUDGET_IMPACT
        elif budget >= 1000:
            score += self.WEIGHT_BUDGET_IMPACT * 0.5

        return score

    def _scheme_to_dict(self, scheme: Scheme) -> Dict:
        """Convert a Scheme ORM object to a dictionary."""
        return {
            "id": scheme.id,
            "title": scheme.title,
            "ministry": scheme.ministry,
            "department": scheme.department,
            "category": scheme.category,
            "description": scheme.description,
            "eligibility": scheme.eligibility,
            "benefits": scheme.benefits,
            "documents_required": scheme.documents_required,
            "deadline": scheme.deadline,
            "state": scheme.state,
            "target_audience": scheme.target_audience,
            "budget_allocated": scheme.budget_allocated,
            "source_url": scheme.source_url,
            "ai_summary": scheme.ai_summary,
            "is_active": scheme.is_active,
            "published_date": str(scheme.published_date) if scheme.published_date else None,
            "created_at": str(scheme.created_at) if scheme.created_at else None,
        }


# Singleton instance
personalization_engine = PersonalizationEngine()
