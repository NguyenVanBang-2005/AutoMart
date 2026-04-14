from fastapi import APIRouter, Request, Depends
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select
from authlib.integrations.starlette_client import OAuth as AuthlibOAuth
from starlette.config import Config as StarletteConfig
from app.core.config import settings
from app.core.database import get_session
from app.core.security import create_access_token, set_auth_cookie
from app.models.user import User

router = APIRouter(prefix="/auth")

# ── OAuth setup ───────────────────────────────────────
_starlette_config = StarletteConfig(environ={
    "GOOGLE_CLIENT_ID":     settings.GOOGLE_CLIENT_ID,
    "GOOGLE_CLIENT_SECRET": settings.GOOGLE_CLIENT_SECRET,
})

oauth = AuthlibOAuth(_starlette_config)

oauth.register(
    name="google",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

oauth.register(
    name="facebook",
    client_id=settings.FACEBOOK_CLIENT_ID,
    client_secret=settings.FACEBOOK_CLIENT_SECRET,
    access_token_url="https://graph.facebook.com/oauth/access_token",
    authorize_url="https://www.facebook.com/dialog/oauth",
    api_base_url="https://graph.facebook.com/",
    client_kwargs={"scope": "email,public_profile"},
)

# ── Helpers ───────────────────────────────────────────
FRONTEND = settings.FRONTEND_URL

def _get_or_create_user(session: Session, email: str, ho_ten: str) -> User:
    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        user = User(
            ho_ten=ho_ten,
            email=email,
            so_dien_thoai="",
            password_hash=""          # OAuth user không có password
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    return user

# ── Google ────────────────────────────────────────────
@router.get("/google")
async def google_login(request: Request):
    # Lấy domain hiện tại một cách đáng tin cậy
    scheme = request.headers.get("x-forwarded-proto", "https")
    host = request.headers.get("host")

    redirect_uri = f"{scheme}://{host}/auth/google/callback"

    print(f"=== REDIRECT URI: {redirect_uri} ===")  # Quan trọng để debug

    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback", name="google_callback")
async def google_callback(
        request: Request,
        session: Session = Depends(get_session)
):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo") or await oauth.google.userinfo(token=token)
        email = user_info["email"]
        ho_ten = user_info.get("name", email.split("@")[0])

        user = _get_or_create_user(session, email, ho_ten)
        jwt_token = create_access_token({"sub": str(user.id)})

        response = RedirectResponse(url=FRONTEND)
        set_auth_cookie(response, jwt_token)
        return response

    except Exception as e:
        print(f"Google OAuth error: {e}")
        return RedirectResponse(url=f"{FRONTEND}?error=google_login_failed")

# ── Facebook ──────────────────────────────────────────
@router.get("/facebook")
async def facebook_login(request: Request):
    redirect_uri = str(request.url_for("facebook_callback"))
    redirect_uri = redirect_uri.replace("http://", "https://")
    return await oauth.facebook.authorize_redirect(request, redirect_uri)

@router.get("/facebook/callback", name="facebook_callback")
async def facebook_callback(
    request: Request,
    session: Session = Depends(get_session)
):
    try:
        token     = await oauth.facebook.authorize_access_token(request)
        resp      = await oauth.facebook.get(
            "me?fields=id,name,email", token=token
        )
        user_info = resp.json()
        email     = user_info.get("email", f"{user_info['id']}@facebook.com")
        ho_ten    = user_info.get("name", "Facebook User")

        user      = _get_or_create_user(session, email, ho_ten)
        jwt_token = create_access_token({"sub": str(user.id)})

        response  = RedirectResponse(url=FRONTEND)
        set_auth_cookie(response, jwt_token)
        return response

    except Exception as e:
        print(f"Facebook OAuth error: {e}")
        return RedirectResponse(url=f"{FRONTEND}?error=facebook_login_failed")

# ── Twitter/X (chưa implement — giữ chỗ) ─────────────
@router.get("/twitter")
async def twitter_login():
    # Twitter OAuth 2.0 cần thêm setup phức tạp hơn
    # Tạm thời redirect về trang chủ
    return RedirectResponse(url=FRONTEND)

# Test route cho auth router
@router.get("/test")
async def test_auth_router():
    return {"status": "ok", "message": "Auth router is working correctly!"}