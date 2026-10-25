from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.config import settings
from app.database import Base, engine
from app import models  # noqa: F401 - registers mapped models before create_all
from app.routers import auth, llm, materials, questions, quizzes


def add_missing_columns() -> None:
    # create_all does not alter existing tables, so add columns introduced after a database was created.
    columns = {column["name"] for column in inspect(engine).get_columns("flashcard_sets")}
    if "created_at" not in columns:
        column_type = models.FlashcardSet.__table__.c.created_at.type.compile(dialect=engine.dialect)
        with engine.begin() as connection:
            connection.execute(text(f"ALTER TABLE flashcard_sets ADD COLUMN created_at {column_type}"))


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    add_missing_columns()
    yield


app = FastAPI(
    title="Quizlet Learning API",
    description=(
        "A single-process API organized into auth, question, quiz, and LLM service modules. "
        "The LLM module uses Ollama for embeddings and flashcard generation; it is not a separately run service. "
        "Swagger UI is available at `/docs` and the OpenAPI schema at `/openapi.json`."
    ),
    version="1.1.0",
    openapi_tags=[
        {"name": "auth", "description": "Signup, login, and bearer token validation."},
        {"name": "questions", "description": "Admin question bank and quiz scoring."},
        {"name": "question service - materials", "description": "User-owned material ingestion and semantic search."},
        {"name": "quiz", "description": "Admin quiz bank endpoints preserved from the Java backend."},
        {"name": "quiz service - flashcards", "description": "Generate, study, and review material-grounded flashcards."},
        {"name": "LLM service", "description": "Health/status endpoint for the in-process Ollama integration."},
    ],
    lifespan=lifespan,
)
app.add_middleware(CORSMiddleware, allow_origins=settings.allowed_origins,
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router)
app.include_router(questions.router)
app.include_router(materials.router)
app.include_router(quizzes.router)
app.include_router(llm.router)


@app.get("/health")
def health():
    return {"status": "ok"}
