from fastapi import APIRouter
from database.db import get_db
from database.schema import Receipt
from sqlalchemy import func
from services.vector_store import get_vector_count

router = APIRouter()


@router.get("/stats")
def get_stats():
    """Return system-wide statistics."""
    db = next(get_db())

    total = db.query(func.count(Receipt.id)).scalar()
    category_counts = (
        db.query(Receipt.category, func.count(Receipt.id))
        .group_by(Receipt.category)
        .all()
    )
    vendor_counts = (
        db.query(Receipt.vendor, func.count(Receipt.id))
        .group_by(Receipt.vendor)
        .order_by(func.count(Receipt.id).desc())
        .limit(10)
        .all()
    )

    return {
        "total_receipts": total,
        "vector_memory_size": get_vector_count(),
        "categories": [
            {"category": cat, "count": count} for cat, count in category_counts
        ],
        "top_vendors": [
            {"vendor": v, "count": count} for v, count in vendor_counts
        ],
    }
