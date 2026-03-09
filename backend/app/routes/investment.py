from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from ..database import get_db
from ..models import User, Investment
from ..ai_engine import AIFinancialEngine
from .auth import get_current_user

router = APIRouter(prefix="/api/investment", tags=["investments"])

class InvestmentCreate(BaseModel):
    amount: float
    investment_type: str
    duration_years: int

@router.post("/predict")
async def predict_investment(data: InvestmentCreate):
    """Predict returns for a potential investment"""
    ai_engine = AIFinancialEngine()
    return ai_engine.predict_investment_return("medium", data.amount, data.duration_years)

@router.post("/create")
async def create_investment(
    data: InvestmentCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save a new investment record"""
    user = current_user
    
    ai_engine = AIFinancialEngine()
    prediction = ai_engine.predict_investment_return("medium", data.amount, data.duration_years)
    
    new_inv = Investment(
        user_id=user.id,
        amount=data.amount,
        investment_type=data.investment_type,
        duration_years=data.duration_years,
        predicted_return=prediction["total_value"],
        risk_score=0.5
    )
    db.add(new_inv)
    db.commit()
    db.refresh(new_inv)
    
    return {"message": "Investment created", "id": new_inv.id}

@router.get("/recommendations")
async def get_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get personalized AI investment recommendations"""
    user = current_user
    
    investments = db.query(Investment).filter(Investment.user_id == user.id).all()
    total_investments = sum(inv.amount for inv in investments)
    
    ai_engine = AIFinancialEngine()
    return ai_engine.generate_investment_recommendation(user.net_monthly_income, user.risk_tolerance, total_investments)
