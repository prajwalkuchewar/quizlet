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
| [.github/workflows/ci.yml](.github/workflows/ci.yml) | CI: backend tests, Docker builds, client build, and Docker Hub publishing.                               |
| [.env.example](.env.example)                         | Optional overrides for Docker Compose and production settings.                                           |

## Run the demo

The prebuilt images are on Docker Hub, so you only need Docker. You don't need the source code.

Requirements: Docker Desktop (or Docker Engine with Compose), about 8 GB of free disk space, and ports 80 and 8000 free.

```bash
curl -O https://raw.githubusercontent.com/prajwalkuchewar/quizlet/main/docker-compose.yml
docker compose up -d
```

Then open **http://localhost**, register an account, and try uploading a document or generating a quiz.

The first start downloads the images and the Ollama models (several GB). `docker compose ps` shows progress. The `ollama-models` service exits with code 0 when the models are ready, and chat and flashcard features need that.

To stop the demo: `docker compose down`. To also delete stored data: `docker compose down -v`.

Notes:
- The demo uses default passwords. Do not expose it to the internet. See [.env.example](.env.example) for production settings.
- Without a GPU, model responses are slow.

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

The compose file pulls prebuilt images from Docker Hub and runs the whole stack on one host. No setup is needed for a demo:

```bash
docker compose up -d
```

Then open `http://localhost`. The first start downloads the Ollama models (several GB), so the chat features work once `ollama-models` exits.

For anything beyond a local demo, copy `.env.example` to `.env` and set `POSTGRES_PASSWORD` and `JWT_SECRET_KEY` (32+ characters). The demo defaults are not safe for production.

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

4. **publish**: pushes `quizlet-backend` and `quizlet-client` images to Docker Hub, tagged with the commit SHA and `latest`.

Repository secrets needed: `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` (a Docker Hub access token). The optional variable `VITE_API_BASE` sets the API URL baked into the client build (default `http://localhost:8000`).

## Roadmap

- Move embedding search to pgvector once the corpus grows
- OCR for scanned PDFs
- Hosting on a VPS (not yet provisioned)

## License

No license has been chosen yet. All rights are reserved until one is added.
