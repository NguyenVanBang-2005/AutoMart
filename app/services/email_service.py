import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

# Lưu OTP tạm trong memory
# key = email, value = { otp, expires }
_otp_store: dict[str, dict] = {}

def _make_otp() -> str:
    return str(random.randint(10000, 99999))

async def send_otp(email: str) -> bool:
    from app.core.config import settings

    otp = _make_otp()
    _otp_store[email] = {
        "otp":     otp,
        "expires": datetime.utcnow() + timedelta(minutes=5)
    }

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "[AutoMart] Mã xác thực đăng ký tài khoản"
    msg["From"]    = f"AutoMart <{settings.gmail_user}>"
    msg["To"]      = email

    html = f"""
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;
                padding:32px;background:#f8fafc;border-radius:16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h2 style="color:#1a1a1a;margin:0;">
          Auto<span style="color:#c8a96e;">Mart</span>
        </h2>
      </div>
      <div style="background:#fff;border-radius:12px;padding:32px;text-align:center;">
        <p style="color:#374151;font-size:15px;margin-bottom:8px;">
          Mã xác thực của bạn là:
        </p>
        <div style="font-size:36px;font-weight:800;letter-spacing:12px;
                    color:#c8a96e;margin:16px 0;">
          {otp}
        </div>
        <p style="color:#64748b;font-size:13px;">
          Mã có hiệu lực trong <strong>5 phút</strong>.
        </p>
        <p style="color:#64748b;font-size:13px;">
          Không chia sẻ mã này với bất kỳ ai.
        </p>
      </div>
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:24px;">
        © 2025 AutoMart. Nếu bạn không yêu cầu mã này, hãy bỏ qua email.
      </p>
    </div>
    """

    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.gmail_user, settings.gmail_app_password)
            server.sendmail(settings.gmail_user, email, msg.as_string())
        return True
    except Exception as e:
        import traceback
        print(f"Gmail SMTP error: {e}")
        traceback.print_exc()
        return False

def verify_otp(email: str, otp: str) -> bool:
    record = _otp_store.get(email)
    if not record:
        return False
    if datetime.utcnow() > record["expires"]:
        _otp_store.pop(email, None)
        return False
    if record["otp"] != otp:
        return False
    _otp_store.pop(email, None)
    return True