"""
CivicLens AI — AI Summarization & Q&A Engine (v2 — DB-connected)
Dynamically queries scheme data, detects categories/states from
user questions, and returns structured card + text responses.
"""

import re
import logging
from typing import List, Dict, Optional

logger = logging.getLogger("civiclens.ai_engine")

# ────────────────────────────────────────────────────────────────
# CATEGORY / STATE / INTENT DETECTION
# ────────────────────────────────────────────────────────────────

CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "agriculture": ["farm", "farmer", "agriculture", "crop", "kisan", "agri", "soil", "irrigation", "mandi", "fasal", "bima", "drone"],
    "education": ["student", "scholarship", "education", "college", "university", "school", "study", "phd", "fellowship", "pmrf", "inspire", "nsp", "vidyalaxmi"],
    "health": ["health", "hospital", "medicine", "ayushman", "doctor", "treatment", "immunization", "abha", "insurance", "aushadhi"],
    "startup": ["startup", "innovation", "incubator", "seed fund", "atal", "dpiit", "venture", "atal innovation"],
    "business": ["msme", "loan", "mudra", "enterprise", "business", "udyam", "cgtmse", "champions"],
    "welfare": ["welfare", "pension", "housing", "vishwakarma", "artisan", "solar", "surya", "nrega", "mgnrega"],
    "technology": ["digital", "technology", "semiconductor", "broadband", "bharatnet", "internet", "it", "meity"],
    "employment": ["job", "employment", "skill", "apprentice", "internship", "training", "pmkvy"],
    "housing": ["housing", "awas", "home", "house", "pmay", "urban", "gramin", "construction"],
}

STATES = [
    "andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh",
    "goa", "gujarat", "haryana", "himachal pradesh", "jharkhand", "karnataka",
    "kerala", "madhya pradesh", "maharashtra", "manipur", "meghalaya", "mizoram",
    "nagaland", "odisha", "punjab", "rajasthan", "sikkim", "tamil nadu",
    "telangana", "tripura", "uttar pradesh", "uttarakhand", "west bengal",
    "delhi", "jammu", "kashmir", "ladakh", "north east",
]


def detect_categories(text: str) -> List[str]:
    """Detect which scheme categories a question relates to."""
    t = text.lower()
    cats = []
    for cat, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in t for kw in keywords):
            cats.append(cat)
    return cats


def detect_state(text: str) -> Optional[str]:
    """Detect an Indian state mentioned in the query."""
    t = text.lower()
    for s in STATES:
        if s in t:
            return s.title()
    return None


INTENT_PATTERNS = {
    "eligibility": ["eligible", "eligibility", "who can", "qualification", "criteria", "am i eligible"],
    "application": ["how to apply", "application", "registration", "register", "apply", "process"],
    "deadline": ["deadline", "last date", "when", "due date", "expires", "expiry"],
    "budget": ["budget", "allocation", "funds", "crore", "how much", "amount", "financial"],
    "benefits": ["benefits", "what do i get", "advantage", "perks", "how much money"],
    "documents": ["documents", "papers", "required documents", "what documents", "proof"],
    "compare": ["compare", "difference", "vs", "versus", "which is better"],
    "list": ["list", "all schemes", "show me", "what schemes", "available", "tell me about schemes"],
}


def detect_intent(text: str) -> str:
    """Detect question intent / type."""
    t = text.lower()
    for intent, keywords in INTENT_PATTERNS.items():
        if any(kw in t for kw in keywords):
            return intent
    return "general"


# ────────────────────────────────────────────────────────────────
# SUMMARIZATION
# ────────────────────────────────────────────────────────────────

def summarize_document(text: str, max_length: int = 300) -> str:
    """
    Generate a concise summary of a government document/scheme.
    Uses extractive summarization (production: AMD EPYC-hosted LLM).
    """
    if not text or len(text) < 20:
        return "No content available for summarization."

    text = re.sub(r'\s+', ' ', text).strip()
    sentences = re.split(r'(?<=[.!?])\s+', text)
    if not sentences:
        return text[:max_length]

    important_keywords = [
        "scheme", "benefit", "eligible", "apply", "subsidy", "grant",
        "deadline", "objective", "aim", "provide", "support", "assistance",
        "crore", "lakh", "percent", "government", "ministry", "launched",
        "initiative", "programme", "mission", "yojana",
    ]

    scored = []
    for i, sentence in enumerate(sentences):
        score = sum(2 for kw in important_keywords if kw in sentence.lower())
        score += max(0, 5 - i)
        words = len(sentence.split())
        if 8 < words < 40:
            score += 2
        scored.append((score, i, sentence))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_sentences = sorted(scored[:4], key=lambda x: x[1])
    summary = " ".join(s[2] for s in top_sentences)
    if len(summary) > max_length:
        summary = summary[:max_length - 3] + "..."
    return summary


