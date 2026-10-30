"""Failsafes around LLM calls: concurrency limit, circuit breaker, deadline, and disconnect cancellation.

The semaphore keeps requests from piling up and from exceeding provider rate limits.
Cancelling the task closes the HTTP connection, which stops generation for a client that
has already gone away.
"""
import asyncio
import logging
import time
from collections.abc import Awaitable, Callable

from fastapi import HTTPException, Request

from app.config import settings

logger = logging.getLogger(__name__)

BUSY_MESSAGE = "The language model is busy or unavailable right now. Please try again in a moment."
_slots = asyncio.Semaphore(settings.llm_max_concurrency)


class CircuitBreaker:
    def __init__(self, failure_threshold: int, reset_seconds: float) -> None:
        self._threshold = failure_threshold
        self._reset_seconds = reset_seconds
        self._failures = 0
        self._opened_at: float | None = None

    def allow(self) -> bool:
        # After the reset window, calls are allowed again; one more failure reopens the breaker immediately.
        return self._opened_at is None or time.monotonic() - self._opened_at >= self._reset_seconds

    def record_success(self) -> None:
        self._failures = 0
        self._opened_at = None

    def record_failure(self) -> None:
        self._failures += 1
        if self._failures >= self._threshold:
            self._opened_at = time.monotonic()

    @property
    def is_open(self) -> bool:
        return not self.allow()


breaker = CircuitBreaker(settings.llm_circuit_failure_threshold, settings.llm_circuit_reset_seconds)


def ensure_available() -> None:
    if not breaker.allow():
        raise HTTPException(status_code=503, detail=BUSY_MESSAGE)


async def _guarded(make_call: Callable[[], Awaitable]):
    async with _slots:
        try:
            result = await make_call()
        except HTTPException as exc:
            if exc.status_code == 503:
                breaker.record_failure()
            raise
        breaker.record_success()
        return result


async def run_llm_call(request: Request, make_call: Callable[[], Awaitable]):
    ensure_available()
    task = asyncio.ensure_future(_guarded(make_call))
    # Allow the request timeout plus time spent waiting for a slot, then give up.
    deadline = time.monotonic() + settings.llm_request_timeout_seconds + 30
    try:
        while True:
            done, _ = await asyncio.wait({task}, timeout=0.5)
            if done:
                return task.result()
            if await request.is_disconnected():
                logger.info("Client disconnected; cancelling the LLM call")
                raise HTTPException(status_code=499, detail="Client disconnected; generation stopped")
            if time.monotonic() > deadline:
                raise HTTPException(status_code=504, detail="The language model took too long. Please try again.")
    finally:
        if not task.done():
            task.cancel()
            await asyncio.gather(task, return_exceptions=True)
