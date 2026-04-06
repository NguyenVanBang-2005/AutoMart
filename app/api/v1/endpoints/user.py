from fastapi import APIRouter, HTTPException, Depends, status, Response, Request
from sqlmodel import Session, select
from app.models.user import (
    UserRegister, UserLogin, UserUpdateProfile,
    UserChangePassword, UserOut, TokenOut, User,
    SendOTPRequest, RegisterWithOTP          # ← thêm
)
from app.services.user_service import (
    find_user_by_email, find_user_by_id, create_user,
    authenticate_user, update_profile, change_password
)
from app.core.security import (
    create_access_token, decode_token,
    set_auth_cookie, delete_auth_cookie,
    get_current_user_from_cookie,
    oauth2_scheme, COOKIE_NAME
)
from app.core.database import get_session
from app.services.email_service import send_otp, verify_otp  # ← thêm

router = APIRouter(prefix="/users")


# ── Helpers ──────────────────────────────────────────
def get_user_from_token(token: str, session: Session) -> User:
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token không hợp lệ")
    user = find_user_by_id(session, int(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy user")
    return user


def get_user_from_request(
    request: Request,
    session: Session = Depends(get_session)
) -> User:
    user = get_current_user_from_cookie(request, session)
    if not user:
        raise HTTPException(status_code=401, detail="Chưa đăng nhập")
    return user


def to_user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        ho_ten=user.ho_ten,
        email=user.email,
        so_dien_thoai=user.so_dien_thoai,
    )


# ── Auth ─────────────────────────────────────────────

# Giữ nguyên endpoint cũ — không xóa
@router.post("/register", response_model=TokenOut, status_code=201)
def register(
    data: UserRegister,
    response: Response,
    session: Session = Depends(get_session)
):
    if find_user_by_email(session, data.email):
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")
    user = create_user(session, data)
    token = create_access_token({"sub": str(user.id)})
    set_auth_cookie(response, token)
    return TokenOut(access_token=token, user=to_user_out(user))


@router.post("/send-otp", status_code=200)
async def request_otp(
    data: SendOTPRequest,                    # ← dùng schema thay vì dict
    session: Session = Depends(get_session)  # ← đồng nhất get_session
):
    email = data.email.strip().lower()

    if find_user_by_email(session, email):
        raise HTTPException(status_code=400, detail="Email đã được đăng ký")

    success = await send_otp(email)
    if not success:
        raise HTTPException(status_code=500, detail="Gửi OTP thất bại, thử lại sau")

    return {"message": "OTP đã được gửi"}


@router.post("/register-otp", response_model=TokenOut, status_code=201)
def register_with_otp(
    data: RegisterWithOTP,
    response: Response,
    session: Session = Depends(get_session)
):
    email = data.email.strip().lower()

    # Verify OTP trước
    if not verify_otp(email, data.otp):
        raise HTTPException(status_code=400, detail="OTP không đúng hoặc đã hết hạn")

    # Kiểm tra email trùng
    if find_user_by_email(session, email):
        raise HTTPException(status_code=400, detail="Email đã được đăng ký")

    # Tái dùng create_user với UserRegister
    user_data = UserRegister(
        ho_ten=data.ho_ten,
        email=email,
        so_dien_thoai=data.so_dien_thoai,
        password=data.password
    )
    user  = create_user(session, user_data)
    token = create_access_token({"sub": str(user.id)})
    set_auth_cookie(response, token)
    return TokenOut(access_token=token, user=to_user_out(user))


@router.post("/login", response_model=TokenOut)
def login(
    data: UserLogin,
    response: Response,
    session: Session = Depends(get_session)
):
    user = authenticate_user(session, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")
    token = create_access_token({"sub": str(user.id)})
    set_auth_cookie(response, token)
    return TokenOut(access_token=token, user=to_user_out(user))


@router.post("/logout")
def logout(response: Response):
    delete_auth_cookie(response)
    return {"success": True, "message": "Đăng xuất thành công"}


# ── Profile ──────────────────────────────────────────
@router.get("/me", response_model=UserOut)
def get_profile(user: User = Depends(get_user_from_request)):
    return to_user_out(user)


@router.patch("/me", response_model=UserOut)
def patch_profile(
    data: UserUpdateProfile,
    user: User = Depends(get_user_from_request),
    session: Session = Depends(get_session)
):
    updated = update_profile(session, user, data)
    return to_user_out(updated)


@router.post("/me/change-password")
def post_change_password(
    data: UserChangePassword,
    user: User = Depends(get_user_from_request),
    session: Session = Depends(get_session)
):
    if data.password_moi != data.password_moi_confirm:
        raise HTTPException(status_code=400, detail="Mật khẩu mới không khớp")
    ok = change_password(session, user, data.password_cu, data.password_moi)
    if not ok:
        raise HTTPException(status_code=400, detail="Mật khẩu cũ không đúng")
    return {"success": True, "message": "Đổi mật khẩu thành công"}


# ── Lịch sử ──────────────────────────────────────────
@router.get("/me/lich-su-dang-tin")
def get_lich_su(
    user: User = Depends(get_user_from_request),
    session: Session = Depends(get_session)
):
    from app.models.dang_tin import DangTin
    tins = session.exec(
        select(DangTin).where(DangTin.user_id == user.id)
    ).all()
    return {"total": len(tins), "data": tins}