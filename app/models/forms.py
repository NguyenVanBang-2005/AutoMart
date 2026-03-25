from sqlmodel import SQLModel
from typing import Optional


class SellCarForm(SQLModel):
    hang_xe: str
    dong_xe: str
    nam_san_xuat: int
    so_km: int
    gia_mong_muon: int
    khu_vuc: str
    mo_ta: Optional[str] = ""
    ho_ten: str
    so_dien_thoai: str

class ContactForm(SQLModel):
    ho_ten: str
    so_dien_thoai: str
    email: Optional[str] = ""
    noi_dung: str

class ConsultForm(SQLModel):
    ho_ten: str
    so_dien_thoai: str
    chu_de: Optional[str] = ""
    thoi_gian: Optional[str] = ""
    ghi_chu: Optional[str] = ""