from apscheduler.schedulers.background import BackgroundScheduler
from config import settings
import logging

logger = logging.getLogger(__name__)


def run_clustering_job():
    """Periodic job: re-cluster all vectors to update categories."""
    try:
        from services.vector_store import get_all_vectors, get_vector_count, _load_metadata
        from services.clustering_service import cluster_vectors, assign_categories
        from database.db import SessionLocal
        from database.schema import Category, Receipt

        count = get_vector_count()
        if count < 5:
            logger.info(f"Not enough receipts for clustering ({count}). Skipping.")
            return

        logger.info(f"Running clustering on {count} receipts...")
        vectors = get_all_vectors()
        metadata = _load_metadata()

        if vectors is None:
            return

        labels = cluster_vectors(vectors)
        texts = [m.get('normalized_text', '') for m in metadata]
        categories = assign_categories(labels, texts)

        db = SessionLocal()
        try:
            for cluster_id, category_name in categories.items():
                existing = db.query(Category).filter_by(name=category_name).first()
                if not existing:
                    cat = Category(name=category_name, cluster_id=cluster_id)
                    db.add(cat)

            # Update receipt categories
            for i, (label, meta) in enumerate(zip(labels, metadata)):
                if label >= 0 and label in categories:
                    receipt_id = meta.get('receipt_id')
                    if receipt_id:
                        receipt = db.query(Receipt).filter_by(id=receipt_id).first()
                        if receipt:
                            receipt.category = categories[label]

            db.commit()
            logger.info(f"Clustering complete. {len(categories)} categories found.")
        finally:
            db.close()

    except Exception as e:
        logger.error(f"Clustering job failed: {e}")


def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        run_clustering_job,
        'interval',
        hours=settings.CLUSTERING_INTERVAL_HOURS,
        id='clustering_job'
    )
    scheduler.start()
    logger.info("Scheduler started: clustering every "
                f"{settings.CLUSTERING_INTERVAL_HOURS} hours")
