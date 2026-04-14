import cloudinary
import cloudinary.uploader

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlmodel import Session
from typing import Optional

from app.core.config import settings
from app.core.database import get_session

# Import model — thêm LaiThu vào __init__.py của models nếu cần
from app.models.lai_thu import LaiThu

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
)

router = APIRouter()


def _upload_to_cloudinary(file: UploadFile, folder: str, public_id: str) -> str:
    """Upload 1 file lên Cloudinary, trả về secure_url."""
    contents = file.file.read()
    result = cloudinary.uploader.upload(
        contents,
        folder=folder,
        public_id=public_id,
        overwrite=True,
        resource_type="image",
    )
    return result["secure_url"]


@router.post("/lai-thu")
async def dat_lich_lai_thu(
    ho_ten:         str          = Form(...),
    so_dien_thoai:  str          = Form(...),
    hang_xe:        str          = Form(...),
    showroom:       str          = Form(...),
    ngay_lai_thu:   str          = Form(...),
    khung_gio:      str          = Form(...),
    anh_cccd:       Optional[UploadFile] = File(None),
    anh_gplx:       Optional[UploadFile] = File(None),
    session:        Session      = Depends(get_session),
):
    # ── Validate ảnh bắt buộc ────────────────────────
    if not anh_cccd or not anh_cccd.filename:
        raise HTTPException(status_code=422, detail="Vui lòng tải lên ảnh CCCD/CMND")
    if not anh_gplx or not anh_gplx.filename:
        raise HTTPException(status_code=422, detail="Vui lòng tải lên ảnh Giấy phép lái xe")

    ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
    for f, label in [(anh_cccd, "CCCD"), (anh_gplx, "GPLX")]:
        if f.content_type not in ALLOWED_TYPES:
            raise HTTPException(status_code=422, detail=f"Ảnh {label} phải là JPG/PNG/WEBP")

    # ── Upload Cloudinary ────────────────────────────
    # public_id dùng số điện thoại + loại để tránh trùng
    safe_phone = so_dien_thoai.replace(" ", "")
    url_cccd = _upload_to_cloudinary(
        anh_cccd,
        folder="automart/lai_thu/cccd",
        public_id=f"{safe_phone}_cccd",
    )
    url_gplx = _upload_to_cloudinary(
        anh_gplx,
        folder="automart/lai_thu/gplx",
        public_id=f"{safe_phone}_gplx",
    )

    # ── Lưu DB ──────────────────────────────────────
    booking = LaiThu(
        ho_ten=ho_ten,
        so_dien_thoai=so_dien_thoai,
        hang_xe=hang_xe,
        showroom=showroom,
        ngay_lai_thu=ngay_lai_thu,
        khung_gio=khung_gio,
        anh_cccd=url_cccd,
        anh_gplx=url_gplx,
        trang_thai="cho_duyet",
    )
    session.add(booking)
    session.commit()
    session.refresh(booking)

    return {
        "success": True,
        "message": "Đặt lịch lái thử thành công! Chúng tôi sẽ liên hệ xác nhận sớm.",
        "id": booking.id,
    }


# ── Admin: lấy danh sách ─────────────────────────────
@router.get("/admin/lai-thu")
def get_all_lai_thu(session: Session = Depends(get_session)):
    """Dùng trong admin dashboard — chỉ gọi từ server-side template."""
    from sqlmodel import select
    bookings = session.exec(
        select(LaiThu).order_by(LaiThu.created_at.desc())
    ).all()
    return bookings


@router.patch("/admin/lai-thu/{booking_id}")
def update_trang_thai(
    booking_id: int,
    trang_thai: str          = Form(...),
    ly_do_tu_choi: Optional[str] = Form(None),
    session: Session         = Depends(get_session),
):
    """Admin duyệt / từ chối lịch lái thử."""
    from sqlmodel import select
    booking = session.get(LaiThu, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch đặt")
    if trang_thai not in ("cho_duyet", "da_duyet", "tu_choi"):
        raise HTTPException(status_code=422, detail="Trạng thái không hợp lệ")
    if trang_thai == "tu_choi" and not ly_do_tu_choi:
        raise HTTPException(status_code=422, detail="Vui lòng nhập lý do từ chối")
    booking.trang_thai    = trang_thai
    booking.ly_do_tu_choi = ly_do_tu_choi if trang_thai == "tu_choi" else None
    session.add(booking)
    session.commit()
    return {"success": True, "trang_thai": trang_thai}