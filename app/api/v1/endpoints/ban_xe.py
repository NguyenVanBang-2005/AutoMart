from typing import Optional
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlmodel import Session, select
from app.models.forms import SellCarForm
from app.models.dang_tin import DangTin
from app.core.security import get_current_user_from_cookie
from app.core.database import get_session

router = APIRouter(prefix="/ban-xe")


def require_login(request: Request, session: Session):
    """Bắt buộc đăng nhập, raise 401 nếu chưa."""
    user = get_current_user_from_cookie(request, session)
    if not user:
        raise HTTPException(status_code=401, detail="Vui lòng đăng nhập để thực hiện thao tác này!")
    return user


@router.post("")
def dang_tin_ban_xe(
    request: Request,
    form: SellCarForm,
    session: Session = Depends(get_session),
):
    user = require_login(request, session)
    tin = DangTin(user_id=user.id, **form.model_dump())
    session.add(tin)
    session.commit()
    session.refresh(tin)
    return {"success": True, "message": "Đăng tin thành công!", "id": tin.id}


@router.get("")
def get_danh_sach_ban_xe(session: Session = Depends(get_session)):
    tins = session.exec(select(DangTin).order_by(DangTin.created_at.desc())).all()
    return {"tins": tins, "total": len(tins)}


@router.get("/{tin_id}")
def get_chi_tiet_ban_xe(tin_id: int, session: Session = Depends(get_session)):
    tin = session.get(DangTin, tin_id)
    if not tin:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin")
    return tin


@router.put("/{tin_id}")
def sua_tin_ban_xe(
    tin_id: int,
    form: SellCarForm,
    request: Request,
    session: Session = Depends(get_session),
):
    user = require_login(request, session)
    tin  = session.get(DangTin, tin_id)
    if not tin:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin")
    if tin.user_id != user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền sửa tin này!")
    for key, val in form.model_dump().items():
        setattr(tin, key, val)
    session.commit()
    session.refresh(tin)
    return {"success": True, "message": "Cập nhật thành công!"}


@router.delete("/{tin_id}")
def xoa_tin_ban_xe(
    tin_id: int,
    request: Request,
    session: Session = Depends(get_session),
):
    user = require_login(request, session)
    tin  = session.get(DangTin, tin_id)
    if not tin:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin")
    if tin.user_id != user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa tin này!")
    session.delete(tin)
    session.commit()
    return {"success": True, "message": "Đã xóa tin!"}