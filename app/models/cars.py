from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


# ── DB Table ─────────────────────────────────────────
class Car(SQLModel, table=True):
    __tablename__ = "cars"

    id: Optional[int] = Field(default=None, primary_key=True)
    hang: str
    dong: str
    nam: int
    gia: int
    km: int
    loai: str
    anh: Optional[str] = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ── Filter schema (không phải table) ─────────────────
class CarFilter(SQLModel):
    hang: Optional[str] = None
    loai: Optional[str] = None
    nam: Optional[int] = None
    gia_min: Optional[int] = None
    gia_max: Optional[int] = None