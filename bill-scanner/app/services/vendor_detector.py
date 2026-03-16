import numpy as np
import re
from typing import Optional, Tuple
from services.embedding_service import embed_text
from services.vector_store import search_similar

# Known vendor patterns for fast matching
VENDOR_PATTERNS = {
    r'apsrtc|tsrtc|ksrtc|msrtc': 'bus_service',
    r'irctc|indian rail': 'railways',
    r'inox|pvr|cinepolis|carnival': 'cinema',
    r'starbucks|cafe coffee day|barista|costa': 'cafe',
    r'amazon|flipkart|myntra|snapdeal': 'ecommerce',
    r'zomato|swiggy|uber eats': 'food_delivery',
    r'uber|ola|rapido': 'ride_hailing',
    r'dominos|pizza hut|kfc|mcdonalds|burger king': 'fast_food',
    r'apollo|medplus|netmeds': 'pharmacy',
    r'reliance|dmart|bigbasket|more': 'grocery',
}


def detect_vendor(raw_text: str) -> Tuple[str, str]:
    """
    Stage 7: Detect vendor from OCR text.
    Returns (vendor_name, vendor_type)
    """
    # First line(s) usually contain merchant name
    lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
    candidate = lines[0] if lines else ""

    # Only scan first 5 lines for vendor patterns, not the full text
    # This prevents matching "more" or "total" from middle of receipt
    top_text = '\n'.join(lines[:5]).lower()

    for pattern, vendor_type in VENDOR_PATTERNS.items():
        if re.search(pattern, top_text):
            match = re.search(pattern, top_text)
            vendor_name = match.group(0).upper() if match else candidate
            return vendor_name, vendor_type

    # Fallback: use first meaningful line
    if candidate:
        # Clean up the candidate
        candidate = re.sub(r'[^A-Za-z0-9\s]', '', candidate).strip()
        if len(candidate) > 2:
            return candidate, "unknown"

    return "Unknown Vendor", "unknown"
