from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..models import Investment, User
from ..ai_engine import AIFinancialEngine

router = APIRouter(prefix="/api/investment", tags=["investment"])

class InvestmentCreate(BaseModel):
    amount: float
    investment_type: str
    duration_years: int
    risk_level: str

@router.post("/predict")
async def predict_investment(data: InvestmentCreate):
    """Predict investment returns using AI"""
    ai_engine = AIFinancialEngine()
    return ai_engine.predict_investment_return(data.risk_level, data.amount, data.duration_years)

@router.post("/create")
async def create_investment(data: InvestmentCreate, db: Session = Depends(get_db)):
    """Create investment record"""
    user_email = "demo@user.com"
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    ai_engine = AIFinancialEngine()
    prediction = ai_engine.predict_investment_return(data.risk_level, data.amount, data.duration_years)
    
    investment = Investment(
        user_id=user.id,
        amount=data.amount,
        investment_type=data.investment_type,
        duration_years=data.duration_years,
        predicted_return=prediction["predicted_rate"],
        risk_score=prediction["risk_score"]
    )
    db.add(investment)
    db.commit()
    db.refresh(investment)
    
    return {"investment": investment, "prediction": prediction}

@router.get("/recommendations")
async def get_recommendations(db: Session = Depends(get_db)):
    """Get personalized recommendations"""
    user_email = "demo@user.com"
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    investments = db.query(Investment).filter(Investment.user_id == user.id).all()
    total_investments = sum(inv.amount for inv in investments)
    
    ai_engine = AIFinancialEngine()
    return ai_engine.generate_investment_recommendation(user.monthly_income, user.risk_tolerance, total_investments)
