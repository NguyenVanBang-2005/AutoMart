from fastapi import APIRouter, Depends, HTTPException, Form
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.lien_he import LienHe
from app.models.forms import ContactForm

router = APIRouter()


@router.post("/lien-he")
def gui_lien_he(form: ContactForm, session: Session = Depends(get_session)):
    """Lưu đơn liên hệ vào DB — hiện trong admin & staff dashboard."""
    lh = LienHe(
        ho_ten=form.ho_ten,
        so_dien_thoai=form.so_dien_thoai,
        email=form.email or "",
        noi_dung=form.noi_dung,
        da_doc=False,
    )
    session.add(lh)
    session.commit()
    session.refresh(lh)
    return {"success": True, "message": "Đã nhận tin nhắn!", "id": lh.id}


@router.patch("/admin/lien-he/{lh_id}/da-doc")
def danh_dau_da_doc(
    lh_id: int,
    session: Session = Depends(get_session),
):
    """Admin / staff đánh dấu đơn liên hệ đã đọc."""
    lh = session.get(LienHe, lh_id)
    if not lh:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn liên hệ")
    lh.da_doc = True
    session.add(lh)
    session.commit()
    return {"success": True}