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

BASE_DIR = Path(__file__).resolve().parent

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ───────────────────────────────────────
    init_db()

    from app.services.car_service import seed_cars
    with Session(engine) as session:
        seed_cars(session)

    yield

    # ── Shutdown (nếu cần cleanup) ────────────────────
    print("👋 Server đang tắt...")


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