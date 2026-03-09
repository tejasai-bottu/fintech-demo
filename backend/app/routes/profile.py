# backend/app/routes/profile.py

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
from slowapi import Limiter
from slowapi.util import get_remote_address

from ..database import get_db
from ..models import (
    User, AdditionalIncome, Debt, SavingsGoal, ExpenseCategory, 
    IncomeType, Priority, GoalType, Investment, NetWorthSnapshot,
    FinancialEvent, EventType, DebtType
)
from ..utils.financial_health import (
    calculate_dti_ratio, 
    calculate_emergency_fund_status,
    validate_financial_feasibility,
    calculate_expense_ratios,
    generate_smart_recommendations
)
from ..utils.tax_calculator import calculate_tax_india
from ..utils.forecasting_engine import forecast_net_worth
from .auth import get_current_user

router = APIRouter(prefix="/api/profile", tags=["profile"])
limiter = Limiter(key_func=get_remote_address)

# ─── Pydantic Models ────────────────────────────────────────────────────────

class AdditionalIncomeSchema(BaseModel):
    source_name: str
    monthly_amount: float
    is_recurring: bool = True

class IncomeUpdate(BaseModel):
    gross_monthly_salary: float
    income_type: str
    state: str
    additional_incomes: List[AdditionalIncomeSchema] = []

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
    current_saved: float = 0
    target_date: str
    priority: str
    goal_type: str

class ExpenseCategoryCreate(BaseModel):
    category_name: str
    monthly_amount: float
    is_essential: bool = True
    is_fixed: bool = True

class ScenarioInput(BaseModel):
    extra_monthly_savings: float = 0       # Additional savings per month
    salary_change_percent: float = 0       # e.g., 10 for +10%, -5 for -5%
    debt_prepayment: float = 0             # One-time extra principal payment
    months: int = 24

# ─── Income Routes ──────────────────────────────────────────────────────────

@router.get("/income")
async def get_income_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = current_user
    additional = db.query(AdditionalIncome).filter(AdditionalIncome.user_id == user.id).all()
    
    return {
        "gross_monthly_salary": user.gross_monthly_salary,
        "net_monthly_income": user.net_monthly_income,
        "income_type": user.income_type.value if user.income_type else None,
        "state": user.state,
        "tax_amount": user.tax_amount,
        "pf_amount": user.pf_amount,
        "additional_incomes": [
            {
                "source_name": inc.source_name,
                "monthly_amount": inc.monthly_amount,
                "is_recurring": inc.is_recurring
            } for inc in additional
        ]
    }

