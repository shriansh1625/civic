"""
CivicLens AI — Document Parser & Structuring Module
Extracts structured scheme data from raw text content.
"""

import re
import logging
from typing import List, Dict

logger = logging.getLogger("civiclens.parser")


class DocumentParser:
    """
    Parses raw text content from government portal pages and
    extracts structured scheme information including:
    - Scheme name, Ministry, Eligibility, Benefits,
      Deadlines, Required documents
    """

    # Common ministry names for identification
    MINISTRIES = [
        "Ministry of Finance", "Ministry of Agriculture", "Ministry of Education",
        "Ministry of Health", "Ministry of Commerce", "Ministry of MSME",
        "Ministry of Electronics", "Ministry of Rural Development",
        "Ministry of Housing", "Ministry of Women and Child Development",
        "Ministry of Social Justice", "Ministry of Labour",
        "Ministry of Science and Technology", "Ministry of Skill Development",
        "NITI Aayog", "Ministry of Home Affairs", "Ministry of Defence",
        "Ministry of External Affairs", "Ministry of Environment",
    ]

    # Category keywords
    CATEGORY_KEYWORDS = {
        "education": ["scholarship", "education", "student", "university", "school", "college", "learning"],
        "agriculture": ["farmer", "agriculture", "crop", "kisan", "farming", "irrigation", "soil"],
        "health": ["health", "hospital", "medical", "ayushman", "insurance", "swasthya"],
        "business": ["msme", "enterprise", "business", "industry", "manufacturing", "trade", "export"],
        "startup": ["startup", "innovation", "entrepreneur", "incubat", "accelerat"],
        "welfare": ["welfare", "pension", "widow", "disability", "senior citizen", "bpl"],
        "housing": ["housing", "awas", "home", "shelter", "pradhan mantri awas"],
        "infrastructure": ["infrastructure", "road", "highway", "bridge", "smart city"],
        "technology": ["digital", "technology", "ict", "internet", "broadband", "cyber"],
        "employment": ["employment", "job", "skill", "training", "rozgar", "placement"],
    }

    # Target audience keywords
    AUDIENCE_KEYWORDS = {
        "student": ["student", "scholar", "youth", "education", "college"],
        "farmer": ["farmer", "kisan", "agriculture", "rural", "crop"],
        "msme": ["msme", "sme", "enterprise", "small business", "micro"],
        "startup": ["startup", "founder", "entrepreneur", "innovation"],
        "ngo": ["ngo", "non-profit", "society", "civil society", "voluntary"],
        "citizen": ["citizen", "general public", "all", "everyone", "people"],
    }

    def parse_page(self, text: str, source_url: str, default_category: str = "general") -> List[Dict]:
        """
        Parse a page of text content and extract structured scheme data.
        Returns a list of scheme dictionaries.
        """
        if not text or len(text) < 50:
            return []

        schemes = []
        # Try to split into individual scheme blocks
        blocks = self._split_into_blocks(text)

        for block in blocks:
            scheme = self._extract_scheme_data(block, source_url, default_category)
            if scheme and scheme.get("title"):
                schemes.append(scheme)

        # If no blocks were parsed, treat the whole text as one scheme
        if not schemes and len(text) > 100:
            scheme = self._extract_scheme_data(text, source_url, default_category)
            if scheme and scheme.get("title"):
                schemes.append(scheme)

        logger.info(f"Parsed {len(schemes)} schemes from {source_url}")
        return schemes

    def _split_into_blocks(self, text: str) -> List[str]:
        """Split text into logical blocks that might represent individual schemes."""
        # Split by common delimiters
        patterns = [
            r'\n(?=(?:Scheme|Programme|Yojana|Mission|Abhiyan|Initiative)\s*[:\-\—])',
            r'\n(?=\d+[\.\)]\s+[A-Z])',  # Numbered items
            r'\n{3,}',  # Multiple newlines
        ]

        blocks = [text]
        for pattern in patterns:
            new_blocks = []
            for block in blocks:
                parts = re.split(pattern, block)
                new_blocks.extend([p.strip() for p in parts if p.strip() and len(p.strip()) > 50])
            if len(new_blocks) > len(blocks):
                blocks = new_blocks
                break

        return blocks[:50]  # Limit to prevent excessive processing

    def _extract_scheme_data(self, text: str, source_url: str, default_category: str) -> Dict:
        """Extract structured data from a text block."""
        title = self._extract_title(text)
        if not title:
            return {}

        return {
            "title": title,
            "ministry": self._extract_ministry(text),
            "department": self._extract_department(text),
            "category": self._detect_category(text, default_category),
            "description": text[:2000],
            "eligibility": self._extract_section(text, ["eligibility", "eligible", "who can apply", "criteria"]),
            "benefits": self._extract_section(text, ["benefits", "assistance", "subsidy", "amount", "grant"]),
            "documents_required": self._extract_section(text, ["documents", "required documents", "papers needed"]),
            "deadline": self._extract_deadline(text),
            "state": self._extract_state(text),
            "target_audience": self._detect_audience(text),
            "budget_allocated": self._extract_budget(text),
            "source_url": source_url,
        }

    def _extract_title(self, text: str) -> str:
        """Extract the title/name of the scheme."""
        lines = text.strip().split("\n")
        for line in lines[:5]:
            line = line.strip()
            # Look for scheme-like titles
            if any(kw in line.lower() for kw in ["scheme", "yojana", "mission", "programme", "abhiyan", "initiative"]):
                return line[:200]
            # First substantial line as title
            if 10 < len(line) < 200 and not line.startswith(("http", "www", "©")):
                return line

        return lines[0][:200] if lines else ""

    def _extract_ministry(self, text: str) -> str:
        """Identify the ministry from the text."""
        text_lower = text.lower()
        for ministry in self.MINISTRIES:
            if ministry.lower() in text_lower:
                return ministry
        # Regex for "Ministry of X"
        match = re.search(r'Ministry\s+of\s+[\w\s&]+', text, re.IGNORECASE)
        if match:
            return match.group(0).strip()[:255]
        return ""

    def _extract_department(self, text: str) -> str:
        """Extract department name."""
        match = re.search(r'Department\s+of\s+[\w\s&]+', text, re.IGNORECASE)
        if match:
            return match.group(0).strip()[:255]
        return ""

    def _detect_category(self, text: str, default: str) -> str:
        """Detect scheme category based on keyword matching."""
        text_lower = text.lower()
        scores = {}
        for category, keywords in self.CATEGORY_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                scores[category] = score

        if scores:
            return max(scores, key=scores.get)
        return default

    def _detect_audience(self, text: str) -> str:
        """Detect target audience based on keyword matching."""
        text_lower = text.lower()
        scores = {}
        for audience, keywords in self.AUDIENCE_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                scores[audience] = score

        if scores:
            return max(scores, key=scores.get)
        return "citizen"

    def _extract_section(self, text: str, keywords: List[str]) -> str:
        """Extract a section of text following given keywords."""
        lines = text.split("\n")
        capturing = False
        result = []

        for i, line in enumerate(lines):
            line_lower = line.strip().lower()
            if any(kw in line_lower for kw in keywords):
                capturing = True
                # If keyword is part of a line with content, capture the rest
                parts = re.split(r'[:\-\—]', line, maxsplit=1)
                if len(parts) > 1 and parts[1].strip():
                    result.append(parts[1].strip())
                continue

            if capturing:
                if line.strip() and not any(
                    stop in line_lower for stop in ["scheme", "ministry", "department", "contact", "website"]
                ):
                    result.append(line.strip())
                else:
                    break

                if len(result) >= 10:
                    break

        return "\n".join(result)[:1000]

    def _extract_deadline(self, text: str) -> str:
        """Extract deadline/date information."""
        patterns = [
            r'deadline[:\s]*([^\n]+)',
            r'last\s+date[:\s]*([^\n]+)',
            r'apply\s+before[:\s]*([^\n]+)',
            r'valid\s+(?:till|until)[:\s]*([^\n]+)',
            r'(\d{1,2}[\-/]\d{1,2}[\-/]\d{2,4})',
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()[:100]
        return "Ongoing"

    def _extract_state(self, text: str) -> str:
        """Detect Indian state references."""
        states = [
            "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
            "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
            "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
            "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
            "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
            "Delhi", "Jammu and Kashmir", "Ladakh", "Chandigarh", "Puducherry",
        ]
        found = [s for s in states if s.lower() in text.lower()]
        if found:
            return ", ".join(found[:3])
        return "All India"

    def _extract_budget(self, text: str) -> float:
        """Extract budget/allocation amount in crores."""
        patterns = [
            r'(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d+)?)\s*(?:crore|cr)',
            r'([\d,]+(?:\.\d+)?)\s*(?:crore|cr)',
            r'budget[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d+)?)',
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    return float(match.group(1).replace(",", ""))
                except ValueError:
                    pass
        return 0.0
