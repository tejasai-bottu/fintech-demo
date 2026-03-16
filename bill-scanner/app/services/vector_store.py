import faiss
import numpy as np
import os
import pickle
from typing import List, Tuple, Optional
from config import settings

DIMENSION = settings.VECTOR_DIMENSION
INDEX_PATH = os.path.join(settings.VECTOR_DATA_PATH, "receipts.index")
META_PATH = os.path.join(settings.VECTOR_DATA_PATH, "receipts_meta.pkl")

# In-memory index
_index: Optional[faiss.Index] = None
_metadata: List[dict] = []


def _get_index() -> faiss.Index:
    global _index
    if _index is None:
        if os.path.exists(INDEX_PATH):
            _index = faiss.read_index(INDEX_PATH)
        else:
            os.makedirs(settings.VECTOR_DATA_PATH, exist_ok=True)
            _index = faiss.IndexFlatL2(DIMENSION)
    return _index


def _load_metadata() -> List[dict]:
    global _metadata
    if not _metadata and os.path.exists(META_PATH):
        with open(META_PATH, 'rb') as f:
            _metadata = pickle.load(f)
    return _metadata


def _save_all():
    faiss.write_index(_get_index(), INDEX_PATH)
    with open(META_PATH, 'wb') as f:
        pickle.dump(_metadata, f)


def store_vector(vector: np.ndarray, meta: dict) -> int:
    """Store embedding vector with metadata. Returns vector ID."""
    index = _get_index()
    metadata = _load_metadata()

    vec = np.array([vector]).astype('float32')
    index.add(vec)
    vector_id = index.ntotal - 1

    metadata.append({**meta, "vector_id": vector_id})
    _save_all()

    return vector_id


def search_similar(vector: np.ndarray, top_k: int = 5) -> List[Tuple[int, float, dict]]:
    """Find top-k most similar receipts."""
    index = _get_index()
    metadata = _load_metadata()

    if index.ntotal == 0:
        return []

    vec = np.array([vector]).astype('float32')
    distances, indices = index.search(vec, min(top_k, index.ntotal))

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx >= 0 and idx < len(metadata):
            results.append((int(idx), float(dist), metadata[idx]))

    return results


def get_all_vectors() -> Optional[np.ndarray]:
    """Retrieve all stored vectors for clustering."""
    index = _get_index()
    if index.ntotal == 0:
        return None
    # Correct way to reconstruct all vectors from IndexFlatL2
    vectors = np.zeros((index.ntotal, DIMENSION), dtype='float32')
    index.reconstruct_n(0, index.ntotal, vectors)
    return vectors


def get_vector_count() -> int:
    return _get_index().ntotal
