from fastapi import HTTPException, Response

from app.core import security


def test_hash_password_and_verify_password():
    hashed = security.hash_password("correct-password")

    assert hashed != "correct-password"
    assert security.verify_password("correct-password", hashed) is True
    assert security.verify_password("wrong-password", hashed) is False


def test_verify_password_returns_false_for_invalid_hash():
    assert security.verify_password("password", "not-a-valid-bcrypt-hash") is False


def test_create_and_decode_access_token(monkeypatch):
    monkeypatch.setattr(security.settings, "SECRET_KEY", "unit-test-secret")
    monkeypatch.setattr(security.settings, "ALGORITHM", "HS256")

    token = security.create_access_token({"sub": "123"})
    payload = security.decode_token(token)

    assert payload["sub"] == "123"
    assert "exp" in payload


def test_decode_token_rejects_invalid_token(monkeypatch):
    monkeypatch.setattr(security.settings, "SECRET_KEY", "unit-test-secret")

    try:
        security.decode_token("invalid.token.value")
    except HTTPException as exc:
        assert exc.status_code == 401
    else:
        raise AssertionError("decode_token should reject invalid JWTs")


def test_set_and_delete_auth_cookie(monkeypatch):
    monkeypatch.setattr(security.settings, "ACCESS_TOKEN_EXPIRE_MINUTES", 30)
    monkeypatch.setenv("ENVIRONMENT", "development")
    response = Response()

    security.set_auth_cookie(response, "jwt-token")
    cookie_header = response.headers["set-cookie"]

    assert "automart_token=jwt-token" in cookie_header
    assert "HttpOnly" in cookie_header
    assert "Max-Age=1800" in cookie_header
    assert "Secure" not in cookie_header

    response = Response()
    security.delete_auth_cookie(response)
    assert "automart_token=" in response.headers["set-cookie"]
