from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date

class UuDai(SQLModel, table=True):
    __tablename__ = "uu_dai"

    id: Optional[int] = Field(default=None, primary_key=True)
    xe_id: int = Field(foreign_key="cars.id", unique=True)
    phan_tram_giam: float = Field(ge=1, le=99)
    ngay_bat_dau: date
    ngay_ket_thuc: date
    mo_ta: Optional[str] = None