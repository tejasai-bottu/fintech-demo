# backend/app/routes/calendar.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from ..database import get_db
from ..models import User, Debt, SavingsGoal, Bill, CalendarEvent
from .auth import get_current_user

router = APIRouter(prefix="/api/calendar", tags=["calendar"])

@router.get("/events")
async def get_calendar_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Aggregate all upcoming financial events for the next 90 days.
    """
    user = current_user
    today = datetime.utcnow()
    end_date = today + timedelta(days=90)
    
    events = []
    
    # 1. Debt EMI dates
    debts = db.query(Debt).filter(Debt.user_id == user.id, Debt.is_active == True).all()
    for debt in debts:
        # Generate monthly EMI dates for next 90 days
        for months_ahead in range(1, 4):
            emi_date = today.replace(day=5) + timedelta(days=30 * months_ahead)  # Assume 5th of month
            if emi_date <= end_date:
                events.append({
                    "id": f"debt_{debt.id}_{months_ahead}",
                    "type": "emi_payment",
                    "title": f"{debt.debt_name} EMI",
                    "amount": debt.monthly_emi,
                    "date": emi_date.isoformat(),
                    "status": "upcoming",
                    "reference_type": "debt",
                    "reference_id": debt.id
                })
    
    # 2. Bill due dates
    bills = db.query(Bill).filter(Bill.user_id == user.id, Bill.is_active == True).all()
    for bill in bills:
        if bill.next_due_date and bill.next_due_date <= end_date:
            is_overdue = bill.next_due_date < today
            events.append({
                "id": f"bill_{bill.id}",
                "type": "bill_due",
                "title": f"{bill.bill_name} Due",
                "amount": bill.total_amount_due,
                "date": bill.next_due_date.isoformat(),
                "status": "overdue" if is_overdue else "upcoming",
                "reference_type": "bill",
                "reference_id": bill.id
            })
    
    # 3. Savings goal deadlines
    goals = db.query(SavingsGoal).filter(
        SavingsGoal.user_id == user.id,
        SavingsGoal.is_achieved == False,
        SavingsGoal.target_date <= end_date
    ).all()
    for goal in goals:
        events.append({
            "id": f"goal_{goal.id}",
            "type": "goal_deadline",
            "title": f"Goal: {goal.goal_name}",
            "amount": goal.target_amount,
            "date": goal.target_date.isoformat(),
            "status": "upcoming",
            "reference_type": "goal",
            "reference_id": goal.id
        })
    
    # Sort by date
    events.sort(key=lambda x: x["date"])
    
    # Separate upcoming vs overdue
    upcoming = [e for e in events if e["status"] == "upcoming"]
    overdue = [e for e in events if e["status"] == "overdue"]
    
    return {
        "events": events,
        "upcoming": upcoming,
        "overdue": overdue,
        "summary": {
            "total_events": len(events),
            "overdue_count": len(overdue),
            "next_7_days": [e for e in upcoming if 
                           (datetime.fromisoformat(e["date"]) - today).days <= 7]
        }
    }
