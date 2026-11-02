# Zero-cost retrieval test protocol

Purpose: check that uploaded material is retrieved by meaning, not only by shared words, without spending any Groq or other API quota.

## What costs nothing and what does not

| Step | Uses API quota? | Why |
|---|---|---|
| Start the stack (`docker compose up`) | No | Local Postgres and local embedding model |
| Signup, login, upload | No | Upload only chunks and embeds locally |
| `app.retrieval_check` | No | Calls `search_materials` directly, with no LLM |
| `pytest` (default) | No | `EMBEDDING_PROVIDER=hash` is set in `tests/conftest.py` |
| `RUN_EMBEDDING_MODEL_TESTS=1` pytest | No | Local model only |

**Do not call** `POST /questions/materials/ask`, `/questions/...` generation routes, or any other route that calls Groq. `/ask` makes one LLM call per request after retrieval.

## Steps

Run all commands from the repository root in PowerShell.

### 1. Start the stack

```powershell
docker compose up -d --build
docker compose ps
```

Expected: `db` and `backend` are healthy and `web` is up.

```powershell
Invoke-RestMethod http://localhost:8000/health
```

Expected: `llm` may show `ok` (a config check, not a call). Ignore it for this protocol.

### 2. Create a test user (free)

```powershell
$signup = @{firstname='Proto';lastname='Test';username='protocoltest';password='ProtoTest123!'}
Invoke-RestMethod -Method Post -Uri http://localhost:8000/auth/signup -ContentType 'application/json' -Body ($signup | ConvertTo-Json)
```

Expected: a success response. A 409 means the user already exists, which is fine.

Use `Invoke-RestMethod` with `ConvertTo-Json`. Hand-written JSON passed to `curl.exe` loses its quotes in PowerShell.

### 3. Log in and upload the document (free, local embeddings)

```powershell
$login = Invoke-RestMethod -Method Post -Uri http://localhost:8000/auth/login -ContentType 'application/json' -Body (@{username='protocoltest';password='ProtoTest123!'} | ConvertTo-Json)
$token = $login.token
curl.exe -s -X POST http://localhost:8000/questions/materials/upload -H "Authorization: Bearer $token" -F "file=@quizlet-backend/demo_materials/photosynthesis.txt"
```

Expected: `{"id":...,"title":"photosynthesis.txt","filename":"photosynthesis.txt","chunkCount":1}`.

### 4. Copy the query file into the container

The query file lives on the host. The container only reads it from `/tmp`.

```powershell
docker compose cp quizlet-backend/tests/retrieval_queries.json backend:/tmp/cases.json
```

### 5. Run the retrieval check (free, no LLM)

```powershell
docker compose exec backend python -m app.retrieval_check protocoltest /tmp/cases.json
```

Expected output: one `PASS` line per query and a summary line.

```
PASS [direct] rank=1 scores=[0.7] :: Where does photosynthesis occur?
...
PASS [unrelated] rank=None scores=[0.08] :: Explain the French Revolution
Recall@1=1.00 Recall@3=1.00 MRR=1.000 over 10 scored queries
```

How to read it:

- `rank` is the position of the first chunk containing the `expect` phrase. A `PASS` needs rank 1 to 3.
- `scores` are cosine similarities from 0 to 1. Related queries scored about 0.35 to 0.72. The unrelated query scored 0.08.
- An unrelated query passes only when its best score stays below `UNRELATED_MAX_SCORE` (0.3, in `app/retrieval_check.py`).

Limitation: `photosynthesis.txt` is one chunk, so every rank is 1 by construction. The useful signals are the scores and the unrelated query. For a stricter ranking test, upload several documents, then re-run.

### 6. Run the offline unit tests (free)

`tests/` is not copied into the image, so run pytest on the host. Use a virtualenv with `quizlet-backend/requirements.txt` installed.

```powershell
cd quizlet-backend
python -m pytest tests -q
cd ..
```

Expected: the embedding determinism test passes. Known pre-existing failure: `test_material_ingestion_splits_overlapping_content` in `tests/test_material_generation_integration.py`. It was failing before the embedding changes and is not caused by them.

### 7. Optional: real-model paraphrase test (free, local model)

```powershell
cd quizlet-backend
$env:RUN_EMBEDDING_MODEL_TESTS = "1"
python -m pytest tests/test_embedding_service.py -q
Remove-Item Env:RUN_EMBEDDING_MODEL_TESTS
cd ..
```

Expected: the test passes. This runs on the host, so the first run downloads the model into the fastembed cache. Later runs reuse it.

### 8. Optional: clean up

The test user and its document stay in the database. To remove them, run this (database `quizlet`, user `quizlet`, from `docker-compose.yml`):

```powershell
docker compose exec db psql -U quizlet -d quizlet -c "DELETE FROM users WHERE username='protocoltest';"
```

Check the foreign-key cascade in the schema before relying on it. Materials owned by this user may remain.

## Pass criteria

- Steps 1 to 4 succeed.
- Step 5 shows `Recall@3=1.00` and every unrelated query passes.
- Step 6 has no new failures beyond the known one.
- No request in steps 1 to 7 hit `/ask`, `/questions/...` generation, or any Groq endpoint.

## Rebuilding after code changes

`app/` is copied into the image at build time. Step 4 copies only the query file. After any change to `app/`, run `docker compose up -d --build backend` before step 5.