def generate_user_relevant_summary(user_profile: dict, document: dict) -> str:
    """Personalized summary highlighting aspects relevant to user."""
    user_type = user_profile.get("user_type", "citizen")
    state = user_profile.get("state", "All India")
    base_summary = document.get("ai_summary") or summarize_document(document.get("description", ""))

    relevance_notes = []
    audience = document.get("target_audience", "citizen")
    if audience == user_type or audience == "citizen":
        relevance_notes.append(f"Directly relevant to you as a {user_type}.")

    doc_state = document.get("state", "All India")
    if doc_state == "All India" or state in str(doc_state):
        relevance_notes.append(f"Available in {state}.")

    deadline = document.get("deadline", "")
    if deadline and deadline != "Ongoing":
        relevance_notes.append(f"Deadline: {deadline} — apply soon!")

    budget = document.get("budget_allocated", 0)
    if budget and budget > 5000:
        relevance_notes.append(f"Large-scale scheme (₹{budget:,.0f} Cr budget).")

    if relevance_notes:
        return base_summary + "\n\n📌 " + " ".join(relevance_notes)
    return base_summary


# ────────────────────────────────────────────────────────────────
# SCHEME CARD BUILDER
# ────────────────────────────────────────────────────────────────

def build_scheme_card(scheme: dict, relevance_tag: str = "") -> dict:
    """Build a structured scheme card dict for chat responses."""
    return {
        "id": scheme.get("id", 0),
        "title": scheme.get("title", ""),
        "ministry": scheme.get("ministry", ""),
        "category": scheme.get("category", ""),
        "eligibility": (scheme.get("eligibility") or "")[:200],
        "benefits": (scheme.get("benefits") or "")[:200],
        "budget_cr": scheme.get("budget_allocated", 0),
        "deadline": scheme.get("deadline", ""),
        "source_url": scheme.get("source_url", ""),
        "relevance_tag": relevance_tag,
    }


# ────────────────────────────────────────────────────────────────
# CONVERSATIONAL Q&A ENGINE
# ────────────────────────────────────────────────────────────────

