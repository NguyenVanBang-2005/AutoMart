import hashlib
import base64
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/users/login")
oauth2_scheme_optional = OAuth2PasswordBearer(
    tokenUrl="/api/v1/users/login",
    auto_error=False
)

COOKIE_NAME = "automart_token"


def _prepare_password(password: str) -> bytes:
    hashed = hashlib.sha256(password.encode()).digest()
    return base64.b64encode(hashed)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        _prepare_password(password),
        bcrypt.gensalt()
    ).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(
        _prepare_password(plain),
        hashed.encode()
    )


def create_access_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.utcnow() + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload.update({"exp": expire})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ hoặc đã hết hạn",
        )


def set_auth_cookie(response: Response, token: str):
    """Gắn token vào httpOnly cookie"""
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,       # JS không đọc được
        secure=False,        # True khi dùng HTTPS production
        samesite="lax",      # chống CSRF
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )


def delete_auth_cookie(response: Response):
    """Xóa cookie khi logout"""
    response.delete_cookie(key=COOKIE_NAME, path="/")


def get_token_from_cookie(request: Request) -> Optional[str]:
    """Lấy token từ cookie"""
    return request.cookies.get(COOKIE_NAME)


def get_current_user_from_cookie(request: Request, session):
    """Dùng cho Jinja2 routes — đọc cookie server side"""
    token = get_token_from_cookie(request)
    if not token:
        return None
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
        from app.services.user_service import find_user_by_id
        return find_user_by_id(session, int(user_id))
    except Exception:
        return None