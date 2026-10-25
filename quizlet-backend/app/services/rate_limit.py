"""In-process fixed-window rate limits, applied per route as FastAPI dependencies.

Counters live in this process, so run a single worker (the Dockerfile does) or move the store to Redis
before scaling out.
"""
import threading
import time
from collections import deque

from fastapi import Depends, HTTPException, Request

from app.models import User
from app.security import get_current_user

WINDOW_SECONDS = 60
_SWEEP_THRESHOLD = 10_000


class FixedWindowLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = {}
        self._lock = threading.Lock()

    def allow(self, key: str, limit: int) -> bool:
        now = time.monotonic()
        with self._lock:
            if len(self._hits) > _SWEEP_THRESHOLD:
                self._sweep(now)
            hits = self._hits.setdefault(key, deque())
            while hits and now - hits[0] >= WINDOW_SECONDS:
                hits.popleft()
            if len(hits) >= limit:
                return False
            hits.append(now)
            return True

    def _sweep(self, now: float) -> None:
        stale = [key for key, hits in self._hits.items() if not hits or now - hits[-1] >= WINDOW_SECONDS]
        for key in stale:
            del self._hits[key]


limiter = FixedWindowLimiter()


def _enforce(key: str, limit: int) -> None:
    if not limiter.allow(key, limit):
        raise HTTPException(status_code=429, detail="Too many requests. Please wait a minute and try again.",
                            headers={"Retry-After": str(WINDOW_SECONDS)})


def limit_by_ip(scope: str, per_minute: int):
    def dependency(request: Request) -> None:
        client = request.client.host if request.client else "unknown"
        _enforce(f"{scope}:ip:{client}", per_minute)
    return dependency


def limit_by_user(scope: str, per_minute: int):
    def dependency(user: User = Depends(get_current_user)) -> None:
        _enforce(f"{scope}:user:{user.id}", per_minute)
    return dependency