class CivicQAEngine:
    """
    Conversational Q&A engine that dynamically searches DB-provided
    scheme data to answer civic intelligence queries.
    """

    def answer_question(
        self,
        question: str,
        context: Optional[str] = None,
        schemes: Optional[List[dict]] = None,
    ) -> Dict:
        q_lower = question.lower().strip()
        intent = detect_intent(q_lower)
        categories = detect_categories(q_lower)
        state = detect_state(q_lower)
        schemes = schemes or []

        # ── Filter schemes by detected category/state ─────────
        relevant = self._smart_search(q_lower, schemes, categories, state)

        # ── Respond by intent ─────────────────────────────────
        if intent == "eligibility" and relevant:
            return self._eligibility_response(q_lower, relevant)
        if intent == "application" and relevant:
            return self._application_response(q_lower, relevant)
        if intent == "deadline":
            return self._deadline_response(q_lower, relevant, schemes)
        if intent == "budget":
            return self._budget_response(q_lower, relevant, schemes)
        if intent == "benefits" and relevant:
            return self._benefits_response(q_lower, relevant)
        if intent == "documents" and relevant:
            return self._documents_response(q_lower, relevant)
        if intent == "compare" and len(relevant) >= 2:
            return self._compare_response(relevant[:2])
        if intent == "list" or (categories and not relevant):
            # Show schemes for the detected category
            cat_schemes = [s for s in schemes if s.get("category") in categories] if categories else schemes[:8]
            return self._list_response(cat_schemes or schemes[:8], categories)

        # ── General keyword search ────────────────────────────
        if relevant:
            return self._general_response(q_lower, relevant)

        # ── Fallback ──────────────────────────────────────────
        return self._fallback_response(schemes)

    # ── Smart search ──────────────────────────────────────────

    def _smart_search(
        self, query: str, schemes: List[dict],
        categories: List[str], state: Optional[str],
    ) -> List[dict]:
        """Score and rank schemes by relevance to query."""
        words = set(w for w in query.split() if len(w) >= 3)
        scored = []
        for s in schemes:
            score = 0
            title_l = s.get("title", "").lower()
            desc_l = s.get("description", "").lower()
            cat = s.get("category", "")
            summary_l = s.get("ai_summary", "").lower()

            # Direct title match is strongest
            for w in words:
                if w in title_l:
                    score += 8
                if w in summary_l:
                    score += 3
                if w in desc_l:
                    score += 2

            # Category match
            if cat in categories:
                score += 6

            # State match
            s_state = s.get("state", "All India")
            if state and (state.lower() in s_state.lower() or s_state == "All India"):
                score += 3

            if score > 0:
                scored.append((score, s))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored]

    # ── Intent-specific response generators ───────────────────

    def _eligibility_response(self, query: str, relevant: List[dict]) -> Dict:
        top = relevant[:3]
        answer = "Here are the eligibility details for the most relevant schemes:\n\n"
        cards = []
        for i, s in enumerate(top, 1):
            answer += f"**{i}. {s['title']}**\n"
            answer += f"   📋 {s.get('eligibility', 'Check official portal')}\n\n"
            cards.append(build_scheme_card(s, "Eligibility Match"))
        return {
            "answer": answer,
            "sources": [s.get("source_url", "") for s in top],
            "confidence": 0.90,
            "scheme_cards": cards,
            "suggested_actions": ["How to apply?", "What documents do I need?", "Show me deadlines"],
        }

    def _application_response(self, query: str, relevant: List[dict]) -> Dict:
        top = relevant[0]
        steps = (
            f"To apply for **{top['title']}**:\n\n"
            f"1. Visit the official portal: {top.get('source_url', 'myscheme.gov.in')}\n"
            f"2. Check eligibility: {(top.get('eligibility') or '')[:150]}\n"
            f"3. Gather documents: {top.get('documents_required', 'Aadhaar, Bank Account')}\n"
            f"4. Fill the online application form\n"
            f"5. Submit and note your reference number\n\n"
            f"💡 You can also visit your nearest Common Service Centre (CSC) for assistance."
        )
        return {
            "answer": steps,
            "sources": [top.get("source_url", "")],
            "confidence": 0.88,
            "scheme_cards": [build_scheme_card(top, "Application Guide")],
            "suggested_actions": ["Am I eligible?", "What are the benefits?", "Show deadline"],
        }

    def _deadline_response(self, query: str, relevant: List[dict], all_schemes: List[dict]) -> Dict:
        # Gather schemes with non-ongoing deadlines
        deadline_schemes = [s for s in (relevant or all_schemes) if s.get("deadline") and s["deadline"] != "Ongoing"]
        ongoing = [s for s in (relevant or all_schemes) if s.get("deadline") == "Ongoing"]

        answer = "**Upcoming Deadlines:**\n\n"
        cards = []
        if deadline_schemes:
            for s in deadline_schemes[:5]:
                answer += f"⏰ **{s['title']}** — Deadline: **{s['deadline']}**\n"
                cards.append(build_scheme_card(s, "⏰ Deadline"))
            answer += "\n"
        if ongoing[:3]:
            answer += "**Ongoing (No Deadline):**\n"
            for s in ongoing[:3]:
                answer += f"✅ {s['title']} — Apply anytime\n"
        if not deadline_schemes and not ongoing:
            answer = "I don't have specific deadline information for that query. Check MyScheme.gov.in for latest dates."
        return {
            "answer": answer,
            "sources": [s.get("source_url", "") for s in deadline_schemes[:3]],
            "confidence": 0.85,
            "scheme_cards": cards,
            "suggested_actions": ["Show all schemes", "Am I eligible?", "How to apply?"],
        }

    def _budget_response(self, query: str, relevant: List[dict], all_schemes: List[dict]) -> Dict:
        target = relevant or all_schemes
        target = [s for s in target if s.get("budget_allocated", 0) > 0]
        target.sort(key=lambda s: s.get("budget_allocated", 0), reverse=True)
        top = target[:5]

        total = sum(s.get("budget_allocated", 0) for s in target)
        answer = f"**Budget Overview** (₹{total:,.0f} Cr across {len(target)} schemes):\n\n"
        cards = []
        for s in top:
            b = s.get("budget_allocated", 0)
            answer += f"💰 **{s['title']}** — ₹{b:,.0f} Crore\n"
            cards.append(build_scheme_card(s, f"₹{b:,.0f} Cr"))
        return {
            "answer": answer,
            "sources": ["https://www.indiabudget.gov.in/"],
            "confidence": 0.87,
            "scheme_cards": cards,
            "suggested_actions": ["Show top schemes", "Which has highest budget?", "Show all categories"],
        }

    def _benefits_response(self, query: str, relevant: List[dict]) -> Dict:
        top = relevant[:3]
        answer = "Here are the key benefits:\n\n"
        cards = []
        for s in top:
            answer += f"🎁 **{s['title']}**\n   {s.get('benefits', 'Visit official portal')}\n\n"
            cards.append(build_scheme_card(s, "Benefits"))
        return {
            "answer": answer,
            "sources": [s.get("source_url", "") for s in top],
            "confidence": 0.88,
            "scheme_cards": cards,
            "suggested_actions": ["Am I eligible?", "How to apply?", "What documents needed?"],
        }

    def _documents_response(self, query: str, relevant: List[dict]) -> Dict:
        top = relevant[:3]
        answer = "**Required Documents:**\n\n"
        cards = []
        for s in top:
            answer += f"📄 **{s['title']}**\n   {s.get('documents_required', 'Aadhaar, Bank Account')}\n\n"
            cards.append(build_scheme_card(s, "Documents"))
        return {
            "answer": answer,
            "sources": [s.get("source_url", "") for s in top],
            "confidence": 0.86,
            "scheme_cards": cards,
            "suggested_actions": ["How to apply?", "Check eligibility", "Show benefits"],
        }

    def _compare_response(self, two: List[dict]) -> Dict:
        a, b = two[0], two[1]
        answer = f"**Comparing: {a['title']} vs {b['title']}**\n\n"
        answer += f"| Feature | {a['title'][:25]} | {b['title'][:25]} |\n"
        answer += f"|---------|{'---' * 8}|{'---' * 8}|\n"
        answer += f"| Ministry | {a.get('ministry','-')} | {b.get('ministry','-')} |\n"
        answer += f"| Budget | ₹{a.get('budget_allocated',0):,.0f} Cr | ₹{b.get('budget_allocated',0):,.0f} Cr |\n"
        answer += f"| Deadline | {a.get('deadline','-')} | {b.get('deadline','-')} |\n"
        answer += f"| Target | {a.get('target_audience','-')} | {b.get('target_audience','-')} |\n"
        return {
            "answer": answer,
            "sources": [a.get("source_url", ""), b.get("source_url", "")],
            "confidence": 0.84,
            "scheme_cards": [build_scheme_card(a, "Option A"), build_scheme_card(b, "Option B")],
            "suggested_actions": ["Which has better benefits?", "Show eligibility for both"],
        }

    def _list_response(self, schemes: List[dict], categories: List[str]) -> Dict:
        cat_str = ", ".join(categories) if categories else "all categories"
        answer = f"**Schemes in {cat_str}** ({len(schemes)} found):\n\n"
        cards = []
        for i, s in enumerate(schemes[:6], 1):
            budget = s.get("budget_allocated", 0)
            tag = f"₹{budget:,.0f} Cr" if budget else s.get("category", "")
            answer += f"{i}. **{s['title']}** — {s.get('ai_summary', '')[:100]}\n"
            cards.append(build_scheme_card(s, tag))
        if len(schemes) > 6:
            answer += f"\n...and {len(schemes) - 6} more. Use the Scheme Explorer for full list."
        return {
            "answer": answer,
            "sources": [s.get("source_url", "") for s in schemes[:3]],
            "confidence": 0.90,
            "scheme_cards": cards,
            "suggested_actions": ["Show eligibility", "Which has highest budget?", "Show deadlines"],
        }

    def _general_response(self, query: str, relevant: List[dict]) -> Dict:
        top = relevant[:3]
        answer = "Based on your question, here are the most relevant schemes:\n\n"
        cards = []
        for i, s in enumerate(top, 1):
            answer += f"**{i}. {s.get('title', '')}**\n"
            answer += f"   {s.get('ai_summary', s.get('description', '')[:200])}\n\n"
            cards.append(build_scheme_card(s, "Relevant"))
        return {
            "answer": answer,
            "sources": [s.get("source_url", "") for s in top],
            "confidence": 0.85,
            "scheme_cards": cards,
            "suggested_actions": ["Tell me more about #1", "Check eligibility", "How to apply?"],
        }

    def _fallback_response(self, schemes: List[dict]) -> Dict:
        total = len(schemes)
        answer = (
            f"I have information on **{total} government schemes** across agriculture, education, health, "
            f"startups, MSME, housing, welfare, and more.\n\n"
            "Try asking:\n"
            "• \"What schemes are available for farmers?\"\n"
            "• \"Am I eligible for startup funding?\"\n"
            "• \"Show me education scholarships\"\n"
            "• \"What are the deadlines for student schemes?\"\n"
            "• \"Compare MUDRA vs CGTMSE\"\n"
            "• \"How to apply for PM-KISAN?\"\n\n"
            "You can also ask about specific schemes by name."
        )
        return {
            "answer": answer,
            "sources": [],
            "confidence": 0.60,
            "scheme_cards": [],
            "suggested_actions": ["Show all schemes", "Schemes for students", "Schemes for farmers", "Startup funding options"],
        }


# Singleton instance
qa_engine = CivicQAEngine()
