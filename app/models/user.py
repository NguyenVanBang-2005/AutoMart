from sqlmodel import SQLModel, Field
from sqlalchemy import Index
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    user = "user"
    staff = "staff"
    admin = "admin"


# ── DB Table ──────────────────────────────────────────
class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    ho_ten: str
    email: str = Field(unique=True, index=True)
    so_dien_thoai: str
    password_hash: str
    role: UserRole = Field(default=UserRole.user)
    avatar_url: Optional[str] = Field(default="")
    avatar_public_id: Optional[str] = Field(default="")
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ── OTP Model (mới thêm) ─────────────────────────────────
class OTP(SQLModel, table=True):
    __tablename__ = "otps"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    otp: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

    __table_args__ = (
        Index("ix_otp_email_expires", "email", "expires_at"),
    )

class ResetPasswordRequest(SQLModel):
    email: str
    new_password: str

# ── Request schemas ───────────────────────────────────
class UserRegister(SQLModel):
    ho_ten: str
    email: str
    so_dien_thoai: str
    password: str


class UserLogin(SQLModel):
    email: str
    password: str

class SendOTPRequest(SQLModel):
    email: str
    purpose: str = "reset"   # "register" hoặc "reset"

class UserUpdateProfile(SQLModel):
    ho_ten: Optional[str] = None
    so_dien_thoai: Optional[str] = None


class UserChangePassword(SQLModel):
    password_cu: str
    password_moi: str
    password_moi_confirm: str

class RegisterWithOTP(SQLModel):
    ho_ten: str
    email: str
    so_dien_thoai: str
    password: str
    otp: str


# ── Response schemas ──────────────────────────────────
class UserOut(SQLModel):
    id: int
    ho_ten: str
    email: str
    so_dien_thoai: str
    role: UserRole = UserRole.user
    avatar_url: Optional[str] = ""


class TokenOut(SQLModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut