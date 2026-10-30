"""Groq client (OpenAI-compatible API) for chat answers and structured flashcard generation."""
import json
import re

import httpx
from fastapi import HTTPException

from app.config import settings
from app.services.llm_guard import breaker


def _base_url() -> str:
    return settings.llm_base_url.rstrip("/")


def _headers() -> dict[str, str]:
    if not settings.groq_api_key:
        raise HTTPException(status_code=503, detail="LLM service unavailable: GROQ_API_KEY is not configured")
    return {"Authorization": f"Bearer {settings.groq_api_key}"}


def status() -> dict:
    details = {"baseUrl": settings.llm_base_url, "chatModel": settings.llm_chat_model,
               "circuitOpen": breaker.is_open}
    if not settings.groq_api_key:
        return {"available": False, **details}
    try:
        response = httpx.get(f"{_base_url()}/models", headers=_headers(), timeout=5)
        response.raise_for_status()
        return {"available": True, **details}
    except httpx.HTTPError:
        return {"available": False, **details}


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


async def answer_from_material_async(question: str, context: str) -> str:
    messages = [
        {"role": "system", "content": (
            "You are a friendly study assistant. Answer the learner's question in a conversational, "
            "natural tone, using only the supplied study excerpts. Mention the source document titles "
            "naturally when helpful. If the excerpts don't contain the answer, say so plainly and do not guess."
        )},
        {"role": "user", "content": f"Question: {question}\n\nStudy excerpts:\n{context[:24000]}"},
    ]
    try:
        async with httpx.AsyncClient(timeout=settings.llm_request_timeout_seconds) as client:
            response = await client.post(f"{_base_url()}/chat/completions", headers=_headers(), json={
                "model": settings.llm_chat_model, "messages": messages, "max_tokens": 400,
            })
            response.raise_for_status()
            content = (response.json()["choices"][0]["message"].get("content") or "").strip()
    except (httpx.HTTPError, ValueError, KeyError, IndexError) as exc:
        detail = f"{type(exc).__name__}: {exc}" if str(exc) else type(exc).__name__
        raise HTTPException(status_code=503, detail=f"LLM service unavailable: {detail}") from exc
    if not content:
        raise HTTPException(status_code=502, detail="LLM returned an empty answer")
    return content


async def generate_flashcards_async(prompt: str, context: str, count: int, difficulty: str) -> list[dict[str, str]]:
    # Streamed on an async client: cancelling this task closes the connection, and Groq stops generating.
    messages = _flashcard_messages(prompt, context, count, difficulty)
    parts: list[str] = []
    try:
        async with httpx.AsyncClient(timeout=settings.llm_request_timeout_seconds) as client:
            async with client.stream("POST", f"{_base_url()}/chat/completions", headers=_headers(), json={
                "model": settings.llm_chat_model, "stream": True, "messages": messages,
                "response_format": {"type": "json_object"},
            }) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    data = line[5:].strip()
                    if data == "[DONE]":
                        break
                    choices = json.loads(data).get("choices") or [{}]
                    parts.append(choices[0].get("delta", {}).get("content") or "")
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=503, detail=f"LLM service unavailable: {exc}") from exc
    return _parse_flashcards("".join(parts), count)


QUIZ_TYPES = {"multiple_choice", "true_false", "short_answer"}


def quiz_question_count(query: str) -> int | None:
    """Return the requested number of quiz questions, or None if the query isn't a quiz request."""
    text = query.lower()
    if not re.search(r"\bquiz(?:zes)?\b|\btest me\b|\b(?:create|make|generate|write)\b.*\bquestions?\b", text):
        return None
    requested = re.search(r"\b(\d{1,2})\s*(?:questions?|qs?)\b", text)
    return min(max(int(requested.group(1)), 1), 10) if requested else 3


async def _complete_json_async(messages: list[dict[str, str]]) -> str:
    try:
        async with httpx.AsyncClient(timeout=settings.llm_request_timeout_seconds) as client:
            response = await client.post(f"{_base_url()}/chat/completions", headers=_headers(), json={
                "model": settings.llm_chat_model, "messages": messages,
                "response_format": {"type": "json_object"},
            })
            response.raise_for_status()
            return (response.json()["choices"][0]["message"].get("content") or "").strip()
    except (httpx.HTTPError, ValueError, KeyError, IndexError) as exc:
        raise HTTPException(status_code=503, detail=f"LLM service unavailable: {exc}") from exc


def _parse_quiz(raw: str, count: int) -> list[dict[str, object]]:
    try:
        parsed = json.loads(re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.IGNORECASE))
        items = parsed.get("questions") if isinstance(parsed, dict) else None
        if not isinstance(items, list):
            raise ValueError("missing questions array")
        clean: list[dict[str, object]] = []
        for item in items:
            if not isinstance(item, dict):
                continue
            kind = str(item.get("type") or "").strip().lower()
            question = str(item.get("question") or "").strip()
            answer = str(item.get("answer") or "").strip()
            if kind not in QUIZ_TYPES or not question or not answer:
                continue
            if kind == "true_false":
                options = ["True", "False"]
            elif kind == "multiple_choice":
                options = [str(option).strip() for option in item.get("options") or [] if str(option).strip()]
            else:
                options = []
            if kind != "short_answer":
                # Multiple-choice and true/false answers must match one of the options (case-insensitive).
                match = next((option for option in options if option.lower() == answer.lower()), None)
                if match is None:
                    continue
                answer = match
            clean.append({"type": kind, "question": question, "options": options, "answer": answer,
                          "explanation": str(item.get("explanation") or "").strip()})
        if not clean:
            raise ValueError("no usable questions returned")
        return clean[:count]
    except (ValueError, TypeError, AttributeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=502, detail="LLM returned invalid quiz JSON") from exc


async def generate_quiz_async(context: str, count: int) -> list[dict[str, object]]:
    instruction = (
        "Create a quiz grounded only in the supplied study material. Do not invent facts. "
        f"Return a JSON object with a `questions` array of exactly {count} items, mixing question types. "
        "Each item has: `type` (one of multiple_choice, true_false, short_answer); `question`; "
        "`options` (4 strings for multiple_choice, [\"True\", \"False\"] for true_false, [] for short_answer); "
        "`answer` (for multiple_choice and true_false it must exactly match one option; for short_answer a concise model answer); "
        "and `explanation` (one sentence)."
    )
    messages = [
        {"role": "system", "content": instruction},
        {"role": "user", "content": f"Study material:\n{context[:24000]}"},
    ]
    return _parse_quiz(await _complete_json_async(messages), count)

