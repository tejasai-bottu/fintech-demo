from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from ..database import get_db
from ..models import User, Debt
from ..utils.financial_calculations import calculate_emi
from .auth import get_current_user

router = APIRouter(prefix="/api/debt", tags=["debt"])

class EMICalculator(BaseModel):
    principal: float
    interest_rate: float
    tenure_months: int

@router.post("/calculate")
async def get_emi_calculation(data: EMICalculator):
    """Calculate EMI for potential loan"""
    emi = calculate_emi(data.principal, data.interest_rate, data.tenure_months)
    return {
        "emi": round(emi, 2),
        "total_payable": round(emi * data.tenure_months, 2),
        "interest_payable": round((emi * data.tenure_months) - data.principal, 2)
    }

@router.get("/list")
async def list_user_debts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all active debts for the user"""
    user = current_user
    debts = db.query(Debt).filter(Debt.user_id == user.id, Debt.is_active == True).all()
    return debts
