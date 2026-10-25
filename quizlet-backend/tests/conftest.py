import os

# Set before the app is imported. Database-backed tests run only when TEST_DATABASE_URL is provided,
# so the tests never touch the application database by default.
os.environ.setdefault("JWT_SECRET_KEY", "test-only-secret-key-that-is-long-enough-for-hs256")
os.environ.setdefault("DATABASE_URL", os.environ.get("TEST_DATABASE_URL", "postgresql+psycopg://test:test@127.0.0.1:1/test"))

import pytest  # noqa: E402

from app.services import rate_limit  # noqa: E402

requires_db = pytest.mark.skipif(
    "TEST_DATABASE_URL" not in os.environ, reason="set TEST_DATABASE_URL to run database-backed tests")


@pytest.fixture(autouse=True)
def fresh_rate_limiter(monkeypatch):
    monkeypatch.setattr(rate_limit, "limiter", rate_limit.FixedWindowLimiter())
