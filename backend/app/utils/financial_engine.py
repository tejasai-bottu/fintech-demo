# backend/app/utils/financial_engine.py

from sqlalchemy.orm import Session
from sqlalchemy import extract
from datetime import datetime
from typing import Optional


def calculate_cashflow(
    user,
    db: Session,
    month: Optional[int] = None,
    year: Optional[int] = None
) -> dict:
    """
    Single source of truth for all cashflow calculations.
    Used by: dashboard, forecast, financial_overview, scheduler.

    Returns:
        income:        net monthly take-home
        expenses:      actual transactions this month (or budgeted if no transactions)
        commitments:   EMI + min bill payments + goal contributions
        cashflow:      income - expenses - commitments
    """
    from ..models import (
        ExpenseTransaction, ExpenseCategory,
        Debt, Bill, BillStatus, SavingsGoal
    )

    now = datetime.utcnow()
    filter_month = month or now.month
    filter_year = year or now.year

    net_income = user.net_monthly_income or 0

    # ── Actual expenses from transactions ──────────────────────────────────
    transactions = db.query(ExpenseTransaction).filter(
        ExpenseTransaction.user_id == user.id,
        extract('month', ExpenseTransaction.transaction_date) == filter_month,
        extract('year', ExpenseTransaction.transaction_date) == filter_year
    ).all()

    actual_expenses = sum(t.amount for t in transactions)

    # Fallback to budgeted if no transactions yet
    if actual_expenses == 0:
        cats = db.query(ExpenseCategory).filter(
            ExpenseCategory.user_id == user.id
        ).all()
        actual_expenses = sum(c.monthly_amount for c in cats)

    # ── Commitments ────────────────────────────────────────────────────────
    # 1. Debt EMIs
    active_debts = db.query(Debt).filter(
        Debt.user_id == user.id,
        Debt.is_active == True
    ).all()
    total_emi = sum(d.monthly_emi for d in active_debts)

    # 2. Bill minimum payments (only pending/overdue bills)
    active_bills = db.query(Bill).filter(
        Bill.user_id == user.id,
        Bill.is_active == True,
        Bill.status.in_([BillStatus.PENDING, BillStatus.OVERDUE])
    ).all()
    total_min_bills = sum(b.minimum_due for b in active_bills)

    # 3. Goal contributions
    active_goals = db.query(SavingsGoal).filter(
        SavingsGoal.user_id == user.id,
        SavingsGoal.is_achieved == False
    ).all()
    total_goal_contributions = sum(g.monthly_contribution_needed or 0 for g in active_goals)

    total_commitments = total_emi + total_min_bills + total_goal_contributions

    # ── Cashflow ───────────────────────────────────────────────────────────
    cashflow = net_income - actual_expenses - total_commitments

    return {
        "income": round(net_income, 2),
        "expenses": round(actual_expenses, 2),
        "commitments": {
            "total": round(total_commitments, 2),
            "emi": round(total_emi, 2),
            "bill_minimums": round(total_min_bills, 2),
            "goal_contributions": round(total_goal_contributions, 2)
        },
        "cashflow": round(cashflow, 2),
        "cashflow_positive": cashflow >= 0,
        "expense_ratio": round((actual_expenses / net_income * 100), 2) if net_income > 0 else 0,
        "commitment_ratio": round((total_commitments / net_income * 100), 2) if net_income > 0 else 0,
        "savings_rate": round((cashflow / net_income * 100), 2) if net_income > 0 else 0
    }


def calculate_net_worth(user, db: Session) -> dict:
    """
    Assets minus Liabilities = Net Worth.
    """
    from ..models import Investment, Debt, Bill

    # ── Assets ─────────────────────────────────────────────────────────────
    investments = db.query(Investment).filter(
        Investment.user_id == user.id
    ).all()
    total_investments = sum(i.amount for i in investments)

    # Cash/savings assumed as accessible funds
    # (If you add a savings_balance field to User later, use that)
    savings_balance = 0

    total_assets = total_investments + savings_balance

    # ── Liabilities ────────────────────────────────────────────────────────
    active_debts = db.query(Debt).filter(
        Debt.user_id == user.id,
        Debt.is_active == True
    ).all()
    total_debt = sum(d.outstanding_principal for d in active_debts)

    active_bills = db.query(Bill).filter(
        Bill.user_id == user.id,
        Bill.is_active == True
    ).all()
    total_credit_outstanding = sum(b.outstanding_balance for b in active_bills)

    total_liabilities = total_debt + total_credit_outstanding

    net_worth = total_assets - total_liabilities

    return {
        "assets": {
            "investments": round(total_investments, 2),
            "savings": round(savings_balance, 2),
            "total": round(total_assets, 2)
        },
        "liabilities": {
            "loans": round(total_debt, 2),
            "credit_cards": round(total_credit_outstanding, 2),
            "total": round(total_liabilities, 2)
        },
        "net_worth": round(net_worth, 2),
        "debt_to_asset_ratio": round((total_liabilities / total_assets * 100), 2)
            if total_assets > 0 else 0
    }


def calculate_commitments(user, db: Session) -> dict:
    """
    Returns all fixed monthly obligations.
    """
    from ..models import Debt, Bill, BillStatus, SavingsGoal

    debts = db.query(Debt).filter(
        Debt.user_id == user.id,
        Debt.is_active == True
    ).all()

    bills = db.query(Bill).filter(
        Bill.user_id == user.id,
        Bill.is_active == True
    ).all()

    goals = db.query(SavingsGoal).filter(
        SavingsGoal.user_id == user.id,
        SavingsGoal.is_achieved == False
    ).all()

    net_income = user.net_monthly_income or 1

    emi_total = sum(d.monthly_emi for d in debts)
    bill_min_total = sum(b.minimum_due for b in bills)
    goal_total = sum(g.monthly_contribution_needed or 0 for g in goals)

    grand_total = emi_total + bill_min_total + goal_total
    commitment_ratio = (grand_total / net_income) * 100

    return {
        "emi_payments": round(emi_total, 2),
        "bill_minimums": round(bill_min_total, 2),
        "goal_contributions": round(goal_total, 2),
        "total_commitments": round(grand_total, 2),
        "commitment_ratio": round(commitment_ratio, 2),
        "status": "healthy" if commitment_ratio < 50 else "warning" if commitment_ratio < 70 else "critical"
    }
