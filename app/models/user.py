from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


# ── DB Table ────────────────────────────────────────
class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    ho_ten: str
    email: str = Field(unique=True, index=True)
    so_dien_thoai: str
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ── Request schemas ──────────────────────────────────
class UserRegister(SQLModel):
    ho_ten: str
    email: str
    so_dien_thoai: str
    password: str

class UserLogin(SQLModel):
    email: str
    password: str

class UserUpdateProfile(SQLModel):
    ho_ten: Optional[str] = None
    so_dien_thoai: Optional[str] = None

class UserChangePassword(SQLModel):
    password_cu: str
    password_moi: str
    password_moi_confirm: str


# ── Response schemas ─────────────────────────────────
class UserOut(SQLModel):
    id: int
    ho_ten: str
    email: str
    so_dien_thoai: str

class TokenOut(SQLModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut