from app.core.security import get_current_user_from_cookie
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pathlib import Path
from app.core.config import settings
from app.core.database import init_db, engine
from app.models.dang_tin import DangTin
from app.api.v1.router import api_router
from sqlmodel import Session, select
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from fastapi import FastAPI, Request, Depends
from fastapi.responses import RedirectResponse
from app.core.database import init_db, engine, get_session
from app.models.lien_he import LienHe

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
    try:
        token = request.cookies.get("automart_token")
        print(f"=== COOKIE TOKEN: {'EXISTS' if token else 'MISSING'} ===")
        with Session(engine) as session:
            user = get_current_user_from_cookie(request, session)
            print(f"=== USER: {user} ===")
            return user
    except Exception as e:
        print(f"=== ERROR: {e} ===")
        return None

# ── Frontend routes ───────────────────────────────────
@app.get("/")
def home(request: Request):
    user = get_current_user_for_template(request)
    with Session(engine) as session:
        from app.services.news_service import get_all_news
        from app.models.news import NewsCategory
        news_list    = get_all_news(session, NewsCategory.tin_tuc)
        hoi_dap_list = get_all_news(session, NewsCategory.hoi_dap)
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "current_user": user,
            "news_list": news_list,
            "hoi_dap_list": hoi_dap_list,
            "is_news_page": True,
        }
    )


from app.models.dang_tin import DangTin

@app.get("/profile")
def profile_page(request: Request, session: Session = Depends(get_session)):
    user = get_current_user_from_cookie(request, session)
    if not user:
        return RedirectResponse(url="/", status_code=302)

    dang_tins = session.exec(
        select(DangTin)
        .where(DangTin.user_id == user.id)
        .order_by(DangTin.created_at.desc())
    ).all()

    return templates.TemplateResponse("profile.html", {
        "request": request,
        "current_user": user,
        "dang_tins": dang_tins,
    })


@app.get("/admin/dashboard")
def admin_dashboard(request: Request):
    user = get_current_user_for_template(request)
    if not user or user.role.value != "admin":
        return RedirectResponse("/")
    with Session(engine) as session:
        from sqlmodel import select, func
        from app.models.user import User
        from app.models.dang_tin import DangTin
        from app.models.lai_thu import LaiThu
        from app.models.lien_he import LienHe

        total_users = session.exec(select(func.count()).select_from(User)).one()
        total_tins = session.exec(select(func.count()).select_from(DangTin)).one()
        total_lai_thu = session.exec(select(func.count()).select_from(LaiThu)).one()
        cho_duyet_count = session.exec(
            select(func.count()).select_from(LaiThu)
            .where(LaiThu.trang_thai == "cho_duyet")
        ).one()
        lien_he_chua_doc = session.exec(
            select(func.count()).select_from(LienHe)
            .where(LienHe.da_doc == False)
        ).one()

        recent_users = session.exec(
            select(User).order_by(User.created_at.desc()).limit(5)
        ).all()
        recent_tins = session.exec(
            select(DangTin).order_by(DangTin.created_at.desc()).limit(5)
        ).all()
        lai_thu_list = session.exec(
            select(LaiThu).order_by(LaiThu.created_at.desc())
        ).all()
        lien_he_list = session.exec(
            select(LienHe).order_by(LienHe.created_at.desc())
        ).all()

    return templates.TemplateResponse(
        request=request,
        name="admin_dashboard.html",
        context={
            "current_user": user,
            "total_users": total_users,
            "total_tins": total_tins,
            "total_lai_thu": total_lai_thu,
            "cho_duyet_count": cho_duyet_count,
            "lien_he_chua_doc": lien_he_chua_doc,
            "recent_users": recent_users,
            "recent_tins": recent_tins,
            "lai_thu_list": lai_thu_list,
            "lien_he_list": lien_he_list,
        }
    )

@app.get("/staff/dashboard")
def staff_dashboard(request: Request):
    user = get_current_user_for_template(request)
    if not user or user.role.value not in ("staff", "admin"):
        return RedirectResponse("/")
    with Session(engine) as session:
        from sqlmodel import select, func
        from app.models.dang_tin import DangTin
        from app.models.lien_he import LienHe

        total_tins = session.exec(select(func.count()).select_from(DangTin)).one()
        lien_he_chua_doc = session.exec(
            select(func.count()).select_from(LienHe)
            .where(LienHe.da_doc == False)
        ).one()
        recent_tins = session.exec(
            select(DangTin).order_by(DangTin.created_at.desc()).limit(10)
        ).all()
        lien_he_list = session.exec(
            select(LienHe).order_by(LienHe.created_at.desc())
        ).all()

    return templates.TemplateResponse(
        request=request,
        name="staff_dashboard.html",
        context={
            "current_user": user,
            "total_tins": total_tins,
            "lien_he_chua_doc": lien_he_chua_doc,
            "recent_tins": recent_tins,
            "lien_he_list": lien_he_list,
        }
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
    import sys
    print("=== HIT ===", flush=True, file=sys.stderr)
    user = get_current_user_for_template(request)
    with Session(engine) as session:
        from app.services.news_service import get_all_news
        from app.models.news import NewsCategory
        news_list = get_all_news(session, NewsCategory.tin_tuc)
        hoi_dap_list = get_all_news(session, NewsCategory.hoi_dap)
    return templates.TemplateResponse(
        request=request,
        name="news.html",
        context={
            "current_user": user,
            "news_list": news_list,
            "hoi_dap_list": hoi_dap_list,
        }
    )

@app.get("/tin-tuc/{news_id}")
def tin_tuc_detail(request: Request, news_id: int):
    user = get_current_user_for_template(request)
    with Session(engine) as session:
        from app.services.news_service import get_all_news, get_news_by_id
        from app.models.news import NewsCategory
        news = get_news_by_id(session, news_id)
        if not news:
            return RedirectResponse("/tin-tuc")
        # Gợi ý bài liên quan (cùng category, trừ bài hiện tại)
        related = [n for n in get_all_news(session, news.category) if n.id != news_id][:4]
    return templates.TemplateResponse(
        request=request,
        name="news_detail.html",
        context={
            "current_user": user,
            "news": news,
            "related": related,
        }
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
        context={
            "current_user": user,
            # is_logged_in không cần truyền riêng —
            # template dùng current_user trực tiếp qua Jinja2,
            # JS đọc qua data-logged-in attribute trên #dvPageData
        }
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

@app.get("/dai-ly")
def dai_ly(request: Request):
    user = get_current_user_for_template(request)
    return templates.TemplateResponse(
        request=request,
        name="dai_ly.html",
        context={"current_user": user}
    )