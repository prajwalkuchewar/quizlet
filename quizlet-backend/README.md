# Quizlet backend

FastAPI service for authentication, the quiz catalog, study materials, material-grounded chat, and flashcard generation. The system overview, full-stack setup, configuration, architecture, limitations, and API map are maintained in the [repository README](../README.md).

## Run locally

The backend runs as part of the Docker Compose stack from the repository root. See the [repository README](../README.md#local-setup). Once the stack is up, OpenAPI docs are at `http://localhost:8000/docs`.

Tables are created from SQLAlchemy metadata at startup. pgvector is enabled and the old JSON embedding column is upgraded at startup; this version has no Alembic migration history.

## Implementation notes

- Material text is split into overlapping chunks, embedded, and searched with PostgreSQL pgvector cosine distance.
- `app/services/llm_service.py` calls Groq's OpenAI-compatible chat-completions API, validates structured card/quiz output, and retries malformed responses.
- `app/services/llm_guard.py` provides process-local concurrency limiting, timeout coordination, disconnect cancellation, and a circuit breaker. `app/services/rate_limit.py` stores process-local counters.
- Materials, flashcard sets, and quiz attempts are persisted by authenticated user. Login/logout no longer deletes materials.
- Public signup currently accepts `role="ADMIN"`; do not expose this configuration for a public deployment without changing admin provisioning.

## Checks

```powershell
pip install -r requirements-dev.txt
python -m compileall -q app tests
python -m pytest -q tests
```
