import requests
import logging
import os
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# Use the service name defined in docker-compose.yml
FINTECH_BASE_URL = os.getenv("FINTECH_BASE_URL", "http://backend:8000")
FINTECH_EMAIL = os.getenv("FINTECH_EMAIL", "admin@example.com")
FINTECH_PASSWORD = os.getenv("FINTECH_PASSWORD", "admin_password")

# Global cache for the token
_token_cache: Dict[str, Any] = {"token": None}

def _get_token() -> Optional[str]:
    """Login to fintech backend and return a fresh JWT."""
    if _token_cache["token"]:
        return _token_cache["token"]

    try:
        resp = requests.post(
            f"{FINTECH_BASE_URL}/api/auth/login",
            json={
                "email": FINTECH_EMAIL,
                "password": FINTECH_PASSWORD,
            },
            timeout=5,
        )
        resp.raise_for_status()
        token = resp.json().get("access_token")
        _token_cache["token"] = token
        return token
    except Exception as e:
        logger.error(f"Failed to authenticate with fintech backend: {e}")
        return None

# Maps receipt-AI LLM categories -> fintech is_essential + is_fixed flags
CATEGORY_FLAGS = {
    "restaurant":    {"is_essential": True,  "is_fixed": False},
    "fast_food":     {"is_essential": True,  "is_fixed": False},
    "grocery":       {"is_essential": True,  "is_fixed": False},
    "cafe":          {"is_essential": False, "is_fixed": False},
    "travel":        {"is_essential": False, "is_fixed": False},
    "hotel":         {"is_essential": False, "is_fixed": False},
    "retail":        {"is_essential": False, "is_fixed": False},
    "pharmacy":      {"is_essential": True,  "is_fixed": False},
    "movie_ticket":  {"is_essential": False, "is_fixed": False},
    "other":         {"is_essential": False, "is_fixed": False},
}

def push_receipt_to_expense(
    vendor: Optional[str],
    amount: Optional[float],
    category: Optional[str],
) -> dict:
    """
    After a receipt is processed, push it as an expense category entry
    to the fintech backend's /api/profile/expense-categories endpoint.

    Returns a result dict with success/failure info.
    """
    if not vendor or not amount:
        logger.warning("Skipping expense push — missing vendor or amount")
        return {"pushed": False, "reason": "missing_data"}

    token = _get_token()
    if not token:
        return {"pushed": False, "reason": "authentication_failed"}

    # Resolve flags from category, default to non-essential variable
    flags = CATEGORY_FLAGS.get(category or "other", {"is_essential": False, "is_fixed": False})

    payload = {
        "category_name": vendor,           # e.g. "Zomato", "APSRTC"
        "monthly_amount": float(amount),   # actual spend from this receipt
        "is_essential": flags["is_essential"],
        "is_fixed": flags["is_fixed"],
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(
            f"{FINTECH_BASE_URL}/api/profile/expense-categories",
            json=payload,
            headers=headers,
            timeout=5,
        )
        
        # If 401, clear token cache and retry once
        if response.status_code == 401:
            _token_cache["token"] = None
            token = _get_token()
            if token:
                headers["Authorization"] = f"Bearer {token}"
                response = requests.post(
                    f"{FINTECH_BASE_URL}/api/profile/expense-categories",
                    json=payload,
                    headers=headers,
                    timeout=5,
                )

        response.raise_for_status()
        result = response.json()
        logger.info(f"Expense pushed: {vendor} Rs.{amount} -> category_id={result.get('id')}")
        return {"pushed": True, "category_id": result.get("id"), "vendor": vendor}

    except requests.exceptions.Timeout:
        logger.error("Fintech push timed out")
        return {"pushed": False, "reason": "timeout"}
    except requests.exceptions.RequestException as e:
        logger.error(f"Fintech push failed: {e}")
        return {"pushed": False, "reason": str(e)}
