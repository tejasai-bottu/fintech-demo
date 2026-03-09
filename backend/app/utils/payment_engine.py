# backend/app/utils/payment_engine.py

from datetime import datetime, timedelta
from typing import Optional

def check_payment_status(bill) -> dict:
    """
    Check if a bill is overdue and calculate penalties.
    Call this daily via scheduler.
    """
    today = datetime.utcnow()
    due_date = bill.next_due_date
    
    if today <= due_date:
        days_until_due = (due_date - today).days
        return {
            "status": "upcoming",
            "days_until_due": days_until_due,
            "late_fee": 0,
            "interest": 0
        }
    
    # Payment is overdue
    days_late = (today - due_date).days
    late_fee = bill.late_fee if days_late >= 1 else 0
    
    # Daily interest on outstanding balance
    daily_rate = bill.interest_rate / 365 / 100
    interest = bill.outstanding_balance * daily_rate * days_late
    
    return {
        "status": "overdue",
        "days_late": days_late,
        "late_fee": round(late_fee, 2),
        "interest": round(interest, 2),
        "total_penalty": round(late_fee + interest, 2)
    }

def calculate_next_due_date(due_date_day: int, from_date: Optional[datetime] = None) -> datetime:
    """
    Calculate the next due date given a day of month.
    E.g., due_date_day=15 → next 15th of month.
    """
    today = from_date or datetime.utcnow()
    
    # Try current month first
    try:
        next_due = today.replace(day=due_date_day, hour=0, minute=0, second=0, microsecond=0)
    except ValueError:
        # Day doesn't exist in current month (e.g., 31 in April)
        # Use last day of month
        import calendar
        last_day = calendar.monthrange(today.year, today.month)[1]
        next_due = today.replace(day=last_day, hour=0, minute=0, second=0, microsecond=0)
    
    # If that date is in the past, move to next month
    if next_due <= today:
        if today.month == 12:
            next_due = next_due.replace(year=today.year + 1, month=1)
        else:
            next_due = next_due.replace(month=today.month + 1)
    
    return next_due

def process_payment(bill, amount_paid: float, payment_date: datetime) -> dict:
    """
    Process a payment against a bill.
    Returns payment details including whether it was late.
    """
    due_date = bill.next_due_date
    is_late = payment_date > due_date
    days_late = max(0, (payment_date - due_date).days) if is_late else 0
    
    late_fee = bill.late_fee if is_late else 0
    daily_rate = bill.interest_rate / 365 / 100
    interest = bill.outstanding_balance * daily_rate * days_late if is_late else 0
    
    # Update outstanding balance
    new_balance = max(0, bill.outstanding_balance - amount_paid)
    
    return {
        "amount_paid": amount_paid,
        "was_late": is_late,
        "days_late": days_late,
        "late_fee_charged": round(late_fee, 2),
        "interest_charged": round(interest, 2),
        "new_balance": round(new_balance, 2),
        "next_due_date": calculate_next_due_date(bill.due_date_day, payment_date)
    }
