import asyncio
import time

import pytest
from fastapi import HTTPException

from app.services import llm_guard
from app.services.llm_guard import CircuitBreaker, run_llm_call
from app.services.rate_limit import FixedWindowLimiter


class FakeRequest:
    def __init__(self, disconnect_after_checks: int | None = None) -> None:
        self._checks = 0
        self._disconnect_after = disconnect_after_checks

    async def is_disconnected(self) -> bool:
        self._checks += 1
        return self._disconnect_after is not None and self._checks > self._disconnect_after


def test_circuit_breaker_opens_after_threshold_and_recovers():
    breaker = CircuitBreaker(failure_threshold=2, reset_seconds=0.05)
    breaker.record_failure()
    assert breaker.allow()
    breaker.record_failure()
    assert not breaker.allow()
    assert breaker.is_open
    time.sleep(0.06)
    assert breaker.allow()
    breaker.record_success()
    assert not breaker.is_open


def test_run_llm_call_returns_result(monkeypatch):
    monkeypatch.setattr(llm_guard, "breaker", CircuitBreaker(3, 60))

    async def call():
        return "answer"

    assert asyncio.run(run_llm_call(FakeRequest(), call)) == "answer"


def test_run_llm_call_cancels_upstream_when_client_disconnects(monkeypatch):
    monkeypatch.setattr(llm_guard, "breaker", CircuitBreaker(3, 60))
    state = {"cancelled": False}

    async def slow_call():
        try:
            await asyncio.sleep(30)
        except asyncio.CancelledError:
            state["cancelled"] = True
            raise

    async def scenario():
        with pytest.raises(HTTPException) as info:
            await run_llm_call(FakeRequest(disconnect_after_checks=1), slow_call)
        return info.value.status_code

    assert asyncio.run(scenario()) == 499
    assert state["cancelled"]


def test_repeated_llm_failures_trip_the_breaker(monkeypatch):
    monkeypatch.setattr(llm_guard, "breaker", CircuitBreaker(2, 60))
    calls = {"count": 0}

    async def failing_call():
        calls["count"] += 1
        raise HTTPException(status_code=503, detail="LLM service unavailable")

    async def scenario():
        for _ in range(2):
            with pytest.raises(HTTPException):
                await run_llm_call(FakeRequest(), failing_call)
        with pytest.raises(HTTPException) as info:
            await run_llm_call(FakeRequest(), failing_call)
        return info.value.status_code

    assert asyncio.run(scenario()) == 503
    assert calls["count"] == 2  # the open breaker rejects the third call without contacting Ollama


def test_fixed_window_limiter_blocks_over_limit_and_isolates_keys():
    limiter = FixedWindowLimiter()
    assert all(limiter.allow("ask:user:1", 3) for _ in range(3))
    assert not limiter.allow("ask:user:1", 3)
    assert limiter.allow("ask:user:2", 3)
