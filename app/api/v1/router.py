from fastapi import APIRouter, Depends
from app.api.v1.endpoints import (
    cars, ban_xe, lien_he, tu_van,
    tin_tuc, uu_dai_thang, auth, ai_chat
)
from app.api.v1.endpoints.user import public_router, private_router
from app.core.security import get_current_user_required

# Tạo api_router chính với prefix /api/v1
api_router = APIRouter(prefix="/api/v1")

# ── PUBLIC ROUTES ─────────────────────────────────────
api_router.include_router(cars.router,          tags=["Cars"])
api_router.include_router(tin_tuc.router,       tags=["Tin tức"])
api_router.include_router(uu_dai_thang.router,  tags=["Ưu đãi tháng"])
api_router.include_router(ai_chat.router,       tags=["AI"])

# Auth router - có prefix riêng /auth
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])

api_router.include_router(public_router,        tags=["Users"])

# ── PRIVATE ROUTES (yêu cầu đăng nhập) ─────────────────
api_router.include_router(
    private_router,
    tags=["Users"],
    dependencies=[Depends(get_current_user_required)]
)

api_router.include_router(
    ban_xe.router,
    tags=["Bán xe"],
    dependencies=[Depends(get_current_user_required)]
)

api_router.include_router(lien_he.router, tags=["Liên hệ"])

api_router.include_router(
    tu_van.router,
    tags=["Tư vấn"],
    dependencies=[Depends(get_current_user_required)]
)