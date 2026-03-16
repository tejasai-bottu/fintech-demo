from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database.db import get_db
from database.schema import Receipt
from typing import Optional

router = APIRouter()


@router.get("/receipts")
def list_receipts(
    skip: int = 0,
    limit: int = 20,
    vendor: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Receipt)
    if vendor:
        query = query.filter(Receipt.vendor.ilike(f"%{vendor}%"))
    if category:
        query = query.filter(Receipt.category == category)
    total = query.count()
    receipts = query.order_by(desc(Receipt.created_at)).offset(skip).limit(limit).all()
    return {
        "total": total,
        "receipts": [receipt_to_dict(r) for r in receipts]
    }


@router.get("/receipts/{receipt_id}")
def get_receipt(receipt_id: int, db: Session = Depends(get_db)):
    receipt = db.query(Receipt).filter_by(id=receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt_to_dict(receipt)


@router.delete("/receipts/{receipt_id}")
def delete_receipt(receipt_id: int, db: Session = Depends(get_db)):
    receipt = db.query(Receipt).filter_by(id=receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    db.delete(receipt)
    db.commit()
    return {"message": "Deleted"}


@router.patch("/receipts/{receipt_id}/verify")
def verify_receipt(receipt_id: int, db: Session = Depends(get_db)):
    """Mark a receipt as verified — it will be used as a few-shot example."""
    receipt = db.query(Receipt).filter_by(id=receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    receipt.is_verified = True
    db.commit()
    return {"message": f"Receipt {receipt_id} marked as verified example"}


def receipt_to_dict(r: Receipt) -> dict:
    return {
        "id": r.id,
        "vendor": r.vendor,
        "category": r.category,
        "amount": r.amount,
        "date": str(r.date) if r.date else None,
        "filename": r.filename,
        "confidence_score": r.confidence_score,
        "extra_data": r.extra_data,
        "is_verified": r.is_verified,
        "created_at": str(r.created_at),
    }
