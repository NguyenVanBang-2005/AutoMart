from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class LaiThu(SQLModel, table=True):
    __tablename__ = "lai_thu"

    id: Optional[int] = Field(default=None, primary_key=True)

    # Thông tin khách hàng
    ho_ten: str
    so_dien_thoai: str

    # Thông tin đặt lịch
    hang_xe: str
    showroom: str
    ngay_lai_thu: str          # lưu dạng string "YYYY-MM-DD"
    khung_gio: str

    # Ảnh giấy tờ (Cloudinary URL)
    anh_cccd: Optional[str] = None
    anh_gplx: Optional[str] = None

    # Trạng thái xử lý
    trang_thai: str = Field(default="cho_duyet")   # cho_duyet | da_duyet | tu_choi
    ly_do_tu_choi: Optional[str] = None            # chỉ có khi trang_thai = tu_choi

    created_at: datetime = Field(default_factory=datetime.utcnow)