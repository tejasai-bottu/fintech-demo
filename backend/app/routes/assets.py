# backend/app/routes/assets.py
"""
Assets API Route
Provides CRUD for user assets + net worth + projection endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from ..database import get_db
from ..models import User, Asset, AssetType, Debt, Investment
from .auth import get_current_user

router = APIRouter(prefix="/api/assets", tags=["assets"])


# ─── Pydantic Schemas ────────────────────────────────────────────────────────

class AssetCreate(BaseModel):
    name: str
    asset_type: str
    current_value: float
    growth_rate: Optional[float] = None
    notes: Optional[str] = None


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    asset_type: Optional[str] = None
    current_value: Optional[float] = None
    growth_rate: Optional[float] = None
    notes: Optional[str] = None


# ─── Helpers ─────────────────────────────────────────────────────────────────

ASSET_TYPE_LABELS = {
    "cash":          "Cash",
    "bank_balance":  "Bank Balance",
    "real_estate":   "Real Estate",
    "stocks":        "Stocks",
    "mutual_funds":  "Mutual Funds",
    "fixed_deposit": "Fixed Deposit",
    "gold":          "Gold",
    "crypto":        "Cryptocurrency",
    "vehicle":       "Vehicle",
    "business":      "Business",
    "insurance":     "Insurance",
    "other":         "Other",
}

ASSET_GROWTH_DEFAULTS = {
    "cash":          0.0,
    "bank_balance":  3.5,
    "real_estate":   8.0,
    "stocks":        12.0,
    "mutual_funds":  11.0,
    "fixed_deposit": 7.0,
    "gold":          9.0,
    "crypto":        20.0,
    "vehicle":       -10.0,   # depreciates
    "business":      15.0,
    "insurance":     6.0,
    "other":         5.0,
}


def _asset_to_dict(a: Asset) -> dict:
    effective_growth = a.growth_rate if a.growth_rate is not None \
        else ASSET_GROWTH_DEFAULTS.get(a.asset_type.value if hasattr(a.asset_type, 'value') else a.asset_type, 5.0)
    return {
        "id":            a.id,
        "name":          a.name,
        "asset_type":    a.asset_type.value if hasattr(a.asset_type, 'value') else a.asset_type,
        "asset_type_label": ASSET_TYPE_LABELS.get(
            a.asset_type.value if hasattr(a.asset_type, 'value') else a.asset_type, "Other"
        ),
        "current_value": a.current_value,
        "growth_rate":   effective_growth,
        "notes":         a.notes,
        "created_at":    a.created_at.isoformat(),
        "updated_at":    a.updated_at.isoformat() if a.updated_at else None,
    }


# ─── Net Worth Calculator ────────────────────────────────────────────────────

def _calculate_full_net_worth(user: User, db: Session) -> dict:
    """
    Net Worth = Total Assets (manual) + Existing Investments - Total Debt
    """
    assets = db.query(Asset).filter(Asset.user_id == user.id).all()
    debts  = db.query(Debt).filter(Debt.user_id == user.id, Debt.is_active == True).all()
    investments = db.query(Investment).filter(Investment.user_id == user.id).all()

    total_assets      = sum(a.current_value for a in assets)
    total_investments = sum(i.amount for i in investments)
    total_debt        = sum(d.outstanding_principal for d in debts)

    net_worth = total_assets + total_investments - total_debt

    # Asset type breakdown
    breakdown: dict = {}
    for a in assets:
        key = a.asset_type.value if hasattr(a.asset_type, 'value') else a.asset_type
        breakdown[key] = breakdown.get(key, 0) + a.current_value

    return {
        "total_assets":      round(total_assets, 2),
        "total_investments": round(total_investments, 2),
        "total_combined_assets": round(total_assets + total_investments, 2),
        "total_debt":        round(total_debt, 2),
        "net_worth":         round(net_worth, 2),
        "asset_breakdown":   {k: round(v, 2) for k, v in breakdown.items()},
    }


# ─── Projection Engine ──────────────────────────────────────────────────────

def _build_projection(user: User, db: Session, months: int = 24) -> list:
    """
    Heuristic projection of net worth over N months.

    Rules:
    - Each asset grows by its annual growth_rate / 12 per month
    - Debt reduces by the principal component of monthly EMIs
    - Income surplus (net_income - expenses - EMIs) adds to assets each month
    - If income can't cover EMIs → debt grows (interest accrues at debt avg rate)
    """
    from ..models import ExpenseCategory, Bill, BillStatus, SavingsGoal

    assets      = db.query(Asset).filter(Asset.user_id == user.id).all()
    debts       = db.query(Debt).filter(Debt.user_id == user.id, Debt.is_active == True).all()
    investments = db.query(Investment).filter(Investment.user_id == user.id).all()
    expenses    = db.query(ExpenseCategory).filter(ExpenseCategory.user_id == user.id).all()

    # ── Starting values ──────────────────────────────────────────────────────
    asset_pool = [(a.current_value, (
        a.growth_rate if a.growth_rate is not None
        else ASSET_GROWTH_DEFAULTS.get(
            a.asset_type.value if hasattr(a.asset_type, 'value') else a.asset_type, 5.0
        )
    )) for a in assets]

    inv_value    = sum(i.amount for i in investments)
    current_debt = sum(d.outstanding_principal for d in debts)
    total_emi    = sum(d.monthly_emi for d in debts)
    total_exp    = sum(e.monthly_amount for e in expenses)
    net_income   = user.net_monthly_income or 0

    # Average debt interest rate (for accrual when cash-strapped)
    avg_debt_rate = 0.0
    if debts:
        avg_debt_rate = sum(d.interest_rate for d in debts) / len(debts)

    monthly_surplus = max(0, net_income - total_exp - total_emi)

    projections = []
    for m in range(1, months + 1):
        # Grow each asset
        new_asset_pool = []
        for val, rate in asset_pool:
            val *= (1 + rate / 100 / 12)
            new_asset_pool.append((val, rate))
        asset_pool = new_asset_pool
        total_assets_now = sum(v for v, _ in asset_pool)

        # Investments grow at 10% p.a. + surplus
        inv_value *= (1 + 0.10 / 12)
        inv_value += monthly_surplus

        # Debt reduces
        if total_emi > 0 and current_debt > 0:
            # 60% of EMI = principal repayment
            principal_repaid = min(current_debt, total_emi * 0.60)
            current_debt = max(0, current_debt - principal_repaid)
        elif current_debt > 0 and net_income < total_exp + total_emi:
            # Can't afford EMI → debt accrues monthly interest
            current_debt *= (1 + avg_debt_rate / 100 / 12)

        nw = total_assets_now + inv_value - current_debt

        # Derive trend signal
        if m == 1:
            prev_nw = nw
        signal = "growth" if nw > prev_nw else "decline" if nw < prev_nw * 0.99 else "stable"
        prev_nw = nw

        projections.append({
            "month":         m,
            "month_label":   _month_label(m),
            "net_worth":     round(nw, 2),
            "assets":        round(total_assets_now + inv_value, 2),
            "debt":          round(current_debt, 2),
            "trend_signal":  signal,
        })

    return projections


def _month_label(offset: int) -> str:
    from dateutil.relativedelta import relativedelta
    future = datetime.utcnow() + relativedelta(months=offset)
    return future.strftime("%b %Y")


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.get("/")
async def list_assets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all assets for the current user."""
    assets = db.query(Asset).filter(Asset.user_id == current_user.id).order_by(Asset.created_at.desc()).all()
    nw     = _calculate_full_net_worth(current_user, db)
    return {
        "assets":    [_asset_to_dict(a) for a in assets],
        "net_worth": nw,
        "count":     len(assets),
    }


