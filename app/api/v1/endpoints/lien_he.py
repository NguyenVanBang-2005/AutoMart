from fastapi import APIRouter
from app.models.forms import ContactForm

router = APIRouter()

@router.post("/lien-he")
def lien_he(form: ContactForm):
    # TODO: gửi email
    return {"success": True, "message": "Đã nhận tin nhắn!"}