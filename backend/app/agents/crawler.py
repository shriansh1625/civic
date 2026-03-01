"""
CivicLens AI — Autonomous Civic Crawler Agent
Periodically scans configurable Government of India portal URLs,
extracts text, detects changes, and stores structured data.
"""

import asyncio
import hashlib
import logging
from datetime import datetime
from typing import List, Optional

import httpx
from bs4 import BeautifulSoup
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session
from app.models.scheme import CrawlSource, Scheme, Update
from app.services.parser import DocumentParser
from app.services.ai_engine import summarize_document

logger = logging.getLogger("civiclens.crawler")


class CivicCrawlerAgent:
    """
    Autonomous crawler that:
    1. Reads active crawl sources from the database.
    2. Fetches each URL asynchronously using httpx.
    3. Extracts text content from HTML.
    4. Detects changes by comparing SHA-256 content hashes.
    5. Parses structured scheme data.
    6. Stores results in the database.
    """

    def __init__(self, max_concurrent: int = 8):
        self.max_concurrent = max_concurrent
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.parser = DocumentParser()
        self.headers = {
            "User-Agent": "CivicLensAI/1.0 (Government Scheme Aggregator; contact@civiclens.ai)"
        }

    async def run_crawl_cycle(self):
        """Execute one full crawl cycle across all active sources."""
        logger.info("🔄 Starting crawl cycle...")
        async with async_session() as db:
            result = await db.execute(
                select(CrawlSource).where(CrawlSource.is_active == True)
            )
            sources = result.scalars().all()

        if not sources:
            logger.info("No active crawl sources found. Seeding defaults...")
            await self._seed_default_sources()
            return

        tasks = [self._crawl_source(source) for source in sources]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        success = sum(1 for r in results if r is True)
        errors = sum(1 for r in results if isinstance(r, Exception))
        logger.info(f"✅ Crawl cycle complete: {success} success, {errors} errors out of {len(sources)} sources")

    async def _crawl_source(self, source: CrawlSource) -> bool:
        """Crawl a single source URL with concurrency limiting."""
        async with self.semaphore:
            try:
                logger.info(f"Crawling: {source.name} — {source.url}")
                async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
                    response = await client.get(source.url, headers=self.headers)
                    response.raise_for_status()

                html_content = response.text
                text_content = self._extract_text(html_content)
                content_hash = hashlib.sha256(text_content.encode()).hexdigest()

                # Update source status
                async with async_session() as db:
                    await db.execute(
                        update(CrawlSource)
                        .where(CrawlSource.id == source.id)
                        .values(
                            last_crawled_at=datetime.utcnow(),
                            last_status="success",
                        )
                    )
                    await db.commit()

                # Parse and store schemes from the content
                schemes_data = self.parser.parse_page(text_content, source.url, source.category)
                await self._store_schemes(schemes_data, content_hash, source)

                return True

            except Exception as e:
                logger.error(f"❌ Error crawling {source.name}: {e}")
                async with async_session() as db:
                    await db.execute(
                        update(CrawlSource)
                        .where(CrawlSource.id == source.id)
                        .values(
                            last_crawled_at=datetime.utcnow(),
                            last_status=f"error: {str(e)[:100]}",
                        )
                    )
                    await db.commit()
                return False

    def _extract_text(self, html: str) -> str:
        """Extract clean text from HTML content."""
        soup = BeautifulSoup(html, "lxml")
        # Remove script, style, and nav elements
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
        # Clean up excessive whitespace
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        return "\n".join(lines)

    async def _store_schemes(self, schemes_data: List[dict], content_hash: str, source: CrawlSource):
        """Store parsed scheme data, detecting new / changed entries."""
        async with async_session() as db:
            for data in schemes_data:
                # Check if scheme already exists by title
                result = await db.execute(
                    select(Scheme).where(Scheme.title == data.get("title", ""))
                )
                existing = result.scalar_one_or_none()

                if existing:
                    # Check for changes
                    new_hash = hashlib.sha256(data.get("description", "").encode()).hexdigest()
                    if existing.content_hash != new_hash:
                        # Content changed — update
                        for key, value in data.items():
                            if hasattr(existing, key) and value:
                                setattr(existing, key, value)
                        existing.content_hash = new_hash
                        existing.last_crawled_at = datetime.utcnow()
                        existing.ai_summary = summarize_document(data.get("description", ""))

                        # Create update record
                        update_record = Update(
                            scheme_id=existing.id,
                            title=f"Updated: {existing.title}",
                            content=data.get("description", "")[:500],
                            summary=existing.ai_summary,
                            source_url=source.url,
                            category=source.category,
                            change_type="modified",
                        )
                        db.add(update_record)
                        logger.info(f"📝 Updated scheme: {existing.title}")
                else:
                    # New scheme
                    desc = data.get("description", "")
                    scheme = Scheme(
                        title=data.get("title", "Unknown Scheme"),
                        ministry=data.get("ministry", ""),
                        department=data.get("department", ""),
                        category=data.get("category", source.category),
                        description=desc,
                        eligibility=data.get("eligibility", ""),
                        benefits=data.get("benefits", ""),
                        documents_required=data.get("documents_required", ""),
                        deadline=data.get("deadline", ""),
                        state=data.get("state", "All India"),
                        target_audience=data.get("target_audience", "citizen"),
                        budget_allocated=data.get("budget_allocated", 0.0),
                        source_url=source.url,
                        ai_summary=summarize_document(desc),
                        content_hash=hashlib.sha256(desc.encode()).hexdigest(),
                        last_crawled_at=datetime.utcnow(),
                    )
                    db.add(scheme)

                    update_record = Update(
                        title=f"New Scheme: {data.get('title', '')}",
                        content=desc[:500],
                        summary=scheme.ai_summary,
                        source_url=source.url,
                        category=source.category,
                        change_type="new",
                    )
                    db.add(update_record)
                    logger.info(f"✨ New scheme stored: {data.get('title')}")

            await db.commit()

    async def _seed_default_sources(self):
        """Seed the crawler with default Government of India portal URLs."""
        default_sources = [
            {
                "name": "MyScheme Portal",
                "url": "https://www.myscheme.gov.in/",
                "category": "welfare",
            },
            {
                "name": "India.gov.in Schemes",
                "url": "https://www.india.gov.in/my-government/schemes",
                "category": "general",
            },
            {
                "name": "PM India Schemes",
                "url": "https://www.pmindia.gov.in/en/major_initiatives/",
                "category": "flagship",
            },
            {
                "name": "GeM Portal",
                "url": "https://gem.gov.in/",
                "category": "business",
            },
            {
                "name": "Startup India",
                "url": "https://www.startupindia.gov.in/",
                "category": "startup",
            },
            {
                "name": "Digital India",
                "url": "https://www.digitalindia.gov.in/",
                "category": "technology",
            },
            {
                "name": "MSME Schemes",
                "url": "https://msme.gov.in/",
                "category": "msme",
            },
            {
                "name": "Agriculture Ministry",
                "url": "https://agricoop.nic.in/",
                "category": "agriculture",
            },
        ]

        async with async_session() as db:
            for src in default_sources:
                source = CrawlSource(**src)
                db.add(source)
            await db.commit()
            logger.info(f"🌱 Seeded {len(default_sources)} default crawl sources")


# Singleton agent instance
crawler_agent = CivicCrawlerAgent()
