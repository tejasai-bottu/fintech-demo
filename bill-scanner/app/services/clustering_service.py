import numpy as np
from typing import List, Dict, Optional
from collections import Counter
import re

def cluster_vectors(vectors: np.ndarray) -> np.ndarray:
    """
    Stage 6: Automatic category discovery using HDBSCAN.
    No need to predefine categories.
    Returns cluster label array (-1 means noise/outlier).
    """
    import hdbscan

    if len(vectors) < 5:
        return np.full(len(vectors), -1)

    clusterer = hdbscan.HDBSCAN(
        min_cluster_size=5,
        min_samples=2,
        metric='euclidean',
        cluster_selection_epsilon=0.5
    )
    labels = clusterer.fit_predict(vectors)
    return labels


def generate_category_name(texts: List[str]) -> str:
    """
    Auto-generate a category name from the most frequent meaningful words
    in a cluster of receipt texts.
    """
    stopwords = {
        'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on',
        'at', 'for', 'with', 'by', 'from', 'is', 'are', 'was',
        'total', 'amount', 'tax', 'subtotal', 'date', 'no', 'item'
    }

    all_words = []
    for text in texts:
        words = re.findall(r'[a-z]{3,}', text.lower())
        all_words.extend([w for w in words if w not in stopwords])

    if not all_words:
        return "uncategorized"

    counter = Counter(all_words)
    top_words = [w for w, _ in counter.most_common(3)]
    return "_".join(top_words)


def assign_categories(labels: np.ndarray, texts: List[str]) -> Dict[int, str]:
    """
    Map cluster IDs to auto-generated category names.
    Returns dict: {cluster_id: category_name}
    """
    cluster_texts: Dict[int, List[str]] = {}

    for label, text in zip(labels, texts):
        if label == -1:
            continue
        cluster_texts.setdefault(int(label), []).append(text)

    categories = {}
    for cluster_id, cluster_text_list in cluster_texts.items():
        categories[cluster_id] = generate_category_name(cluster_text_list)

    return categories
