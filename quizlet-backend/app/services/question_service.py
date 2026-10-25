"""Question bank and user-material indexing operations."""
import re

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Material, MaterialChunk, User
from app.services.llm_service import cosine_similarity, embed_texts


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
    vectors = embed_texts(chunks)
    material = Material(owner_id=owner.id, session_id=session_id, title=title[:255], filename=filename,
                        content=content)
    material.chunks = [MaterialChunk(chunk_index=index, content=chunk, embedding=vector)
                       for index, (chunk, vector) in enumerate(zip(chunks, vectors))]
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


def search_materials(db: Session, owner: User, session_id: str, query: str, material_ids: list[int] | None,
                     limit: int):
    vector = embed_texts([query])[0]
    statement = (db.query(MaterialChunk).join(Material)
                 .filter(Material.owner_id == owner.id, Material.session_id == session_id))
    if material_ids:
        statement = statement.filter(Material.id.in_(material_ids))
    ranked = sorted(statement.all(), key=lambda chunk: cosine_similarity(vector, chunk.embedding), reverse=True)
    return [(chunk, cosine_similarity(vector, chunk.embedding)) for chunk in ranked[:limit]]
