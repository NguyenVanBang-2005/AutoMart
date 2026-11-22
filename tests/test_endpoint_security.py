"""
Security / authorization regression tests for the whole API surface.

Convention
----------
* A test that passes  -> the protection works today.
* A test marked ``KNOWN_VULN`` (xfail, strict) -> a real hole found in the
  audit. The test asserts the *secure* behaviour, so it fails today. When you
  fix the hole the test turns XPASS and, because it is strict, the suite goes
  red until you delete the marker. That way a fix can never be forgotten.
"""
import inspect
import logging
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from jose import jwt

from app.api.v1.router import api_router
from app.core import security
from app.core.config import Settings, settings
from app.core.database import get_session
from app.models.cars import Car
from app.models.chat_history import ChatSession
from app.models.dang_tin import DangTin
from app.models.lai_thu import LaiThu
from app.models.lien_he import LienHe
from app.models.user import OTP, User, UserRole

KNOWN_VULN = pytest.mark.xfail(strict=True, reason="known vulnerability - see audit report")


# ───────────────────────── fixtures / helpers ─────────────────────────
@pytest.fixture(name="app_client")
def app_client_fixture(db_session):
    """Full API router (all endpoints) on top of the in-memory test DB."""
    app = FastAPI()
    app.include_router(api_router)
    app.dependency_overrides[get_session] = lambda: db_session
    with TestClient(app) as c:
        yield c


