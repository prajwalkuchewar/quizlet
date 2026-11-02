"""Re-embed every stored material chunk with the configured embedding provider.

Run after changing the embedding provider or model (for example hash -> local model):
    docker compose exec backend python -m app.reembed
"""
from app.database import SessionLocal
from app.models import MaterialChunk
from app.services.embedding_service import embed_texts

BATCH_SIZE = 64


def reembed_all() -> int:
    total = 0
    with SessionLocal() as db:
        chunk_ids = [row[0] for row in db.query(MaterialChunk.id).order_by(MaterialChunk.id)]
        for start in range(0, len(chunk_ids), BATCH_SIZE):
            batch = db.query(MaterialChunk).filter(
                MaterialChunk.id.in_(chunk_ids[start:start + BATCH_SIZE])).all()
            for chunk, vector in zip(batch, embed_texts([chunk.content for chunk in batch])):
                chunk.embedding = vector
            db.commit()
            total += len(batch)
    return total


if __name__ == "__main__":
    print(f"re-embedded {reembed_all()} chunks")
