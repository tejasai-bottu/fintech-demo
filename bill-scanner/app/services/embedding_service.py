import numpy as np
from pathlib import Path
import requests, os

MODEL_URL = "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/onnx/model.onnx"
TOKENIZER_URL = "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/tokenizer.json"
MODEL_DIR = Path("/vector_data/model")

_session = None
_tokenizer = None

def _download(url, dest):
    if not dest.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        r = requests.get(url, stream=True)
        with open(dest, "wb") as f:
            for chunk in r.iter_content(8192):
                f.write(chunk)

def _get_session():
    global _session, _tokenizer
    if _session is None:
        import onnxruntime as ort
        from tokenizers import Tokenizer

        model_path = MODEL_DIR / "model.onnx"
        tok_path = MODEL_DIR / "tokenizer.json"
        _download(MODEL_URL, model_path)
        _download(TOKENIZER_URL, tok_path)

        _session = ort.InferenceSession(str(model_path))
        _tokenizer = Tokenizer.from_file(str(tok_path))
        _tokenizer.enable_padding(length=128)
        _tokenizer.enable_truncation(max_length=128)
    return _session, _tokenizer

def embed_text(text: str) -> np.ndarray:
    session, tokenizer = _get_session()
    enc = tokenizer.encode(text)
    input_ids = np.array([enc.ids], dtype=np.int64)
    mask = np.array([enc.attention_mask], dtype=np.int64)
    token_type = np.zeros_like(input_ids)
    outputs = session.run(None, {
        "input_ids": input_ids,
        "attention_mask": mask,
        "token_type_ids": token_type
    })
    # Mean pool
    vec = outputs[0][0].mean(axis=0)
    norm = np.linalg.norm(vec)
    return (vec / norm if norm > 0 else vec).astype(np.float16)

def embed_batch(texts: list[str]) -> np.ndarray:
    return np.array([embed_text(t) for t in texts])