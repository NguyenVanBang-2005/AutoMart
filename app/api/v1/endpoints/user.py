from fastapi import APIRouter, Depends, HTTPException, Request, Response, UploadFile, File
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.security import (
    create_access_token, set_auth_cookie, delete_auth_cookie,
    get_current_user_from_cookie
)
from app.models.user import (
    UserRegister, UserLogin, UserUpdateProfile,
    UserChangePassword, UserOut, TokenOut,
    SendOTPRequest, RegisterWithOTP
)
from app.models.dang_tin import DangTin
from app.services.user_service import (
    find_user_by_email, create_user, authenticate_user,
    update_profile, update_avatar, change_password
)
from app.services.upload_service import upload_image, delete_image

public_router  = APIRouter(prefix="/users")
private_router = APIRouter(prefix="/users")


# ── Helper ────────────────────────────────────────────────────
def to_user_out(user) -> UserOut:
    return UserOut(
        id=user.id,
        ho_ten=user.ho_ten,
        email=user.email,
        so_dien_thoai=user.so_dien_thoai,
        avatar_url=user.avatar_url or "",
    )


def get_user_or_401(request: Request, session: Session) -> object:
    user = get_current_user_from_cookie(request, session)
    if not user:
        raise HTTPException(status_code=401, detail="Chưa đăng nhập")
    return user


# ══════════════════════════════════════════════════════════════
# PUBLIC — không cần đăng nhập
# ══════════════════════════════════════════════════════════════

@public_router.post("/register", response_model=TokenOut, status_code=201)
def register(data: UserRegister, response: Response, session: Session = Depends(get_session)):
    if find_user_by_email(session, data.email):
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")
    user = create_user(session, data)
    token = create_access_token({"sub": str(user.id)})
    set_auth_cookie(response, token)
    return TokenOut(access_token=token, user=to_user_out(user))


@public_router.post("/login", response_model=TokenOut)
def login(data: UserLogin, response: Response, session: Session = Depends(get_session)):
    user = authenticate_user(session, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")
    token = create_access_token({"sub": str(user.id)})
    set_auth_cookie(response, token)
    return TokenOut(access_token=token, user=to_user_out(user))


@public_router.post("/logout")
def logout(response: Response):
    delete_auth_cookie(response)
    return {"success": True}


@public_router.get("/me", response_model=UserOut)
def get_me(request: Request, session: Session = Depends(get_session)):
    user = get_user_or_401(request, session)
    return to_user_out(user)


# ══════════════════════════════════════════════════════════════
# PRIVATE — phải đăng nhập (dependency inject từ router.py)
# ══════════════════════════════════════════════════════════════

@private_router.patch("/me", response_model=UserOut)
def patch_me(
    data: UserUpdateProfile,
    request: Request,
    session: Session = Depends(get_session)
):
    user = get_user_or_401(request, session)
    updated = update_profile(session, user, data)
    return to_user_out(updated)


@private_router.post("/me/change-password")
def post_change_password(
    data: UserChangePassword,
    request: Request,
    session: Session = Depends(get_session)
):
    user = get_user_or_401(request, session)
    if data.password_moi != data.password_moi_confirm:
        raise HTTPException(status_code=400, detail="Mật khẩu mới không khớp")
    ok = change_password(session, user, data)
    if not ok:
        raise HTTPException(status_code=400, detail="Mật khẩu cũ không đúng")
    return {"success": True, "message": "Đổi mật khẩu thành công"}


@private_router.post("/me/avatar")
async def post_avatar(
    request: Request,
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    user = get_user_or_401(request, session)
    if user.avatar_public_id:
        await delete_image(user.avatar_public_id)
    result = await upload_image(file, folder="avatars")
    updated = update_avatar(session, user, result["url"], result["public_id"])
    return {"success": True, "avatar_url": updated.avatar_url}


@private_router.get("/me/dang-tin")
def get_my_dang_tin(request: Request, session: Session = Depends(get_session)):
    user = get_user_or_401(request, session)
    tins = session.exec(
        select(DangTin)
        .where(DangTin.user_id == user.id)
        .order_by(DangTin.created_at.desc())
    ).all()
    return {"total": len(tins), "data": tins}