@router.put("/income")
async def update_income_profile(
    data: IncomeUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = current_user
    
    # Validate income is realistic
    if data.gross_monthly_salary > 10_000_000:  # ₹1 Crore/month
        raise HTTPException(status_code=400, detail="Salary value seems unrealistically high")

    if data.gross_monthly_salary < 1000:
        raise HTTPException(status_code=400, detail="Salary must be at least ₹1,000/month")

    try:
        # Calculate Tax (India)
        tax_result = calculate_tax_india(data.gross_monthly_salary * 12, data.state)
        
        # Update User
        user.gross_monthly_salary = data.gross_monthly_salary
        user.gross_annual_salary = data.gross_monthly_salary * 12
        user.income_type = IncomeType(data.income_type)
        user.state = data.state
        user.tax_amount = tax_result["monthly_tax"]
        user.pf_amount = tax_result["monthly_pf"]
        user.net_monthly_income = tax_result["monthly_net_take_home"]
        
        # Update Additional Incomes (Delete and Replace)
        db.query(AdditionalIncome).filter(AdditionalIncome.user_id == user.id).delete()
        for inc in data.additional_incomes:
            new_inc = AdditionalIncome(
                user_id=user.id,
                source_name=inc.source_name,
                monthly_amount=inc.monthly_amount,
                is_recurring=inc.is_recurring
            )
            db.add(new_inc)
            user.net_monthly_income += inc.monthly_amount
            
        db.commit()
        db.refresh(user)
        
        return {
            "message": "Income profile updated",
            "income_breakdown": {
                "gross_monthly": user.gross_monthly_salary,
                "tax_monthly": user.tax_amount,
                "pf_monthly": user.pf_amount,
                "net_monthly": user.net_monthly_income
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update income: {str(e)}")

# ─── Debt Routes ────────────────────────────────────────────────────────────

@router.get("/debts")
async def get_debts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = current_user
    debts = db.query(Debt).filter(Debt.user_id == user.id, Debt.is_active == True).all()
    
    total_emi = sum(d.monthly_emi for d in debts)
    dti_info = calculate_dti_ratio(total_emi, user.net_monthly_income)
    
    return {
        "debts": [
            {
                "id": d.id,
                "debt_type": d.debt_type.value,
                "debt_name": d.debt_name,
                "outstanding_principal": d.outstanding_principal,
                "interest_rate": d.interest_rate,
                "remaining_months": d.remaining_months,
                "monthly_emi": d.monthly_emi,
                "progress_percentage": round((1 - d.outstanding_principal/d.total_principal) * 100, 1) if d.total_principal > 0 else 0
            } for d in debts
        ],
        "summary": {
            "total_debts": len(debts),
            "total_emi": round(total_emi, 2),
            "dti_ratio": dti_info
        }
    }

@router.post("/debts")
async def create_debt(
    data: DebtCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = current_user
    
    # Validate EMI vs income
    if user.net_monthly_income and data.monthly_emi > user.net_monthly_income:
        raise HTTPException(
            status_code=400,
            detail=f"Monthly EMI (₹{data.monthly_emi:,.0f}) cannot exceed net income "
                   f"(₹{user.net_monthly_income:,.0f})"
        )

    # Validate outstanding <= principal
    if data.outstanding_principal > data.total_principal:
        raise HTTPException(
            status_code=400,
            detail="Outstanding principal cannot exceed total principal"
        )

    # Check total DTI after adding this debt
    existing_debts = db.query(Debt).filter(Debt.user_id == user.id, Debt.is_active == True).all()
    current_total_emi = sum(d.monthly_emi for d in existing_debts)
    new_total_emi = current_total_emi + data.monthly_emi

    dti_warning = None
    if user.net_monthly_income and (new_total_emi / user.net_monthly_income) > 0.80:
        dti_warning = f"Total DTI will reach {(new_total_emi/user.net_monthly_income*100):.0f}% — very high"

    try:
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
            expected_end_date=datetime.utcnow() + timedelta(days=data.remaining_months * 30)
        )
        db.add(new_debt)
        
        # Log event
        event = FinancialEvent(
            user_id=user.id,
            event_type=EventType.DEBT_ADDED,
            description=f"New debt added: {data.debt_name} — EMI ₹{data.monthly_emi:,.0f}",
            amount=data.total_principal,
            reference_type="debt"
        )
        db.add(event)
        
        db.commit()
        db.refresh(new_debt)
        
        return {
            "message": "Debt added successfully",
            "debt": {"id": new_debt.id, "debt_name": new_debt.debt_name},
            "portfolio_summary": (await get_debts(db, user)),
            "warning": dti_warning
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add debt: {str(e)}")

@router.delete("/debts/{debt_id}")
async def delete_debt(
    debt_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    debt = db.query(Debt).filter(Debt.id == debt_id, Debt.user_id == current_user.id).first()
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    db.delete(debt)
    db.commit()
    return {"message": "Debt deleted"}

# ─── Savings Goals Routes ───────────────────────────────────────────────────

@router.get("/savings-goals")
async def get_savings_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = current_user
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == user.id).all()
    
    total_needed = sum(g.monthly_contribution_needed for g in goals)
    
    return {
        "goals": [
            {
                "id": g.id,
                "goal_name": g.goal_name,
                "target_amount": g.target_amount,
                "current_saved": g.current_saved,
                "target_date": g.target_date.isoformat(),
                "priority": g.priority.value,
                "goal_type": g.goal_type.value,
                "monthly_contribution_needed": round(g.monthly_contribution_needed, 2),
                "progress_percentage": round((g.current_saved / g.target_amount) * 100, 1) if g.target_amount > 0 else 0
            } for g in goals
        ],
        "summary": {
            "total_goals": len(goals),
            "total_monthly_contribution_needed": round(total_needed, 2)
        }
    }

@router.post("/savings-goals")
async def create_savings_goal(
    data: SavingsGoalCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = current_user
    
    # Logic to calculate monthly needed
    target_date = datetime.fromisoformat(data.target_date)
    months_left = (target_date - datetime.utcnow()).days / 30
    if months_left <= 0: months_left = 1
    
    monthly_needed = (data.target_amount - data.current_saved) / months_left
    if monthly_needed < 0: monthly_needed = 0
    
    # Validate target is achievable given cashflow
    from ..utils.financial_engine import calculate_cashflow
    cashflow = calculate_cashflow(user, db)
    available = cashflow["cashflow"]

    feasibility_warning = None
    if monthly_needed > available * 2:  # Warn if contribution > 2x available cashflow
        feasibility_warning = (
            f"Monthly contribution needed (₹{monthly_needed:,.0f}) is very high "
            f"compared to available cashflow (₹{available:,.0f})"
        )

    try:
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
        
        # Log event
        event = FinancialEvent(
            user_id=user.id,
            event_type=EventType.GOAL_CREATED,
            description=f"Savings goal created: {data.goal_name} — target ₹{data.target_amount:,.0f}",
            amount=data.target_amount,
            reference_type="goal"
        )
        db.add(event)
        
        db.commit()
        db.refresh(new_goal)
        
        # Check feasibility
        feasibility = validate_financial_feasibility(
            user.net_monthly_income, 
            0, 
            0, 
            monthly_needed
        )
        
        return {
            "message": "Goal created successfully",
            "goal": {
                "id": new_goal.id,
                "goal_name": new_goal.goal_name,
                "monthly_contribution_needed": round(monthly_needed, 2)
            },
            "feasibility_check": feasibility,
            "warning": feasibility_warning
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create goal: {str(e)}")

@router.delete("/savings-goals/{goal_id}")
async def delete_savings_goal(
    goal_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted"}

# ─── Expense Categories Routes ──────────────────────────────────────────────

@router.get("/expense-categories")
async def get_expense_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = current_user
    categories = db.query(ExpenseCategory).filter(ExpenseCategory.user_id == user.id).all()
    
    total_expenses = sum(c.monthly_amount for c in categories)
    essential_expenses = sum(c.monthly_amount for c in categories if c.is_essential)
    
    expenses_dict = {c.category_name: c.monthly_amount for c in categories}
    analysis = calculate_expense_ratios(expenses_dict, user.net_monthly_income)
    
    return {
        "categories": [
            {
                "id": c.id,
                "category_name": c.category_name,
                "monthly_amount": c.monthly_amount,
                "is_essential": c.is_essential,
                "is_fixed": c.is_fixed,
                "percentage_of_income": round((c.monthly_amount / user.net_monthly_income) * 100, 1) if user.net_monthly_income > 0 else 0
            } for c in categories
        ],
        "summary": {
            "total_expenses": round(total_expenses, 2),
            "essential_expenses": round(essential_expenses, 2),
            "non_essential_expenses": round(total_expenses - essential_expenses, 2),
            "expense_ratio": round((total_expenses / user.net_monthly_income) * 100, 1) if user.net_monthly_income > 0 else 0
        },
        "analysis": analysis
    }

@router.post("/expense-categories")
async def create_expense_category(
    data: ExpenseCategoryCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = current_user
    
    new_cat = ExpenseCategory(
        user_id=user.id,
        category_name=data.category_name,
        monthly_amount=data.monthly_amount,
        is_essential=data.is_essential,
        is_fixed=data.is_fixed
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    
    return {"message": "Expense category added", "category_id": new_cat.id}

@router.delete("/expense-categories/{category_id}")
async def delete_expense_category(
    category_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    category = db.query(ExpenseCategory).filter(ExpenseCategory.id == category_id, ExpenseCategory.user_id == current_user.id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(category)
    db.commit()
    return {"message": "Category deleted"}

# ─── Financial Overview ─────────────────────────────────────────────────────

@router.get("/financial-overview")
async def get_financial_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Complete financial health dashboard
    """
    user = current_user
    
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

# ─── Forecasting and Scenarios ──────────────────────────────────────────────

@router.get("/forecast")
@limiter.limit("60/minute")
async def get_financial_forecast(
    request: Request,
    scenario: str = "normal", 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = current_user
    
    debts = db.query(Debt).filter(Debt.user_id == user.id, Debt.is_active == True).all()
    expenses = db.query(ExpenseCategory).filter(ExpenseCategory.user_id == user.id).all()
    investments = db.query(Investment).filter(Investment.user_id == user.id).all()
    
    total_emi = sum(d.monthly_emi for d in debts)
    total_expenses = sum(e.monthly_amount for e in expenses)
    total_investments = sum(i.amount for i in investments)
    total_debt = sum(d.outstanding_principal for d in debts)
    
    projections = forecast_net_worth(
        net_income=user.net_monthly_income or 0,
        total_expenses=total_expenses,
        total_emi=total_emi,
        total_investments=total_investments,
        total_debt=total_debt,
        months=24,
        scenario=scenario
    )
    
    return {
        "scenario": scenario,
        "projections": projections,
        "summary": {
            "current_net_worth": round(total_investments - total_debt, 2),
            "projected_net_worth_12m": projections[11]["net_worth"] if len(projections) > 11 else 0,
            "projected_net_worth_24m": projections[23]["net_worth"] if len(projections) > 23 else 0
        }
    }

@router.get("/net-worth-history")
async def get_net_worth_history(
    days: int = 30, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns net worth snapshots for the past N days.
    Used for the net worth trend chart.
    """
    user = current_user

    since = datetime.utcnow() - timedelta(days=days)
    snapshots = db.query(NetWorthSnapshot).filter(
        NetWorthSnapshot.user_id == user.id,
        NetWorthSnapshot.snapshot_date >= since
    ).order_by(NetWorthSnapshot.snapshot_date.asc()).all()

    if not snapshots:
        # Return current calculated value as single data point
        from ..utils.financial_engine import calculate_net_worth
        nw = calculate_net_worth(user, db)
        return {
            "snapshots": [{
                "date": datetime.utcnow().strftime("%d %b"),
                "net_worth": nw["net_worth"],
                "assets": nw["assets"]["total"],
                "liabilities": nw["liabilities"]["total"]
            }],
            "days_of_data": 1,
            "trend": "insufficient_data"
        }

    result = [
        {
            "date": s.snapshot_date.strftime("%d %b"),
            "net_worth": round(s.net_worth, 2),
            "assets": round(s.total_assets, 2),
            "liabilities": round(s.total_liabilities, 2)
        }
        for s in snapshots
    ]

    # Calculate trend
    first_nw = snapshots[0].net_worth
    last_nw = snapshots[-1].net_worth
    change = last_nw - first_nw
    trend = "up" if change > 0 else "down" if change < 0 else "flat"

    return {
        "snapshots": result,
        "days_of_data": len(snapshots),
        "trend": trend,
        "change": round(change, 2),
        "change_pct": round((change / abs(first_nw) * 100), 2) if first_nw != 0 else 0
    }

@router.post("/scenario/simulate")
@limiter.limit("30/minute")
async def simulate_scenario(
    request: Request,
    data: ScenarioInput, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Run 'what-if' scenarios:
    - What if I got a 20% salary hike?
    - What if I paid extra ₹5000/month toward debt?
    - What if I added ₹3000/month to savings?
    """
    user = current_user

    debts = db.query(Debt).filter(Debt.user_id == user.id, Debt.is_active == True).all()
    expenses = db.query(ExpenseCategory).filter(ExpenseCategory.user_id == user.id).all()
    investments = db.query(Investment).filter(Investment.user_id == user.id).all()

    total_emi = sum(d.monthly_emi for d in debts)
    total_expenses = sum(e.monthly_amount for e in expenses)
    total_investments = sum(i.amount for i in investments)
    total_debt = sum(d.outstanding_principal for d in debts)

    # Apply scenario modifiers
    modified_income = user.net_monthly_income or 0
    if data.salary_change_percent != 0:
        modified_income *= (1 + data.salary_change_percent / 100)

    modified_investments = total_investments
    modified_debt = max(0, total_debt - data.debt_prepayment)

    # Run base scenario (current state)
    base_projections = forecast_net_worth(
        net_income=user.net_monthly_income or 0,
        total_expenses=total_expenses,
        total_emi=total_emi,
        total_investments=total_investments,
        total_debt=total_debt,
        months=data.months,
        scenario="normal"
    )

    # Run modified scenario
    modified_projections = forecast_net_worth(
        net_income=modified_income,
        total_expenses=total_expenses,
        total_emi=total_emi,
        total_investments=modified_investments + data.extra_monthly_savings,
        total_debt=modified_debt,
        months=data.months,
        scenario="normal"
    )

    base_final = base_projections[-1]["net_worth"] if base_projections else 0
    modified_final = modified_projections[-1]["net_worth"] if modified_projections else 0
    improvement = modified_final - base_final

    return {
        "scenario_inputs": data.dict(),
        "base_scenario": {
            "label": "Current Path",
            "projections": base_projections,
            "final_net_worth": round(base_final, 2)
        },
        "modified_scenario": {
            "label": "With Changes",
            "projections": modified_projections,
            "final_net_worth": round(modified_final, 2)
        },
        "improvement": round(improvement, 2),
        "improvement_pct": round((improvement / abs(base_final) * 100), 2) if base_final != 0 else 0
    }
