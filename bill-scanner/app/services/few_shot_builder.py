from sqlalchemy.orm import Session
from database.schema import Receipt
import logging

logger = logging.getLogger(__name__)


def build_few_shot_examples(
    similar_results: list,
    db: Session,
    max_examples: int = 3
) -> list:
    """
    Build few-shot examples from past similar receipts.
    Only uses high-confidence, verified receipts as examples.
    Returns list of {text, vendor, amount, date, category} dicts.
    """
    examples = []

    for vector_idx, distance, meta in similar_results:
        # Only use close matches (distance threshold)
        if distance > 0.8:
            continue

        receipt_id = meta.get("receipt_id")
        if not receipt_id:
            continue

        receipt = db.query(Receipt).filter_by(id=receipt_id).first()
        if not receipt:
            continue

        # Only use receipts with good confidence as examples
        if receipt.confidence_score and receipt.confidence_score < 0.6:
            continue

        # Skip receipts with missing critical fields
        if not receipt.vendor or not receipt.amount:
            continue

        examples.append({
            "text": receipt.normalized_text or "",
            "vendor": receipt.vendor,
            "amount": receipt.amount,
            "date": str(receipt.date) if receipt.date else None,
            "category": receipt.category or "other"
        })

        if len(examples) >= max_examples:
            break

    return examples


def format_few_shot_prompt(examples: list, current_text: str) -> str:
    """
    Format examples + current receipt into a few-shot prompt string.
    """
    if not examples:
        # No examples available — return plain text
        return current_text

    prompt_parts = []
    prompt_parts.append("Here are some examples of receipts I have processed before:\n")

    for i, ex in enumerate(examples, 1):
        prompt_parts.append(f"--- Example {i} ---")
        prompt_parts.append(f"Receipt text: {ex['text'][:300]}")
        prompt_parts.append(f"Result: {{")
        prompt_parts.append(f'  "vendor": "{ex["vendor"]}",')
        prompt_parts.append(f'  "amount": {ex["amount"]},')
        prompt_parts.append(f'  "date": "{ex["date"]}",')
        prompt_parts.append(f'  "category": "{ex["category"]}"')
        prompt_parts.append(f"}}\n")

    prompt_parts.append("--- Now extract from this new receipt ---")
    prompt_parts.append(f"Receipt text: {current_text}")

    return "\n".join(prompt_parts)
