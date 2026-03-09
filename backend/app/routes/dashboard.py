from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Investment, Debt
from ..ai_engine import AIFinancialEngine
from ..utils.financial_engine import calculate_cashflow, calculate_net_worth
from .auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/")
async def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = current_user

    # Use the central financial engine for all calculations
    cashflow = calculate_cashflow(user, db)
    net_worth = calculate_net_worth(user, db)

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
            "total_investments": net_worth["assets"]["investments"],
            "total_debt": net_worth["liabilities"]["loans"],
            "monthly_emi": cashflow["commitments"]["emi"],
            "monthly_expenses": cashflow["expenses"],
            "monthly_savings": cashflow["cashflow"],
            "savings_rate": cashflow["savings_rate"],
            "net_worth": net_worth["net_worth"]
        },
        "cashflow": cashflow,
        "net_worth": net_worth,
        "market_insights": market_insights
    }
