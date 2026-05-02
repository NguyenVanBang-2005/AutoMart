import secrets
import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlmodel import Session, select
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib

from app.core.config import settings
from app.models.user import OTP

logger = logging.getLogger(__name__)


def _make_otp() -> str:
    """Tạo OTP 6 số an toàn"""
    return f"{secrets.randbelow(900000) + 100000}"


async def send_otp(email: str, session: Session) -> bool:
    """Gửi OTP và lưu vào database - ĐÃ CÓ LOG CHI TIẾT"""

    logger.info(f"📧 Gmail user: {settings.gmail_user}")
    logger.info(f"📧 Gmail pass set: {bool(settings.gmail_app_password)}")
    logger.info(f"📧 Gmail pass length: {len(settings.gmail_app_password) if settings.gmail_app_password else 0}")

    if not settings.gmail_user or not settings.gmail_app_password:
        logger.error("❌ Gmail credentials chưa được cấu hình")
        return False

    # Xóa tất cả OTP cũ của email này
    old_otps = session.exec(select(OTP).where(OTP.email == email)).all()
    for old in old_otps:
        session.delete(old)
    session.commit()

    # Tạo OTP mới
    otp_code = _make_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    otp_record = OTP(
        email=email,
        otp=otp_code,
        expires_at=expires_at
    )
    session.add(otp_record)
    session.commit()

    logger.info(f"🔑 OTP ĐÃ TẠO cho {email} | Mã: {otp_code} | Hết hạn: {expires_at}")

    # === Phần gửi email (giữ nguyên) ===
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "[AutoMart] Mã xác thực"
    msg["From"] = f"AutoMart <{settings.gmail_user}>"
    msg["To"] = email

    html = f"""
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
      <h2 style="color:#1a1a1a;text-align:center;">Auto<span style="color:#c8a96e;">Mart</span></h2>
      <div style="background:#fff;border-radius:12px;padding:32px;text-align:center;">
        <p style="color:#374151;font-size:15px;">Mã xác thực của bạn là:</p>
        <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#c8a96e;margin:20px 0;">
          {otp_code}
        </div>
        <p style="color:#64748b;font-size:14px;">Mã có hiệu lực trong <strong>10 phút</strong>.<br>Không chia sẻ với ai.</p>
      </div>
    </div>
    """

    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.gmail_user, settings.gmail_app_password)
            server.sendmail(settings.gmail_user, email, msg.as_string())

        logger.info(f"✅ OTP đã gửi thành công đến {email}")
        return True

    except Exception as e:
        logger.error(f"❌ Gửi OTP thất bại cho {email}: {e}")
        session.rollback()
        return False


def verify_otp(email: str, otp: str, session: Session, purpose: str = "register") -> bool:
    """Kiểm tra OTP - ĐÃ CÓ LOG CHI TIẾT ĐỂ DEBUG"""
    logger.info(f"🔍 VERIFY OTP | Email: {email} | Nhập: {otp} | Purpose: {purpose}")

    record = session.exec(
        select(OTP)
        .where(OTP.email == email)
        .where(OTP.expires_at > datetime.utcnow())
    ).first()

    if not record:
        logger.warning(f"❌ Không tìm thấy OTP hợp lệ cho {email}")
        return False

    logger.info(f"📦 OTP trong DB: {record.otp} | Hết hạn: {record.expires_at}")

    if record.otp != otp:
        logger.warning(f"❌ OTP KHÔNG KHỚP! Nhập: {otp} | DB: {record.otp}")
        return False

    # Xóa OTP sau khi verify thành công
    session.delete(record)
    session.commit()

    logger.info(f"✅ OTP XÁC THỰC THÀNH CÔNG cho {email} (purpose: {purpose})")
    return True