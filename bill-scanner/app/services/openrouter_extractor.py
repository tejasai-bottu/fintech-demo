import requests
import json
import re
import logging
from typing import Optional
from config import settings

logger = logging.getLogger(__name__)

# Using values from config (which loads from .env)
OPENROUTER_API_KEY = settings.OPENROUTER_API_KEY
OPENROUTER_URL = settings.OPENROUTER_URL
OPENROUTER_MODEL = settings.OPENROUTER_MODEL

HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json"
}

SYSTEM_PROMPT = """You are a receipt information extraction system.
Extract the following fields from the receipt text provided by the user.

Fields to extract:
- vendor: the business or merchant name
- amount: the final total payable amount as a number only (no currency symbol)
- date: the transaction date in YYYY-MM-DD format
- category: one of [movie_ticket, restaurant, travel, retail, hotel, grocery, pharmacy, cafe, fast_food, other]

Rules:
- amount must be the FINAL total, not subtotal or tax
- ignore booking IDs, phone numbers, and address lines
- vendor is the main business name shown on the receipt
- if a field cannot be found, use null
- if the year is missing from the date, assume the current year 2026
- dates may appear as "27 february" or "27 feb" — convert to YYYY-MM-DD format

Return ONLY a valid JSON object with no explanation or extra text."""


def extract_receipt_info(normalized_text: str, examples: list = None) -> dict:
    """
    Use OpenRouter API to extract structured fields from receipt OCR text.
    If examples provided, uses few-shot prompting for better accuracy.
    """
    from services.few_shot_builder import format_few_shot_prompt

    # Build prompt — with examples if available, plain if not
    user_content = format_few_shot_prompt(
        examples or [],
        normalized_text[:800]
    )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content}
    ]

    data = {
        "model": OPENROUTER_MODEL,
        "messages": messages
    }

    # ─── INPUT LOG ───────────────────────────────────────────
    print("\n" + "="*60)
    print("📤 OPENROUTER REQUEST")
    print("="*60)
    print(f"MODEL      : {OPENROUTER_MODEL}")
    print(f"FEW-SHOT   : {len(examples or [])} examples included")
    print("-"*60)
    print("USER INPUT SENT TO LLM:")
    print(user_content[:1200])
    print("="*60 + "\n")
    # ─────────────────────────────────────────────────────────

    try:
        response = requests.post(
            OPENROUTER_URL,
            headers=HEADERS,
            data=json.dumps(data),
            timeout=15
        )
        response.raise_for_status()
        result = response.json()

        ai_message = result["choices"][0]["message"]["content"]

        # ─── OUTPUT LOG ──────────────────────────────────────
        print("\n" + "="*60)
        print("📥 OPENROUTER RESPONSE")
        print("="*60)
        print("RAW LLM OUTPUT:")
        print(ai_message)
        print("-"*60)
        parsed = _parse_json_from_output(ai_message)
        print("PARSED RESULT:")
        print(json.dumps(parsed, indent=2))
        print("="*60 + "\n")
        # ─────────────────────────────────────────────────────

        return parsed

    except requests.exceptions.Timeout:
        print("\n❌ OPENROUTER ERROR: Request timed out\n")
        logger.error("OpenRouter API request timed out")
        return {}
    except requests.exceptions.RequestException as e:
        print(f"\n❌ OPENROUTER ERROR: {e}\n")
        logger.error(f"OpenRouter API request failed: {e}")
        return {}
    except Exception as e:
        print(f"\n❌ OPENROUTER ERROR: {e}\n")
        logger.error(f"OpenRouter extraction failed: {e}")
        return {}


def _parse_json_from_output(text: str) -> dict:
    """
    Robustly extract a JSON object from model output text.
    """
    text = text.strip()

    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try to find JSON block using braces
    json_match = re.search(r'\{[^{}]*\}', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass

    # Try markdown code block
    code_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if code_match:
        try:
            return json.loads(code_match.group(1))
        except json.JSONDecodeError:
            pass

    logger.warning(f"Could not parse JSON from OpenRouter output: {text[:200]}")
    return {}


def safe_amount(val) -> Optional[float]:
    """Safely convert LLM amount output to float."""
    if val is None:
        return None
    try:
        cleaned = re.sub(r'[^\d.]', '', str(val))
        result = float(cleaned)
        return result if 1 <= result <= 1_000_000 else None
    except (ValueError, TypeError):
        return None
