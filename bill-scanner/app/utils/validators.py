from typing import Optional
from datetime import date


def validate_receipt_data(
    vendor: Optional[str],
    amount: Optional[float],
    receipt_date: Optional[date],
    raw_text: str
) -> dict:
    """
    Stage 9: Validate extracted receipt data.
    Returns dict with validation results and any warnings.
    """
    warnings = []
    is_valid = True

    if not raw_text or len(raw_text.strip()) < 10:
        warnings.append("OCR text too short — image may be unclear")
        is_valid = False

    if amount is None:
        warnings.append("Could not extract amount")
    elif amount <= 0:
        warnings.append("Invalid amount (zero or negative)")
        is_valid = False
    elif amount > 1_000_000:
        warnings.append("Amount unusually large — please verify")

    if receipt_date is None:
        warnings.append("Could not extract date")

    if not vendor or vendor == "Unknown Vendor":
        warnings.append("Vendor not identified")

    confidence = 1.0
    if amount is None:
        confidence -= 0.3
    if receipt_date is None:
        confidence -= 0.2
    if not vendor or vendor == "Unknown Vendor":
        confidence -= 0.2

    return {
        "is_valid": is_valid,
        "warnings": warnings,
        "confidence_score": max(0.0, confidence)
    }
