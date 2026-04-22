from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlmodel import Session, select
from datetime import date
from typing import Optional

from app.core.database import get_session
from app.core.security import get_current_user_from_cookie
from app.models.uu_dai import UuDai
from app.models.cars import Car
from app.models.user import UserRole

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


def _get_optional_user(request: Request, session: Session):
    """
    Đọc cookie không bắt buộc — trả None nếu chưa đăng nhập.
    Dùng get_current_user_from_cookie có sẵn trong security.py.
    """
    try:
        return get_current_user_from_cookie(request, session)
    except Exception:
        return None


# ─── PAGE ─────────────────────────────────────────────────────────────────────

@router.get("/uu-dai", response_class=HTMLResponse)
def uu_dai_thang(
    request: Request,
    session: Session = Depends(get_session),
):
    current_user = _get_optional_user(request, session)

    today = date.today()
    active_deals = session.exec(
        select(UuDai).where(
            UuDai.ngay_bat_dau <= today,
            UuDai.ngay_ket_thuc >= today,
        )
    ).all()

    deal_map = {ud.xe_id: ud for ud in active_deals}
    xe_ids = list(deal_map.keys())
    xe_list = session.exec(select(Car).where(Car.id.in_(xe_ids))).all() if xe_ids else []

    deals = []
    for xe in xe_list:
        ud = deal_map[xe.id]
        deals.append({
            "xe": xe,
            "uu_dai": ud,
            "gia_goc": xe.gia,
            "gia_khuyen_mai": int(xe.gia * (1 - ud.phan_tram_giam / 100)),
            "tiet_kiem": int(xe.gia * ud.phan_tram_giam / 100),
        })

    is_admin = bool(current_user and current_user.role == UserRole.admin)

    return templates.TemplateResponse("uu_dai_thang.html", {
        "request": request,
        "deals": deals,
        "is_admin": is_admin,
        "current_user": current_user,
    })


# ─── API: Upsert ưu đãi (admin only) ─────────────────────────────────────────

@router.post("/api/v1/uu-dai/{xe_id}")
def upsert_uu_dai(
    xe_id: int,
    request: Request,
    phan_tram_giam: float,
    ngay_bat_dau: date,
    ngay_ket_thuc: date,
    mo_ta: Optional[str] = None,
    session: Session = Depends(get_session),
):
    current_user = _get_optional_user(request, session)
    if not current_user or current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Chỉ admin mới được thực hiện thao tác này")

    if ngay_ket_thuc <= ngay_bat_dau:
        raise HTTPException(status_code=400, detail="Ngày kết thúc phải sau ngày bắt đầu")

    ud = session.exec(select(UuDai).where(UuDai.xe_id == xe_id)).first()
    if ud:
        ud.phan_tram_giam = phan_tram_giam
        ud.ngay_bat_dau   = ngay_bat_dau
        ud.ngay_ket_thuc  = ngay_ket_thuc
        ud.mo_ta          = mo_ta
    else:
        ud = UuDai(
            xe_id=xe_id,
            phan_tram_giam=phan_tram_giam,
            ngay_bat_dau=ngay_bat_dau,
            ngay_ket_thuc=ngay_ket_thuc,
            mo_ta=mo_ta,
        )
        session.add(ud)

    session.commit()
    session.refresh(ud)
    return ud


# ─── API: Xóa ưu đãi (admin only) ────────────────────────────────────────────

@router.delete("/api/v1/uu-dai/{xe_id}")
def delete_uu_dai(
    xe_id: int,
    request: Request,
    session: Session = Depends(get_session),
):
    current_user = _get_optional_user(request, session)
    if not current_user or current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Chỉ admin mới được xóa ưu đãi")

    ud = session.exec(select(UuDai).where(UuDai.xe_id == xe_id)).first()
    if not ud:
        raise HTTPException(status_code=404, detail="Không tìm thấy ưu đãi")

    session.delete(ud)
    session.commit()
    return {"ok": True}