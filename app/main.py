from app.core.security import get_current_user_from_cookie
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pathlib import Path
from app.core.config import settings
from app.core.database import init_db, engine
from app.api.v1.router import api_router
from sqlmodel import Session
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from fastapi import FastAPI, Request, Depends
from fastapi.responses import RedirectResponse
from app.core.database import init_db, engine, get_session

BASE_DIR = Path(__file__).resolve().parent

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()

    from app.services.car_service import seed_cars
    from app.services.seed_dang_tin import seed_dang_tin
    with Session(engine) as session:
        seed_cars(session)
        seed_dang_tin(session)

    yield
    print("Server đang tắt...")


app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG, lifespan=lifespan)
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

from starlette.middleware.sessions import SessionMiddleware
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

app.include_router(api_router, prefix="/api/v1")

def get_current_user_for_template(request: Request):
    """Truyền user vào mọi template để hiển thị đúng UI"""
    try:
        with Session(engine) as session:
            return get_current_user_from_cookie(request, session)
    except Exception:
        return None

# ── Frontend routes ───────────────────────────────────
@app.get("/")
def home(request: Request):
    user = get_current_user_for_template(request)
    template_path = BASE_DIR / "templates" / "index.html"
    print(f"Template path exists: {template_path.exists()}")
    print(f"BASE_DIR: {BASE_DIR}")
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"current_user": user}
    )

@app.get("/mua-xe")
def mua_xe(request: Request):
    user = get_current_user_for_template(request)
    return templates.TemplateResponse(
        request=request,
        name="mua_xe.html",
        context={"current_user": user}
    )

@app.get("/ban-xe")
def ban_xe(request: Request):
    user = get_current_user_for_template(request)
    return templates.TemplateResponse(
        request=request,
        name="ban_xe.html",
        context={"current_user": user}
    )

@app.get("/lien-he")
def lien_he(request: Request):
    user = get_current_user_for_template(request)
    return templates.TemplateResponse(
        request=request,
        name="lien_he.html",
        context={"current_user": user}
    )

@app.get("/tu-van")
def tu_van(request: Request):
    user = get_current_user_for_template(request)
    return templates.TemplateResponse(
        request=request,
        name="tu_van.html",
        context={"current_user": user}
    )

@app.get("/tin-tuc")
def tin_tuc(request: Request):
    user = get_current_user_for_template(request)
    return templates.TemplateResponse(
        request=request,
        name="news.html",
        context={"current_user": user}
    )

@app.get("/uu-dai-thang")
def uu_dai_thang(request: Request):
    user = get_current_user_for_template(request)
    from app.services.car_service import get_cars
    from app.models.cars import CarFilter
    with Session(engine) as session:
        deals = get_cars(session, CarFilter())[:12]
    return templates.TemplateResponse(
        request=request,
        name="uu_dai_thang.html",
        context={"current_user": user, "deals": list(deals)}
    )

@app.get("/huong-dan")
def huong_dan(request: Request):
    user = get_current_user_for_template(request)
    return templates.TemplateResponse(
        request=request,
        name="huong_dan.html",
        context={"current_user": user}
    )

@app.get("/dich-vu")
def dich_vu(request: Request):
    user = get_current_user_for_template(request)
    return templates.TemplateResponse(
        request=request,
        name="dich_vu.html",
        context={"current_user": user}
    )

@app.get("/xe/{car_id}")
def xe_detail_page(request: Request, car_id: int):
    from app.models.cars import Car
    from app.services.car_service import get_car_images
    user = get_current_user_for_template(request)
    with Session(engine) as session:
        car = session.get(Car, car_id)
        if not car:
            return RedirectResponse("/mua-xe")
        images = get_car_images(session, car_id)
    return templates.TemplateResponse(
        request=request,
        name="car_details.html",
        context={"current_user": user, "car": car, "images": images}
    )

@app.get("/danh-sach-ban-xe")
def danh_sach_ban_xe(request: Request):
    user = get_current_user_for_template(request)
    with Session(engine) as session:
        from sqlmodel import select
        from app.models.dang_tin import DangTin
        tins = session.exec(select(DangTin).order_by(DangTin.created_at.desc())).all()
    return templates.TemplateResponse(
        request=request,
        name="danh_sach_ban_xe.html",
        context={"current_user": user, "tins": list(tins)}
    )

@app.get("/ban-xe/{tin_id}")
def chi_tiet_ban_xe(request: Request, tin_id: int):
    user = get_current_user_for_template(request)
    with Session(engine) as session:
        from app.models.dang_tin import DangTin
        tin = session.get(DangTin, tin_id)
        if not tin:
            return RedirectResponse("/danh-sach-ban-xe")
    # is_owner: True nếu user đang đăng nhập là chủ tin
    is_owner = user is not None and tin.user_id == user.id
    return templates.TemplateResponse(
        request=request,
        name="chi_tiet_ban_xe.html",
        context={"current_user": user, "tin": tin, "is_owner": is_owner}
    )

@app.get("/ban-xe/{tin_id}/sua")
def sua_tin_page(request: Request, tin_id: int):
    user = get_current_user_for_template(request)
    if not user:
        return RedirectResponse("/")
    with Session(engine) as session:
        from app.models.dang_tin import DangTin
        tin = session.get(DangTin, tin_id)
        if not tin or tin.user_id != user.id:
            return RedirectResponse("/danh-sach-ban-xe")
    return templates.TemplateResponse(
        request=request,
        name="sua_tin_ban_xe.html",
        context={"current_user": user, "tin": tin}
    )