from typing import Optional
from fastapi import APIRouter, Depends, Request
from sqlmodel import Session
from app.models.forms import SellCarForm
from app.models.dang_tin import DangTin
from app.core.security import get_current_user_from_cookie
from app.core.database import get_session

router = APIRouter(prefix="/ban-xe")


@router.post("")
def dang_tin_ban_xe(
    request: Request,
    form: SellCarForm,
    session: Session = Depends(get_session),
):
    # Lấy user từ cookie nếu đã đăng nhập, không bắt buộc
    current_user = get_current_user_from_cookie(request, session)

    tin = DangTin(
        user_id=current_user.id if current_user else None,
        **form.model_dump()
    )
    session.add(tin)
    session.commit()
    return {"success": True, "message": "Đăng tin thành công!"}