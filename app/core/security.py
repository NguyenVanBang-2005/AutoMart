import hashlib
import base64
import bcrypt
import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session
from app.core.config import settings
from app.models.user import UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/users/login")
oauth2_scheme_optional = OAuth2PasswordBearer(
    tokenUrl="/api/v1/users/login",
    auto_error=False
)

COOKIE_NAME = "automart_token"


# ── Password ──────────────────────────────────────────
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


# ── JWT ───────────────────────────────────────────────
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


# ── Cookie ────────────────────────────────────────────
def set_auth_cookie(response: Response, token: str):
    is_production = os.getenv("ENVIRONMENT", "development") == "production"
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )


def delete_auth_cookie(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/")


def get_token_from_cookie(request: Request) -> Optional[str]:
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


# ── Auth dependencies ─────────────────────────────────
# Import ở đây an toàn vì database.py không import security.py
from app.core.database import get_session


def get_current_user_required(
    request: Request,
    session: Session = Depends(get_session)  # ← truyền function, không gọi ()
):
    user = get_current_user_from_cookie(request, session)
    if not user:
        raise HTTPException(status_code=401, detail="Chưa đăng nhập")
    return user


def require_staff(
    request: Request,
    session: Session = Depends(get_session)  # ← truyền function, không gọi ()
):
    user = get_current_user_from_cookie(request, session)
    if not user:
        raise HTTPException(status_code=401, detail="Chưa đăng nhập")
    if user.role not in (UserRole.staff, UserRole.admin):
        raise HTTPException(status_code=403, detail="Yêu cầu quyền Staff")
    return user


def require_admin(
    request: Request,
    session: Session = Depends(get_session)  # ← truyền function, không gọi ()
):
    user = get_current_user_from_cookie(request, session)
    if not user:
        raise HTTPException(status_code=401, detail="Chưa đăng nhập")
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Yêu cầu quyền Admin")
    return user


def require_role(*roles: UserRole):
    """
    Dùng khi cần check role linh hoạt.
    Ví dụ: Depends(require_role(UserRole.admin, UserRole.staff))
    """
    def checker(
        request: Request,
        session: Session = Depends(get_session)  # ← truyền function, không gọi ()
    ):
        user = get_current_user_from_cookie(request, session)
        if not user:
            raise HTTPException(status_code=401, detail="Chưa đăng nhập")
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Không có quyền truy cập")
        return user
    return checker