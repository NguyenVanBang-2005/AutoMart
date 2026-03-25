from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class DangTin(SQLModel, table=True):
    __tablename__ = "dang_tin"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id")
    hang_xe: str
    dong_xe: str
    nam_san_xuat: int
    so_km: int
    gia_mong_muon: int
    khu_vuc: str
    mo_ta: Optional[str] = ""
    ho_ten: str
    so_dien_thoai: str
    created_at: datetime = Field(default_factory=datetime.utcnow)