from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models import User, AdditionalIncome, Debt, SavingsGoal, ExpenseCategory, IncomeType, DebtType, Priority, GoalType
from ..utils.tax_calculator import calculate_indian_income_tax, calculate_pf_deduction
from ..utils.financial_health import *

router = APIRouter(prefix="/api/profile", tags=["profile"])

# ========== PYDANTIC MODELS ==========

class IncomeProfileUpdate(BaseModel):
    gross_monthly_salary: float
    income_type: str
    state: str
    additional_incomes: Optional[List[dict]] = []

class DebtCreate(BaseModel):
    debt_type: str
    debt_name: str
    total_principal: float
    outstanding_principal: float
    interest_rate: float
    tenure_months: int
    remaining_months: int
    monthly_emi: float
    start_date: str

class SavingsGoalCreate(BaseModel):
    goal_name: str
    target_amount: float
    current_saved: float
    target_date: str
    priority: str
    goal_type: str

class ExpenseCategoryCreate(BaseModel):
    category_name: str
    monthly_amount: float
    is_essential: bool
    is_fixed: bool

# ========== INCOME ENDPOINTS ==========

@router.put("/income")
async def update_income_profile(
    data: IncomeProfileUpdate,
    db: Session = Depends(get_db)
):
    """
    Update user income and calculate tax
    """
    user_email = "demo@user.com"
    user = db.query(User).filter(User.email == user_email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update basic income
    user.gross_monthly_salary = data.gross_monthly_salary
    user.gross_annual_salary = data.gross_monthly_salary * 12
    user.income_type = IncomeType(data.income_type)
    user.state = data.state
    
    # Calculate tax
    tax_info = calculate_indian_income_tax(user.gross_annual_salary, data.state)
    user.tax_amount = tax_info["monthly_tax"]
    
    # Calculate PF
    user.pf_amount = calculate_pf_deduction(data.gross_monthly_salary)
    
    # Calculate net income
    user.net_monthly_income = (
        data.gross_monthly_salary 
        - user.tax_amount 
        - user.pf_amount 
        - (user.other_deductions or 0)
    )
    
    # Handle additional incomes
    # First, delete existing
    db.query(AdditionalIncome).filter(AdditionalIncome.user_id == user.id).delete()
    
    # Add new ones
    total_additional = 0
    for add_income in data.additional_incomes:
        new_income = AdditionalIncome(
            user_id=user.id,
            source_name=add_income["source_name"],
            monthly_amount=add_income["monthly_amount"],
            is_recurring=add_income.get("is_recurring", True)
        )
        db.add(new_income)
        total_additional += add_income["monthly_amount"]
    
    # Add additional income to net
    user.net_monthly_income += total_additional
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": "Income profile updated successfully",
        "income_breakdown": {
            "gross_monthly": user.gross_monthly_salary,
            "gross_annual": user.gross_annual_salary,
            "tax_monthly": user.tax_amount,
            "pf_monthly": user.pf_amount,
            "additional_income": total_additional,
            "net_monthly": user.net_monthly_income
        },
        "tax_details": tax_info
    }

