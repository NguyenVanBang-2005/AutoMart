from fastapi import APIRouter
from app.models.forms import ConsultForm

router = APIRouter()

@router.post("/tu-van")
def tu_van(form: ConsultForm):
    # TODO: lưu lịch tư vấn
    return {"success": True, "message": "Đăng ký tư vấn thành công!"}