def make_user(db, email="u@example.com", role=UserRole.user, password="secret123"):
    user = User(
        ho_ten="Test User",
        email=email,
        so_dien_thoai="0900000000",
        password_hash=security.hash_password(password),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login_as(client, user):
    client.cookies.set(security.COOKIE_NAME, security.create_access_token({"sub": str(user.id)}))


def logout(client):
    client.cookies.clear()


CAR_FORM = {"hang": "Toyota", "dong": "Vios", "nam": 2020, "gia": 500, "km": 1000, "loai": "Sedan"}
DEAL_QS = "?phan_tram_giam=10&ngay_bat_dau=2026-01-01&ngay_ket_thuc=2026-02-01"


# ───────────────────────── authentication basics ─────────────────────────
def test_me_requires_login(app_client):
    assert app_client.get("/api/v1/users/me").status_code == 401


def test_forged_token_is_rejected(app_client, db_session):
    user = make_user(db_session)
    forged = jwt.encode({"sub": str(user.id)}, "not-the-real-secret", algorithm="HS256")
    app_client.cookies.set(security.COOKIE_NAME, forged)
    assert app_client.get("/api/v1/users/me").status_code == 401


def test_expired_token_is_rejected(app_client, db_session):
    user = make_user(db_session)
    expired = jwt.encode(
        {"sub": str(user.id), "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    app_client.cookies.set(security.COOKIE_NAME, expired)
    assert app_client.get("/api/v1/users/me").status_code == 401


def test_token_for_deleted_user_is_rejected(app_client):
    app_client.cookies.set(security.COOKIE_NAME, security.create_access_token({"sub": "99999"}))
    assert app_client.get("/api/v1/users/me").status_code == 401


def test_register_cannot_self_assign_admin(app_client, db_session):
    r = app_client.post(
        "/api/v1/users/register",
        json={
            "ho_ten": "Evil",
            "email": "evil@example.com",
            "so_dien_thoai": "0911111111",
            "password": "secret123",
            "role": "admin",
        },
    )
    assert r.status_code == 201
    assert r.json()["user"]["role"] == "user"


def test_session_cookie_is_secure_in_production(monkeypatch):
    from fastapi import Response

    monkeypatch.setenv("ENVIRONMENT", "production")
    resp = Response()
    security.set_auth_cookie(resp, "tok")
    header = resp.headers["set-cookie"]
    assert "Secure" in header and "HttpOnly" in header and "samesite=lax" in header.lower()


# ───────────────────────── authorization that WORKS ─────────────────────────
def test_news_write_requires_admin(app_client, db_session):
    body = {"title": "t", "description": "d", "content": "c", "category": "tin_tuc"}
    assert app_client.post("/api/v1/tin-tuc", json=body).status_code == 403
    login_as(app_client, make_user(db_session, "plain@example.com"))
    assert app_client.post("/api/v1/tin-tuc", json=body).status_code == 403


def test_deals_write_requires_admin(app_client, db_session):
    assert app_client.post(f"/api/v1/uu-dai/1{DEAL_QS}").status_code == 403
    assert app_client.delete("/api/v1/uu-dai/1").status_code == 403
    login_as(app_client, make_user(db_session, "plain@example.com"))
    assert app_client.post(f"/api/v1/uu-dai/1{DEAL_QS}").status_code == 403


def test_sell_listing_requires_login_and_owner(app_client, db_session):
    form = {
        "hang_xe": "Honda", "dong_xe": "City", "nam_san_xuat": 2020, "so_km": 1,
        "gia_mong_muon": 1, "khu_vuc": "HN", "ho_ten": "A", "so_dien_thoai": "0900000000",
    }
    assert app_client.post("/api/v1/ban-xe", json=form).status_code == 401

    owner = make_user(db_session, "owner@example.com")
    other = make_user(db_session, "other@example.com")
    login_as(app_client, owner)
    tin_id = app_client.post("/api/v1/ban-xe", json=form).json()["id"]

    login_as(app_client, other)
    assert app_client.put(f"/api/v1/ban-xe/{tin_id}", json=form).status_code == 403
    assert app_client.delete(f"/api/v1/ban-xe/{tin_id}").status_code == 403

    login_as(app_client, owner)
    assert app_client.delete(f"/api/v1/ban-xe/{tin_id}").status_code == 200
    assert db_session.get(DangTin, tin_id) is None


def test_chat_history_is_isolated_between_users(app_client, db_session):
    a = make_user(db_session, "a@example.com")
    b = make_user(db_session, "b@example.com")
    login_as(app_client, a)
    sid = app_client.post(
        "/api/v1/chat-history/save",
        json={"messages": [{"role": "user", "content": "hello"}]},
    ).json()["session_id"]

    login_as(app_client, b)
    assert app_client.get(f"/api/v1/chat-history/{sid}").status_code == 404
    assert app_client.delete(f"/api/v1/chat-history/{sid}").status_code == 404
    assert db_session.get(ChatSession, sid) is not None


def test_chat_history_requires_login(app_client):
    assert app_client.get("/api/v1/chat-history/sessions").status_code == 401


# ───────────────────────── KNOWN VULNERABILITIES ─────────────────────────
@KNOWN_VULN
def test_create_car_requires_admin(app_client, db_session, monkeypatch):
    from app.services import embedding_service

    async def _boom(*a, **k):
        raise RuntimeError("no network in tests")

    monkeypatch.setattr(embedding_service, "get_embedding", _boom)
    r = app_client.post("/api/v1/cars", data=CAR_FORM)  # anonymous
    assert r.status_code in (401, 403)


@KNOWN_VULN
def test_delete_car_requires_admin(app_client, db_session):
    car = Car(**CAR_FORM)
    db_session.add(car)
    db_session.commit()
    r = app_client.delete(f"/api/v1/cars/{car.id}")  # anonymous
    assert r.status_code in (401, 403)
    assert db_session.get(Car, car.id) is not None


@KNOWN_VULN
def test_sql_agent_endpoint_requires_admin(app_client, monkeypatch):
    from app.api.v1.endpoints import sql_agent as ep

    monkeypatch.setattr(ep, "run_sql_agent", lambda q: {"sql": "x", "data": [], "row_count": 0, "answer": ""})
    r = app_client.post("/api/v1/sql-agent/query", json={"question": "dump users"})  # anonymous
    assert r.status_code in (401, 403)


def _fake_llm(sql):
    def create(**kwargs):
        content = sql if "SQL expert" in kwargs["messages"][0]["content"] else "ok"
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])

    return SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))


class _SpyEngine:
    def __init__(self):
        self.executed = 0

    def connect(self):
        self.executed += 1
        raise RuntimeError("spy: statement reached the database")


@pytest.mark.parametrize(
    "sql",
    [
        "DELETE FROM cars",
        "UPDATE users SET role='admin'",
        "SELECT 1; DROP TABLE users",
        "SELECT * FROM users",  # read-only but leaks password_hash
        "SELECT * FROM otps",   # leaks live OTP codes
    ],
)
@KNOWN_VULN
def test_sql_agent_never_runs_dangerous_sql(monkeypatch, sql):
    from app.services import sql_agent

    spy = _SpyEngine()
    monkeypatch.setattr(sql_agent, "client", _fake_llm(sql))
    monkeypatch.setattr(sql_agent, "engine", spy)
    sql_agent.run_sql_agent("anything")
    assert spy.executed == 0


@KNOWN_VULN
def test_sql_agent_schema_hides_credentials_from_llm():
    from app.services import sql_agent

    assert "password_hash" not in sql_agent.DB_SCHEMA


