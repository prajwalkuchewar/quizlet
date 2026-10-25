# Quizlet

An AI-assisted study app. Upload your notes, ask questions about them, generate flashcard sets and quizzes, and track your progress. Local models run through [Ollama](https://ollama.com), so your study materials stay on your own machine.

## Features

- **Study materials**: add text or upload PDF, TXT, or Markdown files. Content is chunked and embedded for search.
- **Ask your notes**: questions are answered from the most relevant passages, with sources returned. If nothing relevant is found, you get a fallback answer.
- **Flashcards**: generate saved sets from your materials, review them, and track recall.
- **Quizzes**: take quizzes, get scores saved server-side, and review your attempt history. Admins can create quizzes.
- **Accounts**: JWT-based signup and login. Your materials, sets, and attempts are private to you.
- **Production safeguards**: per-IP and per-user rate limits, LLM concurrency limits, timeouts, a circuit breaker, and generic error responses.

## Architecture

```
┌────────────────────┐      ┌────────────────────┐      ┌────────────────────┐
│  quizlet-client    │ ───► │  quizlet-backend   │ ───► │  PostgreSQL        │
│  React + Vite + TS │      │  FastAPI           │      │  users, materials, │
│  (served by nginx) │      │  auth, RAG, quizzes│      │  sets, attempts    │
└────────────────────┘      └─────────┬──────────┘      └────────────────────┘
                                      │
                                      ▼
                            ┌────────────────────┐
                            │  Ollama            │
                            │  chat + embeddings │
                            └────────────────────┘
```

## Repository layout

| Path                                                 | Purpose                                                                                                  |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [quizlet-backend/](quizlet-backend/)                 | FastAPI application, tests, and Dockerfile. See its [README](quizlet-backend/README.md) for API details. |
| [quizlet-client/](quizlet-client/)                   | React, Vite, and TypeScript single-page app, plus its Dockerfile and nginx config.                       |
| [docker-compose.yml](docker-compose.yml)             | Runs the full stack: PostgreSQL, Ollama, model download, backend, and web client.                        |
| [.github/workflows/ci.yml](.github/workflows/ci.yml) | CI: backend tests, Docker builds, client build, image publishing, and deployment.                        |
| [.env.example](.env.example)                         | Deployment environment template.                                                                         |

## Getting started

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16 (or Docker)
- [Ollama](https://ollama.com) with the models below

### 1. Pull the local models

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

### 2. Run the backend

```bash
cd quizlet-backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env             # set DATABASE_URL and JWT_SECRET_KEY (32+ chars)
uvicorn app.main:app --reload
```

API docs are at `http://localhost:8000/docs`. Tables are created on startup.

### 3. Run the client

```bash
cd quizlet-client
npm ci
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Running with Docker Compose

The compose file runs the whole stack on one host.

```bash
cp .env.example .env
# Fill in POSTGRES_PASSWORD, JWT_SECRET_KEY, and GHCR_OWNER
docker compose up -d
```

| Service         | Port     | Notes                                       |
| --------------- | -------- | ------------------------------------------- |
| `web`           | 80       | React client served by nginx                |
| `backend`       | 8000     | FastAPI API                                 |
| `db`            | internal | PostgreSQL 16 with a persistent volume      |
| `ollama`        | internal | Model runtime with a persistent volume      |
| `ollama-models` | none     | One-shot job that pulls the required models |

## Configuration

Backend settings are read from `quizlet-backend/.env`. See [.env.example](quizlet-backend/.env.example) for the full list. The most important ones:

| Variable                                 | Purpose                                                   |
| ---------------------------------------- | --------------------------------------------------------- |
| `DATABASE_URL`                           | PostgreSQL connection string                              |
| `JWT_SECRET_KEY`                         | Signing key for tokens. Required, at least 32 characters. |
| `LLM_BASE_URL`                           | Ollama address, default `http://localhost:11434`          |
| `LLM_CHAT_MODEL` / `LLM_EMBEDDING_MODEL` | Model names, default `llama3.2` / `nomic-embed-text`      |
| `LLM_MAX_CONCURRENCY`                    | Concurrent LLM calls, default `1`                         |
| `CORS_ORIGINS`                           | Comma-separated client origins                            |

The deployment template is [.env.example](.env.example).

## Testing and checks

```bash
# Backend
cd quizlet-backend
python -m compileall -q app tests
python -m pytest -q tests

# Client
cd quizlet-client
npm run build
```

CI runs these checks on every push and pull request.

## CI/CD

On every push and pull request:

1. **backend**: installs dependencies, compiles, and runs pytest.
2. **backend-docker**: builds the backend image.
3. **client**: runs `npm ci` and `npm run build`.

On pushes to `main`, after those pass:

4. **publish**: pushes `quizlet-backend` and `quizlet-client` images to GitHub Container Registry, tagged with the commit SHA and `latest`.
5. **deploy**: copies `docker-compose.yml` to the server over SSH, then pulls the images and restarts the stack.

The deploy job needs these repository secrets and variables: `VPS_HOST`, `VPS_USER`, `VPS_DEPLOY_DIR`, and `VPS_SSH_KEY` (secrets), plus `VITE_API_BASE` (variable, the public API URL baked into the client build). The `production` environment must exist.

## Roadmap

- Move embedding search to pgvector once the corpus grows
- OCR for scanned PDFs
- Hosting on a VPS (not yet provisioned)

## License

No license has been chosen yet. All rights are reserved until one is added.
