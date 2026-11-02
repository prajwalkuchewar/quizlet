"""Embedding generation for pgvector retrieval.

Uses a local ONNX sentence-embedding model (default all-MiniLM-L6-v2, 384 dimensions, no API key or cost).
The hash provider is a lexical, non-semantic path kept only for fast hermetic tests.
Documents and queries must use the same provider, so changing it requires re-embedding stored chunks.
"""
import hashlib
import math
import re
import threading

from app.config import settings

DIMENSIONS = 384

_local_model = None
_local_model_lock = threading.Lock()


def _get_local_model():
    global _local_model
    if _local_model is None:
        with _local_model_lock:
            if _local_model is None:
                from fastembed import TextEmbedding

                _local_model = TextEmbedding(
                    settings.embedding_local_model,
                    cache_dir=settings.embedding_cache_dir or None,
                )
    return _local_model


def _local_embeddings(texts: list[str]) -> list[list[float]]:
    try:
        vectors = [[float(value) for value in vector] for vector in _get_local_model().embed(texts)]
    except Exception as exc:  # model download/load/inference failures surface as one provider error
        raise RuntimeError(f"Local embedding model unavailable: {exc}") from exc
    if len(vectors) != len(texts) or any(len(vector) != DIMENSIONS for vector in vectors):
        raise RuntimeError(f"Local embedding model must produce {DIMENSIONS}-dimensional vectors")
    return vectors


def _fallback_embedding(text: str) -> list[float]:
    vector = [0.0] * DIMENSIONS
    tokens = re.findall(r"\w+", text.lower())
    for token in tokens:
        digest = hashlib.sha256(token.encode()).digest()
        index = int.from_bytes(digest[:4], "big") % DIMENSIONS
        vector[index] += 1.0 if digest[4] & 1 else -1.0
    norm = math.sqrt(sum(value * value for value in vector)) or 1.0
    return [round(value / norm, 8) for value in vector]


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    if settings.embedding_provider == "hash":
        return [_fallback_embedding(text) for text in texts]
    return _local_embeddings(texts)
