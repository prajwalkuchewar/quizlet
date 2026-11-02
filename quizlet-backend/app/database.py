from sqlalchemy import create_engine
from sqlalchemy import text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    pass


# Hosted providers (e.g. Render) hand out postgresql:// URLs, which SQLAlchemy would send to psycopg2.
_database_url = settings.database_url
if _database_url.startswith("postgresql://"):
    _database_url = "postgresql+psycopg://" + _database_url[len("postgresql://"):]

engine = create_engine(_database_url, pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def prepare_database() -> None:
    """Enable pgvector and migrate the old unused JSON embedding column."""
    if engine.dialect.name != "postgresql":
        return
    with engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        columns = connection.execute(text("""
            SELECT data_type FROM information_schema.columns
            WHERE table_name = 'material_chunks' AND column_name = 'embedding'
        """)).fetchone()
        if columns and columns[0] != "USER-DEFINED":
            connection.execute(text("ALTER TABLE material_chunks DROP COLUMN embedding"))
            connection.execute(text("ALTER TABLE material_chunks ADD COLUMN embedding vector(384)"))


def create_vector_index() -> None:
    if engine.dialect.name != "postgresql":
        return
    with engine.begin() as connection:
        connection.execute(text("""
            CREATE INDEX IF NOT EXISTS material_chunks_embedding_hnsw
            ON material_chunks USING hnsw (embedding vector_cosine_ops)
        """))
