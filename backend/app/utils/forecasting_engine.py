# backend/app/utils/forecasting_engine.py

from datetime import datetime, timedelta
from typing import List, Dict

def forecast_net_worth(
    net_income: float,
    total_expenses: float,
    total_emi: float,
    total_investments: float,
    total_debt: float,
    months: int = 24,
    income_growth_rate: float = 0.05,     # 5% annual raise
    investment_return_rate: float = 0.10,  # 10% annual return
    scenario: str = "normal"              # "normal", "missed_payment", "salary_hike"
) -> List[Dict]:
    """
    Project net worth over N months.
    Returns list of monthly snapshots.
    """
    monthly_savings = net_income - total_expenses - total_emi
    current_investments = total_investments
    current_debt = total_debt
    current_income = net_income
    
    projections = []
    
    for month in range(1, months + 1):
        # Annual income growth applied monthly
        if month % 12 == 0:
            current_income *= (1 + income_growth_rate)
        
        # Monthly investment return
        monthly_return_rate = investment_return_rate / 12
        current_investments *= (1 + monthly_return_rate)
        current_investments += monthly_savings
        
        # Debt reduces by EMI principal component (simplified)
        current_debt = max(0, current_debt - (total_emi * 0.6))  # ~60% of EMI goes to principal
        
        # Scenario modifiers
        if scenario == "missed_payment" and month % 6 == 0:
            # Simulate missing a payment every 6 months
            late_fee = total_emi * 0.02  # 2% late fee
            current_investments -= late_fee
        
        if scenario == "salary_hike" and month == 12:
            current_income *= 1.20  # 20% raise at month 12
        
        net_worth = current_investments - current_debt
        
        projections.append({
            "month": month,
            "month_label": _get_month_label(month),
            "net_worth": round(net_worth, 2),
            "investments": round(current_investments, 2),
            "debt": round(current_debt, 2),
            "monthly_income": round(current_income, 2)
        })
    
    return projections

def forecast_goal_completion(
    target_amount: float,
    current_saved: float,
    monthly_contribution: float,
    return_rate: float = 0.06
) -> dict:
    """
    Predict when a savings goal will be completed.
    """
    if monthly_contribution <= 0:
        return {"achievable": False, "reason": "No monthly contribution set"}
    
    balance = current_saved
    months_needed = 0
    monthly_rate = return_rate / 12
    
    while balance < target_amount and months_needed < 600:  # Max 50 years
        balance = balance * (1 + monthly_rate) + monthly_contribution
        months_needed += 1
    
    if months_needed >= 600:
        return {"achievable": False, "reason": "Goal requires too long to achieve"}
    
    completion_date = datetime.utcnow() + timedelta(days=months_needed * 30)
    
    return {
        "achievable": True,
        "months_needed": months_needed,
        "completion_date": completion_date.strftime("%Y-%m-%d"),
        "total_contributed": round(monthly_contribution * months_needed, 2),
        "interest_earned": round(balance - current_saved - (monthly_contribution * months_needed), 2)
    }

def _get_month_label(month_offset: int) -> str:
    from dateutil.relativedelta import relativedelta
    future = datetime.utcnow() + relativedelta(months=month_offset)
    return future.strftime("%b %Y")