@router.get("/income")
async def get_income_profile(db: Session = Depends(get_db)):
    """
    Get complete income profile
    """
    user_email = "demo@user.com"
    user = db.query(User).filter(User.email == user_email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    additional_incomes = db.query(AdditionalIncome).filter(
        AdditionalIncome.user_id == user.id
    ).all()
    
    return {
        "gross_monthly_salary": user.gross_monthly_salary,
        "gross_annual_salary": user.gross_annual_salary,
        "income_type": user.income_type,
        "state": user.state,
        "tax_amount": user.tax_amount,
        "pf_amount": user.pf_amount,
        "other_deductions": user.other_deductions,
        "net_monthly_income": user.net_monthly_income,
        "additional_incomes": [
            {
                "id": inc.id,
                "source_name": inc.source_name,
                "monthly_amount": inc.monthly_amount,
                "is_recurring": inc.is_recurring
            } for inc in additional_incomes
        ]
    }

# ========== DEBT ENDPOINTS ==========

@router.post("/debts")
async def create_debt(data: DebtCreate, db: Session = Depends(get_db)):
    """
    Add new debt to portfolio
    """
    user_email = "demo@user.com"
    user = db.query(User).filter(User.email == user_email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create debt
    new_debt = Debt(
        user_id=user.id,
        debt_type=DebtType(data.debt_type),
        debt_name=data.debt_name,
        total_principal=data.total_principal,
        outstanding_principal=data.outstanding_principal,
        interest_rate=data.interest_rate,
        tenure_months=data.tenure_months,
        remaining_months=data.remaining_months,
        monthly_emi=data.monthly_emi,
        start_date=datetime.fromisoformat(data.start_date),
        is_active=True
    )
    
    db.add(new_debt)
    db.commit()
    db.refresh(new_debt)
    
    # Recalculate DTI ratio
    all_debts = db.query(Debt).filter(
        Debt.user_id == user.id,
        Debt.is_active == True
    ).all()
    
    total_emi = sum(debt.monthly_emi for debt in all_debts)
    dti_info = calculate_dti_ratio(total_emi, user.net_monthly_income)
    
    return {
        "message": "Debt added successfully",
        "debt": {
            "id": new_debt.id,
            "debt_name": new_debt.debt_name,
            "debt_type": new_debt.debt_type,
            "monthly_emi": new_debt.monthly_emi,
            "outstanding_principal": new_debt.outstanding_principal
        },
        "portfolio_summary": {
            "total_debts": len(all_debts),
            "total_emi": round(total_emi, 2),
            "dti_ratio": dti_info
        }
    }

@router.get("/debts")
async def get_all_debts(db: Session = Depends(get_db)):
    """
    Get all user debts with portfolio summary
    """
    user_email = "demo@user.com"
    user = db.query(User).filter(User.email == user_email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    debts = db.query(Debt).filter(
        Debt.user_id == user.id,
        Debt.is_active == True
    ).all()
    
    total_emi = sum(debt.monthly_emi for debt in debts)
    total_outstanding = sum(debt.outstanding_principal for debt in debts)
    
    dti_info = calculate_dti_ratio(total_emi, user.net_monthly_income)
    
    return {
        "debts": [
            {
                "id": debt.id,
                "debt_name": debt.debt_name,
                "debt_type": debt.debt_type,
                "total_principal": debt.total_principal,
                "outstanding_principal": debt.outstanding_principal,
                "interest_rate": debt.interest_rate,
                "monthly_emi": debt.monthly_emi,
                "remaining_months": debt.remaining_months,
                "start_date": debt.start_date.isoformat() if debt.start_date else None,
                "progress_percentage": round(
                    ((debt.total_principal - debt.outstanding_principal) / debt.total_principal) * 100, 2
                ) if debt.total_principal > 0 else 0
            } for debt in debts
        ],
        "summary": {
            "total_debts": len(debts),
            "total_emi": round(total_emi, 2),
            "total_outstanding": round(total_outstanding, 2),
            "dti_ratio": dti_info
        }
    }

@router.delete("/debts/{debt_id}")
async def delete_debt(debt_id: int, db: Session = Depends(get_db)):
    """
    Delete/mark debt as completed
    """
    debt = db.query(Debt).filter(Debt.id == debt_id).first()
    
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    
    debt.is_active = False
    debt.completed_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Debt marked as completed"}

# ========== SAVINGS GOALS ENDPOINTS ==========

@router.post("/savings-goals")
async def create_savings_goal(data: SavingsGoalCreate, db: Session = Depends(get_db)):
    """
    Create new savings goal with feasibility check
    """
    user_email = "demo@user.com"
    user = db.query(User).filter(User.email == user_email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate monthly contribution needed
    target_date = datetime.fromisoformat(data.target_date)
    months_to_goal = max(1, (target_date.year - datetime.now().year) * 12 + (target_date.month - datetime.now().month))
    
    monthly_needed = (data.target_amount - data.current_saved) / months_to_goal
    
    # Create goal
    new_goal = SavingsGoal(
        user_id=user.id,
        goal_name=data.goal_name,
        target_amount=data.target_amount,
        current_saved=data.current_saved,
        target_date=target_date,
        priority=Priority(data.priority),
        goal_type=GoalType(data.goal_type),
        monthly_contribution_needed=monthly_needed
    )
    
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    
    # Check feasibility
    all_goals = db.query(SavingsGoal).filter(
        SavingsGoal.user_id == user.id,
        SavingsGoal.is_achieved == False
    ).all()
    
    total_savings_needed = sum(goal.monthly_contribution_needed for goal in all_goals)
    
    # Get current commitments
    active_debts = db.query(Debt).filter(
        Debt.user_id == user.id,
        Debt.is_active == True
    ).all()
    total_emi = sum(debt.monthly_emi for debt in active_debts)
    
    expense_categories = db.query(ExpenseCategory).filter(
        ExpenseCategory.user_id == user.id
    ).all()
    total_expenses = sum(exp.monthly_amount for exp in expense_categories)
    
    feasibility = validate_financial_feasibility(
        user.net_monthly_income,
        total_expenses,
        total_emi,
        total_savings_needed
    )
    
    return {
        "message": "Savings goal created",
        "goal": {
            "id": new_goal.id,
            "goal_name": new_goal.goal_name,
            "target_amount": new_goal.target_amount,
            "monthly_contribution_needed": round(monthly_needed, 2),
            "months_to_goal": months_to_goal
        },
        "feasibility_check": feasibility
    }

@router.get("/savings-goals")
async def get_savings_goals(db: Session = Depends(get_db)):
    """
    Get all savings goals with progress
    """
    user_email = "demo@user.com"
    user = db.query(User).filter(User.email == user_email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    goals = db.query(SavingsGoal).filter(
        SavingsGoal.user_id == user.id,
        SavingsGoal.is_achieved == False
    ).all()
    
    total_monthly_needed = sum(goal.monthly_contribution_needed for goal in goals)
    
    return {
        "goals": [
            {
                "id": goal.id,
                "goal_name": goal.goal_name,
                "target_amount": goal.target_amount,
                "current_saved": goal.current_saved,
                "progress_percentage": round((goal.current_saved / goal.target_amount) * 100, 2) if goal.target_amount > 0 else 0,
                "monthly_contribution_needed": goal.monthly_contribution_needed,
                "target_date": goal.target_date.isoformat() if goal.target_date else None,
                "priority": goal.priority,
                "goal_type": goal.goal_type
            } for goal in goals
        ],
        "summary": {
            "total_goals": len(goals),
            "total_monthly_contribution_needed": round(total_monthly_needed, 2)
        }
    }

# ========== EXPENSES ENDPOINTS ==========

@router.post("/expense-categories")
async def create_expense_category(data: ExpenseCategoryCreate, db: Session = Depends(get_db)):
    """
    Add expense category
    """
    user_email = "demo@user.com"
    user = db.query(User).filter(User.email == user_email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_category = ExpenseCategory(
        user_id=user.id,
        category_name=data.category_name,
        monthly_amount=data.monthly_amount,
        is_essential=data.is_essential,
        is_fixed=data.is_fixed
    )
    
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    
    # Calculate expense ratios
    all_categories = db.query(ExpenseCategory).filter(
        ExpenseCategory.user_id == user.id
    ).all()
    
    expenses_dict = {cat.category_name: cat.monthly_amount for cat in all_categories}
    ratios = calculate_expense_ratios(expenses_dict, user.net_monthly_income)
    
    return {
        "message": "Expense category added",
        "category": {
            "id": new_category.id,
            "category_name": new_category.category_name,
            "monthly_amount": new_category.monthly_amount
        },
        "expense_analysis": ratios
    }

@router.get("/expense-categories")
async def get_expense_categories(db: Session = Depends(get_db)):
    """
    Get all expense categories with analysis
    """
    user_email = "demo@user.com"
    user = db.query(User).filter(User.email == user_email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    categories = db.query(ExpenseCategory).filter(
        ExpenseCategory.user_id == user.id
    ).all()
    
    total_expenses = sum(cat.monthly_amount for cat in categories)
    essential_expenses = sum(cat.monthly_amount for cat in categories if cat.is_essential)
    non_essential = total_expenses - essential_expenses
    
    expenses_dict = {cat.category_name: cat.monthly_amount for cat in categories}
    ratios = calculate_expense_ratios(expenses_dict, user.net_monthly_income)
    
    return {
        "categories": [
            {
                "id": cat.id,
                "category_name": cat.category_name,
                "monthly_amount": cat.monthly_amount,
                "is_essential": cat.is_essential,
                "is_fixed": cat.is_fixed,
                "percentage_of_income": round((cat.monthly_amount / user.net_monthly_income) * 100, 2) if user.net_monthly_income > 0 else 0
            } for cat in categories
        ],
        "summary": {
            "total_expenses": round(total_expenses, 2),
            "essential_expenses": round(essential_expenses, 2),
            "non_essential_expenses": round(non_essential, 2),
            "expense_ratio": round((total_expenses / user.net_monthly_income) * 100, 2) if user.net_monthly_income > 0 else 0
        },
        "analysis": ratios
    }

# ========== FINANCIAL OVERVIEW ==========

@router.get("/financial-overview")
async def get_financial_overview(db: Session = Depends(get_db)):
    """
    Complete financial health dashboard
    """
    user_email = "demo@user.com"
    user = db.query(User).filter(User.email == user_email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all data
    debts = db.query(Debt).filter(Debt.user_id == user.id, Debt.is_active == True).all()
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == user.id, SavingsGoal.is_achieved == False).all()
    expenses = db.query(ExpenseCategory).filter(ExpenseCategory.user_id == user.id).all()
    
    # Calculate totals
    total_emi = sum(debt.monthly_emi for debt in debts)
    total_expenses = sum(exp.monthly_amount for exp in expenses)
    total_savings_needed = sum(goal.monthly_contribution_needed for goal in goals)
    
    committed = total_expenses + total_emi
    available = user.net_monthly_income - committed
    
    # DTI Ratio
    dti_info = calculate_dti_ratio(total_emi, user.net_monthly_income)
    
    # Emergency Fund Status
    # Assume first goal named "Emergency Fund" or create default check
    emergency_goal = next((g for g in goals if "emergency" in g.goal_name.lower()), None)
    emergency_saved = emergency_goal.current_saved if emergency_goal else 0
    emergency_status = calculate_emergency_fund_status(emergency_saved, total_expenses)
    
    # Feasibility Check
    feasibility = validate_financial_feasibility(
        user.net_monthly_income,
        total_expenses,
        total_emi,
        total_savings_needed
    )
    
    # Expense Ratios
    expenses_dict = {exp.category_name: exp.monthly_amount for exp in expenses}
    expense_analysis = calculate_expense_ratios(expenses_dict, user.net_monthly_income)
    
    return {
        "income": {
            "gross_monthly": user.gross_monthly_salary,
            "net_monthly": user.net_monthly_income,
            "tax": user.tax_amount,
            "pf": user.pf_amount
        },
        "commitments": {
            "total_expenses": round(total_expenses, 2),
            "total_emi": round(total_emi, 2),
            "total_committed": round(committed, 2),
            "committed_percentage": round((committed / user.net_monthly_income) * 100, 2) if user.net_monthly_income > 0 else 0
        },
        "savings": {
            "available_monthly": round(available, 2),
            "required_monthly": round(total_savings_needed, 2),
            "shortfall": round(total_savings_needed - available, 2) if total_savings_needed > available else 0
        },
        "health_indicators": {
            "dti_ratio": dti_info,
            "emergency_fund": emergency_status,
            "feasibility": feasibility,
            "expense_ratios": expense_analysis
        },
        "critical_issues": [
            dti_info if dti_info["severity"] in ["danger", "critical"] else None,
            emergency_status if emergency_status["severity"] in ["warning", "critical"] else None,
            feasibility if not feasibility["feasible"] else None
        ],
        "recommendations": generate_smart_recommendations(user, debts, goals, expenses)
    }

def generate_smart_recommendations(user, debts, goals, expenses):
    """
    Generate personalized recommendations
    """
    recommendations = []
    
    total_emi = sum(debt.monthly_emi for debt in debts)
    total_expenses = sum(exp.monthly_amount for exp in expenses)
    total_debt_outstanding = sum(debt.outstanding_principal for debt in debts)
    
    dti = (total_emi / user.net_monthly_income) * 100 if user.net_monthly_income > 0 else 0
    
    # DTI-based recommendations
    if dti > 40:
        recommendations.append({
            "type": "debt",
            "priority": "high",
            "message": f"DTI at {dti:.1f}% - Focus on debt reduction",
            "action": "Consider debt consolidation or extra payments to high-interest loans"
        })
    
    # Expense-based recommendations
    for exp in expenses:
        ratio = (exp.monthly_amount / user.net_monthly_income) * 100 if user.net_monthly_income > 0 else 0
        if exp.category_name.lower() == "housing" and ratio > 40:
            recommendations.append({
                "type": "expense",
                "priority": "medium",
                "message": f"Housing costs at {ratio:.1f}% of income",
                "action": "Consider relocating or finding roommate to reduce rent"
            })
    
    # Emergency fund recommendation
    emergency_goal = next((g for g in goals if "emergency" in g.goal_name.lower()), None)
    if not emergency_goal or (emergency_goal and emergency_goal.current_saved < total_expenses * 3):
        recommendations.append({
            "type": "savings",
            "priority": "high",
            "message": "Emergency fund insufficient",
            "action": f"Build {total_expenses * 3:,.0f} emergency fund (3 months expenses) before aggressive investing"
        })
    
    return recommendations
