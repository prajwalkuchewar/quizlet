from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.database import Base, engine
from app import models  # noqa: F401 - registers mapped models before create_all
from app.routers import auth, llm, materials, questions, quizzes
from app.services.llm_guard import breaker
from app.services.llm_service import status as llm_status

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("quizlet")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Quizlet Learning API",
    description=(
        "One FastAPI application with auth, question bank, materials, quiz, flashcard, and LLM endpoints. "
        "The LLM endpoints call Ollama for embeddings and generation. "
        "Swagger UI is available at `/docs` and the OpenAPI schema at `/openapi.json`."
    ),
    version="1.1.0",
    openapi_tags=[
        {"name": "auth", "description": "Signup, login, and the current user."},
        {"name": "questions", "description": "Admin question bank CRUD."},
        {"name": "materials", "description": "User-owned material ingestion and semantic search."},
        {"name": "quiz", "description": "Quiz catalog, admin quiz creation, and scored attempts."},
        {"name": "flashcards", "description": "Generate, study, and review material-grounded flashcards."},
        {"name": "llm", "description": "Health/status endpoint for the Ollama integration."},
    ],
    lifespan=lifespan,
)


class UnhandledErrorMiddleware(BaseHTTPMiddleware):
    # Sits inside CORS so even 500 responses carry CORS headers and never expose a stack trace.
    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception:
            logger.exception("Unhandled error on %s %s", request.method, request.url.path)
            return JSONResponse(status_code=500, content={"detail": "Something went wrong. Please try again."})


app.add_middleware(UnhandledErrorMiddleware)
app.add_middleware(CORSMiddleware, allow_origins=settings.allowed_origins,
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router)
app.include_router(questions.router)
app.include_router(materials.router)
app.include_router(quizzes.router)
app.include_router(llm.router)


@app.get("/health", summary="Liveness and dependency health (database, Ollama)")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        database = "ok"
    except SQLAlchemyError:
        database = "unavailable"
    llm_info = llm_status()
    llm_state = "ok" if llm_info["available"] and not breaker.is_open else "unavailable"
    body = {"status": "ok" if database == "ok" and llm_state == "ok" else "degraded",
            "database": database, "llm": llm_state}
    return JSONResponse(status_code=503 if database != "ok" else 200, content=body)
