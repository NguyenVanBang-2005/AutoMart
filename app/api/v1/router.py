from fastapi import APIRouter, Depends
from app.api.v1.endpoints import (
    cars, ban_xe, lien_he, tu_van,
    tin_tuc, uu_dai_thang, auth, ai_chat   # ← thêm ai_chat
)
from app.api.v1.endpoints.user import public_router, private_router
from app.core.security import get_current_user_required, require_staff, require_admin

api_router = APIRouter()

# ── PUBLIC ────────────────────────────────────────────
api_router.include_router(cars.router,          tags=["Cars"])
api_router.include_router(tin_tuc.router,       tags=["Tin tức"])
api_router.include_router(uu_dai_thang.router,  tags=["Ưu đãi tháng"])
api_router.include_router(auth.router,          tags=["Auth"])
api_router.include_router(public_router,        tags=["Users"])
api_router.include_router(ai_chat.router,       tags=["AI"])

# ── USER ──────────────────────────────────────────────
api_router.include_router(
    private_router, tags=["Users"],
    dependencies=[Depends(get_current_user_required)]
)
api_router.include_router(
    ban_xe.router, tags=["Bán xe"],
    dependencies=[Depends(get_current_user_required)]
)
api_router.include_router(lien_he.router, tags=["Liên hệ"])
api_router.include_router(
    tu_van.router, tags=["Tư vấn"],
    dependencies=[Depends(get_current_user_required)]
)