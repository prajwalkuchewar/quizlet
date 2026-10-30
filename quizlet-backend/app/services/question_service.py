"""Question bank and user-material indexing operations."""
import math
import re

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Material, MaterialChunk, User


def split_into_chunks(content: str) -> list[str]:
    normalized = re.sub(r"\s+", " ", content).strip()
    if not normalized:
        return []
    size = max(200, settings.material_chunk_chars)
    overlap = min(max(0, settings.material_chunk_overlap), size // 2)
    step = size - overlap
    chunks = [normalized[start:start + size].strip() for start in range(0, len(normalized), step)]
    return [chunk for chunk in chunks if chunk]


def index_material(db: Session, owner: User, session_id: str, title: str, content: str,
                   filename: str | None = None) -> Material:
    chunks = split_into_chunks(content)
    if not chunks:
        raise HTTPException(status_code=422, detail="No readable text found in the material")
    material = Material(owner_id=owner.id, session_id=session_id, title=title[:255], filename=filename,
                        content=content)
    # The embedding column is kept for schema compatibility; retrieval is keyword-based (BM25).
    material.chunks = [MaterialChunk(chunk_index=index, content=chunk, embedding=[])
                       for index, chunk in enumerate(chunks)]
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


def _tokens(text: str) -> list[str]:
    return re.findall(r"\w+", text.lower())


def _bm25_scores(query: str, documents: list[str]) -> list[float]:
    query_terms = set(_tokens(query))
    tokenized = [_tokens(document) for document in documents]
    if not query_terms or not tokenized:
        return [0.0] * len(documents)
    average_length = (sum(len(doc) for doc in tokenized) / len(tokenized)) or 1.0
    total = len(tokenized)
    k1, b = 1.5, 0.75
    scores = []
    for doc in tokenized:
        counts: dict[str, int] = {}
        for token in doc:
            if token in query_terms:
                counts[token] = counts.get(token, 0) + 1
        score = 0.0
        for term, frequency in counts.items():
            containing = sum(1 for other in tokenized if term in other)
            idf = math.log(1 + (total - containing + 0.5) / (containing + 0.5))
            score += idf * frequency * (k1 + 1) / (frequency + k1 * (1 - b + b * len(doc) / average_length))
        scores.append(score)
    return scores


def search_materials(db: Session, owner: User, session_id: str, query: str, material_ids: list[int] | None,
                     limit: int):
    statement = (db.query(MaterialChunk).join(Material)
                 .filter(Material.owner_id == owner.id, Material.session_id == session_id))
    if material_ids:
        statement = statement.filter(Material.id.in_(material_ids))
    chunks = statement.all()
    scores = _bm25_scores(query, [chunk.content for chunk in chunks])
    ranked = sorted(zip(chunks, scores), key=lambda pair: pair[1], reverse=True)
    top = ranked[:limit]
    best = top[0][1] if top and top[0][1] > 0 else 1.0
    return [(chunk, score / best) for chunk, score in top]
