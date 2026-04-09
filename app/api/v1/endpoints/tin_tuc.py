from fastapi import APIRouter
from app.models.forms import ContactForm

router = APIRouter()

@router.get("/tin-tuc")
def lien_he(form: ContactForm):
    return {"success": True, "message": "Đã truy cập thành công!"}