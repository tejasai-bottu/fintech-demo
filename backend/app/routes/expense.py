from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..models import Expense, User
from ..ai_engine import AIFinancialEngine

router = APIRouter(prefix="/api/expense", tags=["expense"])

class ExpenseCreate(BaseModel):
    category: str
    amount: float
    month: str

@router.post("/create")
async def create_expense(data: ExpenseCreate, db: Session = Depends(get_db)):
    """Create expense record"""
    user_email = "demo@user.com"
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    expense = Expense(user_id=user.id, category=data.category, amount=data.amount, month=data.month)
    db.add(expense)
    db.commit()
    return expense

@router.get("/analyze")
async def analyze_expenses(db: Session = Depends(get_db)):
    """Analyze expenses with AI"""
    user_email = "demo@user.com"
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    expenses = db.query(Expense).filter(Expense.user_id == user.id).all()
    expense_list = [{"category": e.category, "amount": e.amount} for e in expenses]
    
    ai_engine = AIFinancialEngine()
    return ai_engine.analyze_expenses(expense_list)
