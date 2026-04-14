from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class LienHe(SQLModel, table=True):
    __tablename__ = "lien_he"

    id: Optional[int] = Field(default=None, primary_key=True)

    ho_ten: str
    so_dien_thoai: str
    email: Optional[str] = ""
    noi_dung: str

    # Trạng thái xử lý
    da_doc: bool = Field(default=False)   # staff/admin đã đọc chưa

    created_at: datetime = Field(default_factory=datetime.utcnow)