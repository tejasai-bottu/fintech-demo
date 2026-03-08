from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..models import Debt, User
from ..utils.financial_calculations import calculate_emi, calculate_total_interest

router = APIRouter(prefix="/api/debt", tags=["debt"])

class DebtCalculation(BaseModel):
    principal: float
    interest_rate: float
    tenure_months: int

@router.post("/calculate")
async def calculate_debt(data: DebtCalculation):
    """Calculate EMI and interest"""
    emi = calculate_emi(data.principal, data.interest_rate, data.tenure_months)
    total_interest = calculate_total_interest(data.principal, emi, data.tenure_months)
    
    schedule = []
    remaining = data.principal
    monthly_rate = data.interest_rate / (12 * 100)
    
    for month in range(1, min(13, data.tenure_months + 1)):
        interest_payment = remaining * monthly_rate
        principal_payment = emi - interest_payment
        remaining -= principal_payment
        schedule.append({
            "month": month,
            "emi": round(emi, 2),
            "principal": round(principal_payment, 2),
            "interest": round(interest_payment, 2),
            "balance": round(remaining, 2)
        })
    
    return {
        "emi": round(emi, 2),
        "total_interest": round(total_interest, 2),
        "total_payment": round(data.principal + total_interest, 2),
        "amortization_schedule": schedule
    }
