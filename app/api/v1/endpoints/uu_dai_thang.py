from fastapi import APIRouter
from app.models.forms import ContactForm

router = APIRouter()

@router.get("/uu-dai")
def uu_dai():
    return {"success": True, "message": "Đã truy cập thành công!"}