"""Local Ollama client for embeddings and structured flashcard generation."""
import json
import math
import re

import httpx
from fastapi import HTTPException

from app.config import settings


def _post(path: str, payload: dict) -> dict:
    try:
        response = httpx.post(f"{settings.llm_base_url.rstrip('/')}{path}", json=payload, timeout=180)
        response.raise_for_status()
        return response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=503, detail=f"LLM service unavailable: {exc}") from exc


def status() -> dict:
    try:
        response = httpx.get(f"{settings.llm_base_url.rstrip('/')}/api/tags", timeout=5)
        response.raise_for_status()
        return {"available": True, "baseUrl": settings.llm_base_url,
                "chatModel": settings.llm_chat_model, "embeddingModel": settings.llm_embedding_model}
    except httpx.HTTPError:
        return {"available": False, "baseUrl": settings.llm_base_url,
                "chatModel": settings.llm_chat_model, "embeddingModel": settings.llm_embedding_model}


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    payload = _post("/api/embed", {"model": settings.llm_embedding_model, "input": texts})
    embeddings = payload.get("embeddings")
    if not isinstance(embeddings, list) or len(embeddings) != len(texts):
        raise HTTPException(status_code=502, detail="Embedding service returned an unexpected response")
    return embeddings


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if len(left) != len(right):
        return 0.0
    denominator = math.sqrt(sum(x * x for x in left) * sum(y * y for y in right))
    return sum(x * y for x, y in zip(left, right)) / denominator if denominator else 0.0


def _flashcard_messages(prompt: str, context: str, count: int, difficulty: str) -> list[dict[str, str]]:
    instruction = (
        "Create study flashcards grounded only in the supplied study material. "
        "Do not invent facts. Return a JSON object with a `cards` array; each card must have "
        "a concise `front` question and a clear `back` answer. Avoid duplicate cards."
    )
    user_content = (
        f"Learner request: {prompt}\nDifficulty: {difficulty}\nCreate exactly {count} cards.\n\n"
        f"Study material:\n{context[:24000]}"
    )
    return [{"role": "system", "content": instruction}, {"role": "user", "content": user_content}]


def _parse_flashcards(raw: str, count: int) -> list[dict[str, str]]:
    try:
        parsed = json.loads(re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.IGNORECASE))
        cards = parsed.get("cards") if isinstance(parsed, dict) else None
        if not isinstance(cards, list):
            raise ValueError("missing cards array")
        clean = [{"front": str(card["front"]).strip(), "back": str(card["back"]).strip()}
                 for card in cards if isinstance(card, dict) and card.get("front") and card.get("back")]
        if not clean:
            raise ValueError("no usable cards returned")
        return clean[:count]
    except (ValueError, TypeError, KeyError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=502, detail="LLM returned invalid flashcard JSON") from exc


async def generate_flashcards_async(prompt: str, context: str, count: int, difficulty: str) -> list[dict[str, str]]:
    # Streamed on an async client: cancelling this task closes the connection, and Ollama stops generating.
    messages = _flashcard_messages(prompt, context, count, difficulty)
    parts: list[str] = []
    try:
        async with httpx.AsyncClient(timeout=180) as client:
            async with client.stream("POST", f"{settings.llm_base_url.rstrip('/')}/api/chat", json={
                "model": settings.llm_chat_model, "stream": True, "format": "json", "messages": messages,
            }) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.strip():
                        parts.append(json.loads(line).get("message", {}).get("content", ""))
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=503, detail=f"LLM service unavailable: {exc}") from exc
    return _parse_flashcards("".join(parts), count)
