import re
from typing import Tuple

def normalize_text(text: str) -> str:
    """
    Stage 3: Normalize OCR output for semantic embedding.
    Removes noise while preserving meaning.
    """
    # Lowercase
    text = text.lower()
    # Remove special characters except spaces and numbers
    text = re.sub(r'[^a-z0-9\s\./:-]', ' ', text)
    # Collapse multiple spaces
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def extract_merchant_line(raw_text: str) -> str:
    """Extract likely merchant name from first non-empty lines."""
    lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
    # First 1-3 lines usually contain merchant name
    candidate = " ".join(lines[:3]) if lines else ""
    return candidate


def extract_date_strings(text: str) -> list:
    """Find all date-like strings in text."""
    patterns = [
        r'\d{2}/\d{2}/\d{4}',
        r'\d{4}-\d{2}-\d{2}',
        r'\d{2}-\d{2}-\d{4}',
        r'\d{2}\.\d{2}\.\d{4}',
    ]
    dates = []
    for pattern in patterns:
        dates.extend(re.findall(pattern, text))
    return dates

def preprocess_for_llm(text: str) -> str:
    """
    Clean OCR text specifically before sending to LLM.
    Keeps dates, vendor names, and totals intact.
    """
    text = text.lower()

    # Fix OCR character mistakes
    text = text.replace('|', 'i')
    text = re.sub(r'\bl\b', '1', text)   # standalone 'l' → '1' (safe version)
    text = text.replace('₹', 'inr ')
    text = text.replace('rs.', 'inr ')
    text = text.replace('rs ', 'inr ')

    # Normalize date separators → all become /
    text = re.sub(r'(\d{2})[-\.](\d{2})[-\.](\d{4})', r'\1/\2/\3', text)

    # Expand month abbreviations (LLMs read full names more reliably)
    months = {
        "jan": "january", "feb": "february", "mar": "march",
        "apr": "april", "may": "may", "jun": "june",
        "jul": "july", "aug": "august", "sep": "september",
        "oct": "october", "nov": "november", "dec": "december"
    }
    for k, v in months.items():
        text = re.sub(rf'\b{k}\b', v, text)

    # Remove junk that confuses LLM
    text = re.sub(r'booking\s*id[:\s]*\S+', '', text)
    text = re.sub(r'order\s*id[:\s]*\S+', '', text)
    text = re.sub(r'txn\s*id[:\s]*\S+', '', text)
    text = re.sub(r'\+91[\s\-]?\d{10}', '', text)
    text = re.sub(r'\b\d{10}\b', '', text)
    text = re.sub(r'[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}', '', text)
    text = re.sub(r'(www\.|http)\S+', '', text)

    # Collapse extra whitespace
    text = re.sub(r'\s+', ' ', text)

    return text.strip()
