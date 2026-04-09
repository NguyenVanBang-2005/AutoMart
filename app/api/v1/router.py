from fastapi import APIRouter
from app.api.v1.endpoints import cars, ban_xe, lien_he, tu_van, tin_tuc, uu_dai_thang, user, auth

api_router = APIRouter()

api_router.include_router(cars.router,    tags=["Cars"])
api_router.include_router(ban_xe.router,  tags=["Bán xe"])
api_router.include_router(lien_he.router, tags=["Liên hệ"])
api_router.include_router(tu_van.router,  tags=["Tư vấn"])
api_router.include_router(tin_tuc.router, tags=["Tin tức"])
api_router.include_router(uu_dai_thang.router, tags=["Ưu đãi tháng"])
api_router.include_router(user.router,   tags=["Users"])
api_router.include_router(auth.router,   tags=["Auth"])