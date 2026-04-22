from fastapi import APIRouter, Depends, HTTPException, Request, Response, UploadFile, File
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import (
    create_access_token,
    set_auth_cookie,
    delete_auth_cookie,
    get_current_user_from_cookie,
)
from app.models.user import (
    UserRegister,
    UserLogin,
    UserUpdateProfile,
    UserChangePassword,
    UserOut,
    TokenOut,
    SendOTPRequest,
    RegisterWithOTP,
    OTP,                    # Import model OTP
    ResetPasswordRequest,
)
from app.services.email_service import send_otp, verify_otp
from app.services.user_service import (
    find_user_by_email,
    create_user,
    authenticate_user,
    update_profile,
    update_avatar,
    change_password,
)
from app.services.upload_service import upload_image, delete_image

from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# ====================== ROUTERS ======================
public_router = APIRouter(prefix="/users")
private_router = APIRouter(prefix="/users")


# ====================== HELPER ======================
def to_user_out(user) -> UserOut:
    return UserOut(
        id=user.id,
        ho_ten=user.ho_ten,
        email=user.email,
        so_dien_thoai=user.so_dien_thoai,
        avatar_url=user.avatar_url or "",
        role=user.role,
    )


def get_user_or_401(request: Request, session: Session):
    user = get_current_user_from_cookie(request, session)
    if not user:
        raise HTTPException(status_code=401, detail="Chưa đăng nhập")
    return user


# ══════════════════════════════════════════════════════════════
# PUBLIC ROUTES — Không cần đăng nhập
# ══════════════════════════════════════════════════════════════

@public_router.post("/send-otp")
async def send_otp_route(
    data: SendOTPRequest,
    session: Session = Depends(get_session)
):
    """Gửi mã OTP qua email - Hỗ trợ cả đăng ký và reset mật khẩu"""

    user = find_user_by_email(session, data.email)

    if data.purpose == "register":
        # Đăng ký: email phải CHƯA tồn tại
        if user:
            raise HTTPException(
                status_code=400,
                detail="Email này đã được sử dụng để đăng ký"
            )

    elif data.purpose == "reset":
        # Quên mật khẩu: email PHẢI đã tồn tại
        if not user:
            raise HTTPException(
                status_code=400,
                detail="Email này chưa được đăng ký trên hệ thống"
            )
    else:
        raise HTTPException(
            status_code=400,
            detail="Purpose không hợp lệ. Chỉ chấp nhận 'register' hoặc 'reset'"
        )

    # Gửi OTP
    success = await send_otp(data.email, session)

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Không thể gửi OTP. Vui lòng thử lại sau."
        )

    return {
        "success": True,
        "message": "Đã gửi mã OTP đến email của bạn",
        "purpose": data.purpose
    }


@public_router.post("/register-otp", response_model=TokenOut, status_code=201)
def register_otp_route(
    data: RegisterWithOTP,
    response: Response,
    session: Session = Depends(get_session)
):
    """Xác thực OTP và tạo tài khoản"""
    # Kiểm tra OTP
    if not verify_otp(data.email, data.otp, session):
        raise HTTPException(
            status_code=400,
            detail="Mã OTP không hợp lệ hoặc đã hết hạn"
        )

    # Kiểm tra email chưa được dùng (phòng trường hợp race condition)
    if find_user_by_email(session, data.email):
        raise HTTPException(
            status_code=400,
            detail="Email này đã được sử dụng"
        )

    # Tạo user
    user_data = UserRegister(
        ho_ten=data.ho_ten,
        email=data.email,
        so_dien_thoai=data.so_dien_thoai,
        password=data.password
    )

    user = create_user(session, user_data)

    # Tạo token và set cookie
    token = create_access_token({"sub": str(user.id)})
    set_auth_cookie(response, token)

    return TokenOut(
        access_token=token,
        token_type="bearer",
        user=to_user_out(user)
    )

@public_router.post("/verify-otp")
def verify_otp_route(
    data: dict,   # nhận email + otp + purpose
    session: Session = Depends(get_session)
):
    """Xác thực OTP cho cả đăng ký và reset mật khẩu"""
    email = data.get("email")
    otp = data.get("otp")
    purpose = data.get("purpose", "register")

    if not email or not otp:
        raise HTTPException(status_code=400, detail="Email và OTP là bắt buộc")

    if not verify_otp(email, otp, session, purpose):
        raise HTTPException(
            status_code=400,
            detail="Mã OTP không đúng hoặc đã hết hạn"
        )

    return {
        "success": True,
        "message": "Xác thực OTP thành công",
        "purpose": purpose
    }

@public_router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    session: Session = Depends(get_session)
):
    """Đặt lại mật khẩu - Sử dụng argon2 (ổn định, không giới hạn 72 bytes)"""
    try:
        print(f"🔄 [RESET-PASSWORD] Nhận request | email={data.email} | pass_length={len(data.new_password)}")

        if len(data.new_password) < 6:
            raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 6 ký tự")

        user = find_user_by_email(session, data.email)
        if not user:
            print(f"❌ Không tìm thấy user với email: {data.email}")
            raise HTTPException(status_code=400, detail="Email chưa được đăng ký trên hệ thống")

        # Hash bằng argon2 (không cần truncate)
        hashed_password = pwd_context.hash(data.new_password)
        print("✅ Hash mật khẩu thành công (argon2)")

        user.password_hash = hashed_password
        session.add(user)
        session.commit()
        session.refresh(user)

        print(f"✅ Đặt lại mật khẩu THÀNH CÔNG cho {data.email}")

        return {
            "success": True,
            "message": "Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập ngay."
        }

    except HTTPException as e:
        session.rollback()
        print(f"⚠️ HTTP Error: {e.detail}")
        raise

    except Exception as e:
        session.rollback()
        import traceback
        print("❌ LỖI KHÔNG MONG MUỐN:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Đặt lại mật khẩu thất bại. Vui lòng thử lại sau.")

@public_router.post("/register", response_model=TokenOut, status_code=201)
def register(
    data: UserRegister,
    response: Response,
    session: Session = Depends(get_session)
):
    """Đăng ký truyền thống (không dùng OTP)"""
    if find_user_by_email(session, data.email):
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")

    user = create_user(session, data)
    token = create_access_token({"sub": str(user.id)})
    set_auth_cookie(response, token)

    return TokenOut(
        access_token=token,
        token_type="bearer",
        user=to_user_out(user)
    )


@public_router.post("/login", response_model=TokenOut)
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

    return TokenOut(
        access_token=token,
        token_type="bearer",
        user=to_user_out(user)
    )


@public_router.post("/logout")
def logout(response: Response):
    delete_auth_cookie(response)
    return {"success": True, "message": "Đăng xuất thành công"}


# ══════════════════════════════════════════════════════════════
# PRIVATE ROUTES — Phải đăng nhập
# ══════════════════════════════════════════════════════════════

@private_router.get("/me", response_model=UserOut)
def get_me(request: Request, session: Session = Depends(get_session)):
    user = get_user_or_401(request, session)
    return to_user_out(user)


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

    success = change_password(session, user, data)
    if not success:
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
    from app.models.dang_tin import DangTin
    tins = session.exec(
        select(DangTin)
        .where(DangTin.user_id == user.id)
        .order_by(DangTin.created_at.desc())
    ).all()
    return {"total": len(tins), "data": tins}