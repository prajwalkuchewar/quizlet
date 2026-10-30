# FastAPI backend

This backend is a single FastAPI application with `/auth`, `/questions`, `/quiz`, and `/llm` routes and camelCase JSON fields, matching the React client.

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

OpenAPI docs are at `http://localhost:8000/docs`. PostgreSQL is required. Set `DATABASE_URL` to a URL such as `postgresql+psycopg://postgres:postgres@localhost:5432/quizlet`. Tables are created on startup. `JWT_SECRET_KEY` is required and must be at least 32 characters; the app refuses to start without it.

## LLM and study materials

The LLM integration is an in-process Python module that calls the Groq API (OpenAI-compatible). Set `GROQ_API_KEY` in `.env`; `LLM_CHAT_MODEL` defaults to `openai/gpt-oss-20b` and `LLM_BASE_URL` to `https://api.groq.com/openai/v1`. `/llm/status` reports whether the provider can be reached. Material retrieval uses in-process BM25 keyword ranking, since Groq has no embeddings endpoint.

## Material-to-flashcard workflow

All endpoints below use a bearer token from `/auth/login`. Materials, generated sets, and quiz attempts belong to the authenticated user.

1. Add text with `POST /questions/materials/text`, or upload PDF/TXT/Markdown with `POST /questions/materials/upload`. The API chunks the content and stores the chunks in the configured database for keyword search.
2. Ask questions about your materials with `POST /questions/materials/ask`. It retrieves the most relevant passages, has the model answer in conversation, and returns `{answer, sources}`. If nothing relevant is found, it returns a fallback answer with no sources.
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

- Any logged-in user can take quizzes (`GET /quiz`, `GET /quiz/{id}`, `POST /quiz/{id}/attempts`), read their own attempts, and use materials and flashcards.
- `/questions` (question bank CRUD) and `POST /quiz/create` require an `ADMIN` bearer token.

For safety, do not allow public signup to grant `ADMIN` in a production deployment; create administrators through a controlled bootstrap process.

## Routes

- Auth: `POST /auth/signup`, `POST /auth/login`; `GET /auth/me`
- Question bank (admin): CRUD on `/questions`
- Materials (user-owned): `POST /questions/materials/text`, `POST /questions/materials/upload`, `GET /questions/materials`, `DELETE /questions/materials/{id}`, `POST /questions/materials/ask`
- Health: `GET /health` (checks the database and the LLM; returns 503 only when the database is down)

## Production safeguards

- Rate limits per minute (set in `.env`): login 10 and signup 5 per IP; uploads 10, `/ask` and flashcard generation 20 per user. Responses over the limit return HTTP 429 with `Retry-After`. Counters are in process memory, so run one worker.
- LLM calls run through a concurrency limit (`LLM_MAX_CONCURRENCY`, default 1), a request timeout (`LLM_REQUEST_TIMEOUT_SECONDS`), and a circuit breaker. After repeated LLM failures the breaker opens and calls return 503 until `LLM_CIRCUIT_RESET_SECONDS` passes.
- If a client disconnects during generation, the backend cancels the Groq request so the model stops generating.
- Unhandled errors return a generic JSON 500 without a stack trace; details go to the server log.
- Quizzes: `GET /quiz`, `GET /quiz/{id}`, `POST /quiz/{id}/attempts` (scores on the server and saves the attempt), `GET /quiz/attempts` (your history, newest first), `POST /quiz/create` (admin)
- Flashcards (user-owned): `POST /quiz/flashcards/generate`, `GET /quiz/flashcards`, `GET /quiz/flashcards/{id}`, `POST /quiz/flashcards/{id}/review`, `GET /quiz/flashcards/{id}/progress`
- LLM: `GET /llm/status`
