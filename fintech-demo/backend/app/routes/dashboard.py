from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Investment, Debt, Expense
from ..ai_engine import AIFinancialEngine

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/")
async def get_dashboard(db: Session = Depends(get_db)):
    """Get complete dashboard data"""
    user_email = "demo@user.com"
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    investments = db.query(Investment).filter(Investment.user_id == user.id).all()
    debts = db.query(Debt).filter(Debt.user_id == user.id).all()
    expenses = db.query(Expense).filter(Expense.user_id == user.id).all()
    
    total_investments = sum(inv.amount for inv in investments)
    total_debt = sum(debt.outstanding_principal for debt in debts)
    total_emi = sum(debt.monthly_emi for debt in debts)
    total_expenses = sum(exp.amount for exp in expenses)
    monthly_savings = (user.net_monthly_income or 0) - total_expenses - total_emi
    
    ai_engine = AIFinancialEngine()
    market_insights = ai_engine.get_market_insights()
    
    return {
        "user": {
            "name": user.full_name,
            "email": user.email,
            "monthly_income": user.net_monthly_income,
            "risk_tolerance": user.risk_tolerance
        },
        "financial_summary": {
            "total_investments": round(total_investments, 2),
            "total_debt": round(total_debt, 2),
            "monthly_emi": round(total_emi, 2),
            "monthly_expenses": round(total_expenses, 2),
            "monthly_savings": round(monthly_savings, 2),
            "savings_rate": round((monthly_savings / user.net_monthly_income) * 100, 2) if user.net_monthly_income and user.net_monthly_income > 0 else 0
        },
        "market_insights": market_insights
    }
