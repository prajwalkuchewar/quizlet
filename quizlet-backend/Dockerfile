FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    EMBEDDING_CACHE_DIR=/opt/embedding-models

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

RUN useradd --create-home appuser \
    && mkdir -p "$EMBEDDING_CACHE_DIR" \
    && chown appuser "$EMBEDDING_CACHE_DIR"
USER appuser

# Bake the embedding model into the image (owned by appuser) so containers never download it at runtime.
RUN python -c "import os; from fastembed import TextEmbedding; TextEmbedding('sentence-transformers/all-MiniLM-L6-v2', cache_dir=os.environ['EMBEDDING_CACHE_DIR'])"

COPY app ./app

EXPOSE 8000

# Single worker: rate-limit counters and the LLM circuit breaker live in process memory.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:'+__import__('os').environ.get('PORT','8000')+'/health', timeout=4).status==200 else 1)"

CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
