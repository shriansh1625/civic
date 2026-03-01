"""
CivicLens AI — AI Chat & Q&A API Routes (v2 — structured responses)
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.scheme import Scheme
from app.services.ai_engine import qa_engine, summarize_document
from app.schemas.models import ChatRequest, ChatResponse

router = APIRouter(prefix="/api", tags=["AI Chat"])


@router.post("/ask", response_model=ChatResponse)
async def ask_question(
    data: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Conversational Q&A endpoint.
    Returns structured answer + scheme cards + suggested actions.
    """
    # Fetch ALL active schemes for context
    result = await db.execute(
        select(Scheme).where(Scheme.is_active == True)
    )
    schemes = result.scalars().all()
    scheme_dicts = [
        {
            "id": s.id,
            "title": s.title, "description": s.description,
            "category": s.category, "ai_summary": s.ai_summary,
            "source_url": s.source_url, "eligibility": s.eligibility,
            "benefits": s.benefits, "deadline": s.deadline,
            "documents_required": s.documents_required,
            "ministry": s.ministry, "state": s.state,
            "target_audience": s.target_audience,
            "budget_allocated": s.budget_allocated or 0,
        }
        for s in schemes
    ] if schemes else []

    response = qa_engine.answer_question(
        question=data.question,
        context=data.context,
        schemes=scheme_dicts,
    )

    return ChatResponse(**response)


@router.post("/summarize")
async def summarize_text(data: dict):
    """Summarize a given text block."""
    text = data.get("text", "")
    if not text:
        return {"summary": "No text provided."}
    return {"summary": summarize_document(text)}