@router.post("/")
async def create_asset(
    data: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new asset."""
    if data.current_value < 0:
        raise HTTPException(status_code=400, detail="Asset value cannot be negative")

    try:
        asset_type_enum = AssetType(data.asset_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid asset type: {data.asset_type}")

    asset = Asset(
        user_id=current_user.id,
        name=data.name.strip(),
        asset_type=asset_type_enum,
        current_value=data.current_value,
        growth_rate=data.growth_rate,
        notes=data.notes,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    return {
        "message": "Asset created successfully",
        "asset":   _asset_to_dict(asset),
        "net_worth": _calculate_full_net_worth(current_user, db),
    }


@router.put("/{asset_id}")
async def update_asset(
    asset_id: int,
    data: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing asset."""
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.user_id == current_user.id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if data.name is not None:
        asset.name = data.name.strip()
    if data.asset_type is not None:
        try:
            asset.asset_type = AssetType(data.asset_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid asset type: {data.asset_type}")
    if data.current_value is not None:
        if data.current_value < 0:
            raise HTTPException(status_code=400, detail="Asset value cannot be negative")
        asset.current_value = data.current_value
    if data.growth_rate is not None:
        asset.growth_rate = data.growth_rate
    if data.notes is not None:
        asset.notes = data.notes

    db.commit()
    db.refresh(asset)

    return {
        "message":   "Asset updated successfully",
        "asset":     _asset_to_dict(asset),
        "net_worth": _calculate_full_net_worth(current_user, db),
    }


@router.delete("/{asset_id}")
async def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an asset."""
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.user_id == current_user.id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    db.delete(asset)
    db.commit()

    return {
        "message":   "Asset deleted",
        "net_worth": _calculate_full_net_worth(current_user, db),
    }


@router.get("/net-worth")
async def get_net_worth(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed net worth breakdown."""
    return _calculate_full_net_worth(current_user, db)


@router.get("/projection")
async def get_projection(
    months: int = 24,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get net worth projection for the next N months (max 60).
    """
    if months < 1 or months > 60:
        raise HTTPException(status_code=400, detail="months must be between 1 and 60")

    current_nw  = _calculate_full_net_worth(current_user, db)
    projections = _build_projection(current_user, db, months=months)

    # Determine overall trend
    if projections:
        final_nw  = projections[-1]["net_worth"]
        start_nw  = current_nw["net_worth"]
        change    = final_nw - start_nw
        change_pct = (change / abs(start_nw) * 100) if start_nw != 0 else 0
        overall_trend = "growth" if change > 0 else "decline" if change < 0 else "stable"
    else:
        change = change_pct = 0
        overall_trend = "stable"

    return {
        "current_net_worth": current_nw["net_worth"],
        "projected_net_worth": projections[-1]["net_worth"] if projections else current_nw["net_worth"],
        "change":          round(change, 2),
        "change_pct":      round(change_pct, 2),
        "overall_trend":   overall_trend,
        "months":          months,
        "projections":     projections,
    }