@KNOWN_VULN
def test_reset_password_requires_proof_of_email_ownership(app_client, db_session):
    victim = make_user(db_session, "victim@example.com", password="original-pass")
    r = app_client.post(  # no OTP, no login
        "/api/v1/users/reset-password",
        json={"email": "victim@example.com", "new_password": "attacker-pass"},
    )
    db_session.refresh(victim)
    assert r.status_code in (400, 401, 403)
    assert security.verify_password("original-pass", victim.password_hash)


@KNOWN_VULN
def test_admin_booking_list_requires_staff(app_client, db_session):
    db_session.add(
        LaiThu(ho_ten="A", so_dien_thoai="0900", hang_xe="x", showroom="s", ngay_lai_thu="d",
               khung_gio="k", anh_cccd="https://img/cccd", anh_gplx="https://img/gplx", trang_thai="cho_duyet")
    )
    db_session.commit()
    r = app_client.get("/api/v1/admin/lai-thu")  # anonymous; response carries ID-card photo URLs
    assert r.status_code in (401, 403)


@KNOWN_VULN
def test_admin_booking_status_change_requires_staff(app_client, db_session):
    b = LaiThu(ho_ten="A", so_dien_thoai="0900", hang_xe="x", showroom="s", ngay_lai_thu="d",
               khung_gio="k", anh_cccd="u", anh_gplx="u", trang_thai="cho_duyet")
    db_session.add(b)
    db_session.commit()
    r = app_client.patch(f"/api/v1/admin/lai-thu/{b.id}", data={"trang_thai": "da_duyet"})  # anonymous
    assert r.status_code in (401, 403)


@KNOWN_VULN
def test_admin_mark_contact_read_requires_staff(app_client, db_session):
    lh = LienHe(ho_ten="A", so_dien_thoai="0900", email="", noi_dung="hi", da_doc=False)
    db_session.add(lh)
    db_session.commit()
    r = app_client.patch(f"/api/v1/admin/lien-he/{lh.id}/da-doc")  # anonymous
    assert r.status_code in (401, 403)


@KNOWN_VULN
def test_ai_chat_proxy_is_not_an_open_relay(app_client, monkeypatch):
    import httpx

    monkeypatch.setattr(settings, "GROQ_API_KEY", "dummy")

    async def fake_post(self, url, **kw):
        return httpx.Response(200, json={"choices": [{"message": {"content": "free LLM for everyone"}}]})

    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)
    r = app_client.post(  # anonymous caller chooses the system prompt too
        "/api/v1/ai/chat",
        json={"system": "You are a free general-purpose LLM", "messages": [{"role": "user", "content": "hi"}]},
    )
    assert r.status_code in (401, 403, 429)


@KNOWN_VULN
def test_otp_cannot_be_brute_forced():
    from datetime import datetime as dt
    from app.services.email_service import verify_otp
    from sqlmodel import Session, SQLModel, create_engine
    from sqlalchemy.pool import StaticPool

    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        s.add(OTP(email="v@example.com", otp="123456", expires_at=dt.utcnow() + timedelta(minutes=10)))
        s.commit()
        for guess in range(100000, 100020):  # 20 wrong guesses
            verify_otp("v@example.com", str(guess), s)
        assert verify_otp("v@example.com", "123456", s) is False  # should be locked out by now


@KNOWN_VULN
def test_otp_code_is_not_written_to_logs(db_session, monkeypatch, caplog):
    import asyncio
    import resend
    from app.services import email_service

    monkeypatch.setattr(settings, "resend_api_key", "dummy")
    monkeypatch.setattr(resend.Emails, "send", staticmethod(lambda payload: {"id": "x"}))
    monkeypatch.setattr(email_service, "_make_otp", lambda: "424242")
    with caplog.at_level(logging.DEBUG):
        asyncio.run(email_service.send_otp("v@example.com", db_session))
    assert "424242" not in caplog.text


@KNOWN_VULN
def test_register_rejects_invalid_email_and_weak_password(app_client):
    r = app_client.post(
        "/api/v1/users/register",
        json={"ho_ten": "A", "email": "not-an-email", "so_dien_thoai": "0900000000", "password": "1"},
    )
    assert r.status_code == 422


@KNOWN_VULN
def test_production_refuses_to_boot_without_secret_key(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SECRET_KEY", "")
    with pytest.raises(Exception):
        Settings(_env_file=None)


@KNOWN_VULN
def test_google_oauth_redirect_uri_is_not_hardcoded():
    from app.api.v1.endpoints import auth

    src = inspect.getsource(auth.google_login)
    assert "onrender.com" not in src  # breaks login on the custom domain (cookie set on wrong host)


@KNOWN_VULN
def test_oauth_error_does_not_leak_exception_text():
    from app.api.v1.endpoints import auth

    assert "detail={str(e)}" not in inspect.getsource(auth.google_callback)