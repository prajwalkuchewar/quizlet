import asyncio
from app.services.llm_service import generate_flashcards_async
from app.models import User
from app.services.question_service import index_material, split_into_chunks


def test_material_ingestion_splits_overlapping_content():
    # Unique words keep the overlap check unambiguous; repeated text matches at many offsets.
    chunks = split_into_chunks(" ".join(f"word{index}" for index in range(600)))
    assert len(chunks) > 1
    assert chunks[1][:40] in chunks[0]


def test_material_ingestion_builds_vectorized_chunks(monkeypatch):
    class FakeDB:
        def add(self, material):
            self.material = material

        def commit(self):
            pass

        def refresh(self, material):
            material.id = 1

    monkeypatch.setattr("app.services.question_service.embed_texts", lambda chunks: [[0.1] * 384 for _ in chunks])
    db = FakeDB()
    user = User(id=7, username="test-user", firstname="Test", lastname="User", password="x")
    material = index_material(db, user, "session", "Notes", "photosynthesis " * 200)
    assert db.material is material
    assert material.chunks and len(material.chunks[0].embedding) == 384


def test_flashcard_generation_validates_structured_output_and_retries(monkeypatch):
    responses = iter([
        '{"cards": [{"front": "Incomplete", "back": "only one"}]}',
        '{"cards": [{"front": "What is alpha?", "back": "A concept."}, {"front": "What is beta?", "back": "Another concept."}]}'
    ])

    async def fake_complete(_messages):
        return next(responses)

    monkeypatch.setattr("app.services.llm_service._complete_json_async", fake_complete)
    cards = asyncio.run(generate_flashcards_async("review", "alpha beta", 2, "beginner"))
    assert len(cards) == 2
    assert cards[0]["front"] == "What is alpha?"
