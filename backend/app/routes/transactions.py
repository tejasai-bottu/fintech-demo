# backend/app/routes/transactions.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..models import (
    User, ExpenseTransaction, ExpenseCategory,
    FinancialEvent, EventType
)
from .auth import get_current_user

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


# ─── Pydantic Models ────────────────────────────────────────────────────────

class TransactionCreate(BaseModel):
    description: str
    amount: float
    category_id: Optional[int] = None
    transaction_date: Optional[str] = None   # ISO string "2025-03-15"
    bill_id: Optional[int] = None


# ─── Route 1: Create Transaction ────────────────────────────────────────────

@router.post("/create")
async def create_transaction(
    data: TransactionCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Record a real expense transaction.
    This is what ACTUALLY happened — not a budget estimate.
    """
    user = current_user

    # Validate amount
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
        
    if data.amount > (user.net_monthly_income or 999999):
        raise HTTPException(
            status_code=400,
            detail="Transaction amount exceeds monthly income — please verify"
        )

    # Validate category if provided
    category = None
    if data.category_id:
        category = db.query(ExpenseCategory).filter(
            ExpenseCategory.id == data.category_id,
            ExpenseCategory.user_id == user.id
        ).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

    # Parse date or use now
    txn_date = datetime.utcnow()
    if data.transaction_date:
        try:
            txn_date = datetime.fromisoformat(data.transaction_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    # ── Deduplication Check ──────────────────────────────────────────────────────
    ten_seconds_ago = datetime.utcnow() - timedelta(seconds=10)
    duplicate = db.query(ExpenseTransaction).filter(
        ExpenseTransaction.user_id == user.id,
        ExpenseTransaction.description == data.description,
        ExpenseTransaction.amount == data.amount,
        ExpenseTransaction.transaction_date >= ten_seconds_ago
    ).first()

    if duplicate:
        return {
            "message": "Transaction already recorded (duplicate prevented)",
            "transaction": {
                "id": duplicate.id,
                "description": duplicate.description,
                "amount": duplicate.amount,
                "transaction_date": duplicate.transaction_date.isoformat()
            }
        }

    try:
        # Insert transaction
        transaction = ExpenseTransaction(
            user_id=user.id,
            category_id=data.category_id,
            description=data.description,
            amount=data.amount,
            transaction_date=txn_date,
            bill_id=data.bill_id
        )
        db.add(transaction)

        # Log financial event
        cat_name = category.category_name if category else "Uncategorized"
        event = FinancialEvent(
            user_id=user.id,
            event_type=EventType.EXPENSE_ADDED,
            description=f"{data.description} — ₹{data.amount:,.0f} ({cat_name})",
            amount=data.amount,
            reference_type="transaction"
        )
        db.add(event)
        db.commit()
        db.refresh(transaction)

        return {
            "message": "Transaction recorded",
            "transaction": {
                "id": transaction.id,
                "description": transaction.description,
                "amount": transaction.amount,
                "transaction_date": transaction.transaction_date.isoformat(),
                "category_id": transaction.category_id
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to record transaction: {str(e)}")


# ─── Route 2: List Transactions ─────────────────────────────────────────────

@router.get("/list")
async def list_transactions(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List transactions with filtering and pagination.
    """
    user = current_user

    now = datetime.utcnow()
    filter_month = month or now.month
    filter_year = year or now.year

    # Base query
    query = db.query(ExpenseTransaction).filter(
        ExpenseTransaction.user_id == user.id,
        extract('month', ExpenseTransaction.transaction_date) == filter_month,
        extract('year', ExpenseTransaction.transaction_date) == filter_year
    )

    if category_id:
        query = query.filter(ExpenseTransaction.category_id == category_id)

    # Count total
    total_count = query.count()

    # Apply pagination
    offset = (page - 1) * page_size
    transactions = query.order_by(
        ExpenseTransaction.transaction_date.desc()
    ).offset(offset).limit(page_size).all()

    # Build category name map
    categories = db.query(ExpenseCategory).filter(
        ExpenseCategory.user_id == user.id
    ).all()
    cat_map = {c.id: c.category_name for c in categories}

    # All transactions for breakdown
    all_transactions = db.query(ExpenseTransaction).filter(
        ExpenseTransaction.user_id == user.id,
        extract('month', ExpenseTransaction.transaction_date) == filter_month,
        extract('year', ExpenseTransaction.transaction_date) == filter_year
    ).all()

    breakdown = {}
    for t in all_transactions:
        key = t.category_id or 0
        breakdown[key] = breakdown.get(key, 0) + t.amount

    total_spent = sum(t.amount for t in all_transactions)
    total_pages = (total_count + page_size - 1) // page_size

    return {
        "transactions": [
            {
                "id": t.id,
                "description": t.description,
                "amount": t.amount,
                "transaction_date": t.transaction_date.isoformat(),
                "category_id": t.category_id,
                "category_name": cat_map.get(t.category_id, "Uncategorized") if t.category_id else "Uncategorized"
            }
            for t in transactions
        ],
        "total_spent": round(total_spent, 2),
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        },
        "category_breakdown": [
            {
                "category_id": k,
                "category_name": cat_map.get(k, "Uncategorized") if k else "Uncategorized",
                "total_spent": round(v, 2)
            }
            for k, v in sorted(breakdown.items(), key=lambda x: x[1], reverse=True)
        ],
        "period": {"month": filter_month, "year": filter_year}
    }


# ─── Route 3: Monthly Summary ────────────────────────────────────────────────

@router.get("/monthly-summary")
async def monthly_summary(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Category-wise spending totals vs budget for a given month.
    """
    user = current_user

    now = datetime.utcnow()
    filter_month = month or now.month
    filter_year = year or now.year

    # Get actual spending from transactions
    transactions = db.query(ExpenseTransaction).filter(
        ExpenseTransaction.user_id == user.id,
        extract('month', ExpenseTransaction.transaction_date) == filter_month,
        extract('year', ExpenseTransaction.transaction_date) == filter_year
    ).all()

    # Get budget categories
    categories = db.query(ExpenseCategory).filter(
        ExpenseCategory.user_id == user.id
    ).all()

    # Build actual spending map
    actual_by_cat = {}
    for t in transactions:
        cid = t.category_id or 0
        actual_by_cat[cid] = actual_by_cat.get(cid, 0) + t.amount

    total_actual = sum(t.amount for t in transactions)
    total_budgeted = sum(c.monthly_amount for c in categories)

    summary = []
    for cat in categories:
        actual = actual_by_cat.get(cat.id, 0)
        budgeted = cat.monthly_amount
        variance = actual - budgeted
        pct_used = (actual / budgeted * 100) if budgeted > 0 else 0

        summary.append({
            "category_id": cat.id,
            "category_name": cat.category_name,
            "budgeted": round(budgeted, 2),
            "actual_spent": round(actual, 2),
            "variance": round(variance, 2),
            "percent_used": round(pct_used, 1),
            "over_budget": variance > 0
        })

    summary.sort(key=lambda x: x["actual_spent"], reverse=True)

    return {
        "period": {"month": filter_month, "year": filter_year},
        "total_actual_spent": round(total_actual, 2),
        "total_budgeted": round(total_budgeted, 2),
        "overall_variance": round(total_actual - total_budgeted, 2),
        "categories": summary
    }
