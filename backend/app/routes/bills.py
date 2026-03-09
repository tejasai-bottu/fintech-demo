# backend/app/routes/bills.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..models import (
    Bill, BillPayment, BillType, BillStatus, PaymentMethod, 
    FinancialEvent, EventType, User, BillCycle, BillCycleStatus
)
from ..utils.payment_engine import check_payment_status, calculate_next_due_date, process_payment
from .auth import get_current_user

router = APIRouter(prefix="/api/bills", tags=["bills"])

class BillCreate(BaseModel):
    bill_name: str
    bill_type: str
    total_amount_due: float
    minimum_due: float = 0
    outstanding_balance: float = 0
    credit_limit: float = 0
    billing_cycle_day: int
    due_date_day: int
    interest_rate: float = 0
    late_fee: float = 0

class PaymentCreate(BaseModel):
    amount_paid: float
    payment_method: Optional[str] = None
    notes: Optional[str] = None

@router.post("/create")
async def create_bill(
    data: BillCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = current_user
    
    next_due = calculate_next_due_date(data.due_date_day)
    
    bill = Bill(
        user_id=user.id,
        bill_name=data.bill_name,
        bill_type=BillType(data.bill_type),
        total_amount_due=data.total_amount_due,
        minimum_due=data.minimum_due,
        outstanding_balance=data.outstanding_balance,
        credit_limit=data.credit_limit,
        billing_cycle_day=data.billing_cycle_day,
        due_date_day=data.due_date_day,
        next_due_date=next_due,
        interest_rate=data.interest_rate,
        late_fee=data.late_fee
    )
    db.add(bill)
    
    # Create financial event
    event = FinancialEvent(
        user_id=user.id,
        event_type=EventType.BILL_CREATED,
        description=f"Bill created: {data.bill_name}",
        amount=data.total_amount_due,
        reference_type="bill"
    )
    db.add(event)
    db.commit()
    db.refresh(bill)
    
    return {"message": "Bill created", "bill_id": bill.id}

@router.get("/list")
async def list_bills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = current_user
    
    bills = db.query(Bill).filter(Bill.user_id == user.id, Bill.is_active == True).all()
    
    result = []
    for bill in bills:
        status_info = check_payment_status(bill)
        result.append({
            "id": bill.id,
            "bill_name": bill.bill_name,
            "bill_type": bill.bill_type.value,
            "total_amount_due": bill.total_amount_due,
            "minimum_due": bill.minimum_due,
            "outstanding_balance": bill.outstanding_balance,
            "credit_limit": bill.credit_limit,
            "next_due_date": bill.next_due_date.isoformat() if bill.next_due_date else None,
            "status": bill.status.value,
            "payment_status": status_info,
            "interest_rate": bill.interest_rate,
            "late_fee": bill.late_fee
        })
    
    total_minimum_due = sum(b.minimum_due for b in bills)
    overdue_count = sum(1 for b in bills if b.status == BillStatus.OVERDUE)
    
    return {
        "bills": result,
        "summary": {
            "total_bills": len(bills),
            "total_minimum_due": round(total_minimum_due, 2),
            "overdue_count": overdue_count
        }
    }

@router.post("/{bill_id}/pay")
async def make_payment(
    bill_id: int, 
    data: PaymentCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = current_user
    
    bill = db.query(Bill).filter(Bill.id == bill_id, Bill.user_id == user.id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    if data.amount_paid <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be positive")

    # Prevent double payment within 5 seconds
    five_seconds_ago = datetime.utcnow() - timedelta(seconds=5)
    recent_payment = db.query(BillPayment).filter(
        BillPayment.bill_id == bill_id,
        BillPayment.amount_paid == data.amount_paid,
        BillPayment.created_at >= five_seconds_ago
    ).first()

    if recent_payment:
        return {
            "message": "Payment already recorded (duplicate prevented)",
            "payment_id": recent_payment.id
        }

    try:
        payment_date = datetime.utcnow()
        payment_result = process_payment(bill, data.amount_paid, payment_date)
        
        # Record payment
        payment = BillPayment(
            bill_id=bill.id,
            user_id=user.id,
            amount_paid=data.amount_paid,
            payment_date=payment_date,
            due_date_at_payment=bill.next_due_date,
            was_late=payment_result["was_late"],
            days_late=payment_result["days_late"],
            late_fee_charged=payment_result["late_fee_charged"],
            interest_charged=payment_result["interest_charged"],
            payment_method=PaymentMethod(data.payment_method) if data.payment_method else None,
            notes=data.notes
        )
        db.add(payment)
        
        # Update bill
        bill.outstanding_balance = payment_result["new_balance"]
        bill.next_due_date = payment_result["next_due_date"]
        bill.status = BillStatus.PAID if payment_result["new_balance"] == 0 else BillStatus.PARTIALLY_PAID
        
        # Update current bill cycle
        current_cycle = db.query(BillCycle).filter(
            BillCycle.bill_id == bill_id,
            extract('month', BillCycle.cycle_start) == payment_date.month,
            extract('year', BillCycle.cycle_start) == payment_date.year
        ).first()

        if current_cycle:
            current_cycle.paid_amount += data.amount_paid
            remaining = current_cycle.amount_due - current_cycle.paid_amount
            if remaining <= 0:
                current_cycle.status = BillCycleStatus.PAID
            elif current_cycle.paid_amount >= current_cycle.minimum_due:
                current_cycle.status = BillCycleStatus.PARTIALLY_PAID

        # Record financial event
        event_desc = f"Payment of ₹{data.amount_paid:,.0f} for {bill.bill_name}"
        if payment_result["was_late"]:
            event_desc += f" (late by {payment_result['days_late']} days, fee: ₹{payment_result['late_fee_charged']:,.0f})"
        
        event = FinancialEvent(
            user_id=user.id,
            event_type=EventType.PAYMENT_MADE,
            description=event_desc,
            amount=data.amount_paid,
            reference_type="bill",
            reference_id=bill.id
        )
        db.add(event)
        db.commit()
        
        return {
            "message": "Payment recorded successfully",
            "payment_details": payment_result
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Payment failed: {str(e)}")

@router.get("/{bill_id}/history")
async def get_payment_history(
    bill_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payments = db.query(BillPayment).filter(
        BillPayment.bill_id == bill_id,
        BillPayment.user_id == current_user.id
    ).order_by(BillPayment.payment_date.desc()).all()
    
    return {
        "payments": [
            {
                "id": p.id,
                "amount_paid": p.amount_paid,
                "payment_date": p.payment_date.isoformat(),
                "was_late": p.was_late,
                "days_late": p.days_late,
                "late_fee_charged": p.late_fee_charged,
                "interest_charged": p.interest_charged
            } for p in payments
        ]
    }

@router.delete("/{bill_id}")
async def delete_bill(
    bill_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill = db.query(Bill).filter(Bill.id == bill_id, Bill.user_id == current_user.id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    bill.is_active = False
    db.commit()
    return {"message": "Bill deactivated"}

@router.get("/{bill_id}/current-cycle")
async def get_current_cycle(
    bill_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the current open billing cycle for a bill."""
    now = datetime.utcnow()
    cycle = db.query(BillCycle).filter(
        BillCycle.bill_id == bill_id,
        BillCycle.user_id == current_user.id,
        extract('month', BillCycle.cycle_start) == now.month,
        extract('year', BillCycle.cycle_start) == now.year
    ).first()

    if not cycle:
        return {"cycle": None, "message": "No cycle generated yet for this month"}

    remaining = cycle.amount_due - cycle.paid_amount

    return {
        "cycle": {
            "id": cycle.id,
            "cycle_start": cycle.cycle_start.isoformat(),
            "cycle_end": cycle.cycle_end.isoformat(),
            "due_date": cycle.due_date.isoformat(),
            "amount_due": cycle.amount_due,
            "minimum_due": cycle.minimum_due,
            "paid_amount": cycle.paid_amount,
            "remaining": round(remaining, 2),
            "status": cycle.status.value
        }
    }
