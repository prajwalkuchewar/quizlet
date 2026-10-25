import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from jose import jwt

from app.config import settings
from app.security import ALGORITHM, create_token, get_current_session_id


def credentials(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


def test_token_carries_session_id_for_each_login():
    first = jwt.decode(create_token("alice", "session-a"), settings.jwt_secret_key, algorithms=[ALGORITHM])
    second = jwt.decode(create_token("alice", "session-b"), settings.jwt_secret_key, algorithms=[ALGORITHM])
    assert first["sid"] == "session-a"
    assert second["sid"] == "session-b"


def test_session_id_is_read_from_token():
    assert get_current_session_id(credentials(create_token("alice", "session-a"))) == "session-a"


def test_token_without_session_id_is_rejected():
    legacy = jwt.encode({"sub": "alice", "exp": 4102444800}, settings.jwt_secret_key, algorithm=ALGORITHM)
    with pytest.raises(HTTPException) as info:
        get_current_session_id(credentials(legacy))
    assert info.value.status_code == 401


def test_missing_token_is_rejected():
    with pytest.raises(HTTPException) as info:
        get_current_session_id(None)
    assert info.value.status_code == 401
