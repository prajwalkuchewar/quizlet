"""RAG retrieval and quiz/flashcard creation."""
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Flashcard, FlashcardSet, Material, User
from app.services.question_service import search_materials


def prepare_flashcard_context(db: Session, owner: User, session_id: str, prompt: str, material_ids: list[int],
                              count: int):
    materials = (db.query(Material)
                 .filter(Material.owner_id == owner.id, Material.session_id == session_id,
                         Material.id.in_(material_ids)).all())
    if len(materials) != len(set(material_ids)):
        raise HTTPException(status_code=404, detail="One or more materials were not found")
    matches = search_materials(db, owner, session_id, prompt, material_ids, max(8, count * 3))
    if not matches:
        raise HTTPException(status_code=422, detail="Selected materials have no indexed chunks")
    context = "\n\n".join(f"[Source chunk {chunk.id}] {chunk.content}" for chunk, _score in matches)
    return materials, matches, context


def save_flashcard_set(db: Session, owner: User, prompt: str, title: str | None, materials: list[Material],
                       matches: list, cards: list[dict[str, str]]) -> FlashcardSet:
    card_set = FlashcardSet(owner_id=owner.id, title=(title or prompt[:80] or "Study set")[:255],
                            prompt=prompt, materials=materials)
    card_set.flashcards = [Flashcard(front=card["front"], back=card["back"], source_chunk_id=matches[index % len(matches)][0].id)
                           for index, card in enumerate(cards)]
    db.add(card_set)
    db.commit()
    db.refresh(card_set)
    return card_set
