from sqlalchemy import create_engine
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
