import re
from typing import Optional, Tuple
from datetime import datetime, date

# Keywords that typically precede the final amount
TOTAL_KEYWORDS = [
    'grand total', 'total amount', 'net total', 'total due',
    'amount due', 'payable', 'total', 'net payable', 'bill amount',
    'fare', 'amount paid', 'paid'
]


def extract_amount(text: str) -> Optional[float]:
    """
    Stage 8: Extract the final payment amount from receipt text.
    Strategy: find numbers near total-keywords, fallback to largest number.
    """
    text_lower = text.lower()
    lines = text_lower.split('\n')

    # Strategy 1: Find number near total keyword
    for line in lines:
        for keyword in TOTAL_KEYWORDS:
            if keyword in line:
                numbers = re.findall(r'\d+(?:[.,]\d{1,2})?', line)
                if numbers:
                    try:
                        return float(numbers[-1].replace(',', ''))
                    except ValueError:
                        continue

    # Strategy 2: Find all numbers and return the largest (likely total)
    all_numbers = re.findall(r'\d+(?:[.,]\d{1,2})?', text)
    valid_amounts = []
    for n in all_numbers:
        try:
            val = float(n.replace(',', ''))
            # Reasonable receipt amount: between 1 and 1,000,000
            if 1 <= val <= 1_000_000:
                valid_amounts.append(val)
        except ValueError:
            continue

    return max(valid_amounts) if valid_amounts else None


def extract_date(text: str) -> Optional[date]:
    """Extract purchase date from receipt text."""
    patterns = [
        (r'(\d{2})[/\-\.](\d{2})[/\-\.](\d{4})', '%d/%m/%Y'),
        (r'(\d{4})[/\-\.](\d{2})[/\-\.](\d{2})', '%Y/%m/%d'),
        (r'(\d{2})[/\-\.](\d{2})[/\-\.](\d{2})', '%d/%m/%y'),
    ]

    for pattern, fmt in patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            try:
                date_str = '/'.join(match)
                # Normalize format
                parsed = datetime.strptime(date_str, fmt)
                # Sanity check: not in far future or past
                if 2000 <= parsed.year <= 2030:
                    return parsed.date()
            except ValueError:
                continue

    return None
