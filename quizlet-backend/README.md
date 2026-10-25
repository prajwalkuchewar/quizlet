# FastAPI backend

This backend consolidates the Spring auth, question, and quiz services into one FastAPI application. It keeps the existing `/auth`, `/questions`, and `/quiz` routes and the camelCase request/response fields used by the Java services.

## Run locally

```powershell
cd quizlet-backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# Set JWT_SECRET_KEY to a stable random secret before using real accounts.
uvicorn app.main:app --reload
```

OpenAPI docs are at `http://localhost:8000/docs`. PostgreSQL is required. Set `DATABASE_URL` to a URL such as `postgresql+psycopg://postgres:postgres@localhost:5432/quizlet`. Tables are created on startup; production schema changes should use Alembic migrations.

## LLM and study materials

The LLM integration is an in-process Python module that calls a local Ollama server. Install Ollama, then download the configured models:

```powershell
ollama pull llama3.2
ollama pull nomic-embed-text
```

Keep Ollama running at `http://localhost:11434` (or set `LLM_BASE_URL`, `LLM_CHAT_MODEL`, and `LLM_EMBEDDING_MODEL` in `.env`). `/llm/status` reports whether the provider can be reached. The API and its service modules still run as one FastAPI process; Ollama supplies the local model runtime.

## Material-to-flashcard workflow

All endpoints below use a bearer token from `/auth/login`. Materials, generated sets, and quiz attempts belong to the authenticated user.

1. Add text with `POST /questions/materials/text`, or upload PDF/TXT/Markdown with `POST /questions/materials/upload`. The API chunks the content and stores Ollama embeddings in the configured database.
2. Optionally find relevant passages with `POST /questions/materials/search` using a natural language query and material IDs.
3. Generate a saved flashcard set with `POST /quiz/flashcards/generate`, providing a learning prompt, material IDs, count, and difficulty. `GET /quiz/flashcards` lists your sets, `GET /quiz/flashcards/{set_id}` retrieves one, `POST /quiz/flashcards/{set_id}/review` records recall results, and `GET /quiz/flashcards/{set_id}/progress` summarizes recall.

Example text ingestion body:

```json
{"title":"Cell biology notes","content":"Mitochondria generate most of the cell's ATP through cellular respiration..."}
```

Example generation body (replace `materialIds` with the ID returned by ingestion):

```json
{"prompt":"Focus on organelles and their functions","materialIds":[1],"count":12,"difficulty":"beginner","title":"Cell biology review"}
```

The initial vector index stores embeddings as JSON and ranks them with cosine similarity in Python. This keeps the first version simple; for a large corpus, migrate the embedding column and search to pgvector. PDF ingestion extracts selectable text and does not perform OCR on scanned pages.

## Authentication and access

`POST /auth/signup` accepts `firstname`, `lastname`, `username`, `password`, and optional `role` (`USER` by default). `POST /auth/login` returns a bearer token. Auth routes are public.

- Any logged-in user can take quizzes (`GET /quiz`, `GET /quiz/{id}`, `POST /quiz/submit`, `POST /quiz/{id}/attempts`), read their own attempts, and use materials and flashcards.
- `/questions` (question bank CRUD, generation, retrieval, and scoring) and `POST /quiz/create` require an `ADMIN` bearer token.

For safety, do not allow public signup to grant `ADMIN` in a production deployment; create administrators through a controlled bootstrap process.

## Routes

- Auth: `POST /auth/signup`, `POST /auth/login`, `POST /auth/validate`; `GET /auth/me`
- Question bank (admin): CRUD on `/questions`, `GET /questions/category/{category}`, `GET /questions/generate?category=...&numQ=...`, `POST /questions/retrieve`, `POST /questions/score`
- Materials (user-owned): `POST /questions/materials/text`, `POST /questions/materials/upload`, `GET /questions/materials`, `DELETE /questions/materials/{id}`, `POST /questions/materials/search`
- Quizzes: `GET /quiz`, `GET /quiz/{id}`, `POST /quiz/submit`, `POST /quiz/{id}/attempts` (scores on the server and saves the attempt), `GET /quiz/attempts` (your history, newest first), `POST /quiz/create` (admin)
- Flashcards (user-owned): `POST /quiz/flashcards/generate`, `GET /quiz/flashcards`, `GET /quiz/flashcards/{id}`, `POST /quiz/flashcards/{id}/review`, `GET /quiz/flashcards/{id}/progress`
- LLM: `GET /llm/status`

## Data migration

The Java app stores users, questions, and quizzes in three separate PostgreSQL databases. The migration script reads those databases and imports users, questions, quizzes, and quiz-question links into the unified target schema while preserving IDs and BCrypt password hashes. It can be run repeatedly; matching IDs are updated and quiz links are replaced.

1. Start the existing Compose databases and install the backend requirements.
2. Copy `.env.example` to `.env`, set a stable `JWT_SECRET_KEY`, and set `DATABASE_URL` to the destination database.
3. From this directory, run `python -m scripts.migrate_data` to inspect source counts without writing.
4. After reviewing the dry-run output and backing up the destination, run `python -m scripts.migrate_data --apply` to import.

The source connection variables default to the ports and credentials in the repository's `docker-compose.yml`. Override `AUTH_SOURCE_URL`, `QUESTION_SOURCE_URL`, or `QUIZ_SOURCE_URL` when using different databases. The importer only reads from the sources; `--apply` writes to the configured `DATABASE_URL`. Existing JWTs will need to be issued again because the old Java service generated its signing secret at startup.

The importer expects the Java tables `users`, `question` (or `questions`), `quiz` (or `quizzes`), and the Hibernate collection table `quiz_question_ids` (or `quiz_questions`). It validates the source records and quiz links before writing. If your Hibernate naming strategy produced different table or collection-column names, adjust the candidate names in `scripts/migrate_data.py` to match the source schema before applying.

Use the importer above (`scripts/migrate_data.py`) for any data migration.
