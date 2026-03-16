from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from database.db import get_db
from database.schema import Receipt, Vendor, Category
from services.vector_store import get_vector_count

router = APIRouter()


@router.get("/analytics/summary")
def get_summary(db: Session = Depends(get_db)):
    total_receipts = db.query(Receipt).count()
    total_vendors = db.query(Vendor).count()
    total_categories = db.query(Category).count()
    vector_count = get_vector_count()

    return {
        "total_receipts": total_receipts,
        "total_vendors": total_vendors,
        "total_categories": total_categories,
        "vector_memory_size": vector_count,
    }


@router.get("/analytics/by-category")
def receipts_by_category(db: Session = Depends(get_db)):
    results = (
        db.query(Receipt.category, func.count(Receipt.id))
        .group_by(Receipt.category)
        .order_by(desc(func.count(Receipt.id)))
        .all()
    )
    return [
        {"category": r[0] or "uncategorized", "count": r[1]}
        for r in results
    ]


@router.get("/analytics/by-vendor")
def receipts_by_vendor(db: Session = Depends(get_db)):
    results = (
        db.query(Receipt.vendor, func.count(Receipt.id))
        .group_by(Receipt.vendor)
        .order_by(desc(func.count(Receipt.id)))
        .limit(10)
        .all()
    )
    return [
        {"vendor": r[0] or "Unknown", "count": r[1]}
        for r in results
    ]


@router.get("/analytics/timeline")
def receipts_timeline(db: Session = Depends(get_db)):
    results = (
        db.query(Receipt.date, func.count(Receipt.id))
        .filter(Receipt.date.isnot(None))
        .group_by(Receipt.date)
        .order_by(Receipt.date)
        .all()
    )
    return [
        {"date": str(r[0]), "count": r[1]}
        for r in results
    ]


@router.post("/analytics/trigger-clustering")
def trigger_clustering():
    from services.scheduler import run_clustering_job
    run_clustering_job()
    return {"message": "Clustering job triggered"}
