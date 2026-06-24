import os

os.environ.setdefault("APP_NAME", "AutoMart Test")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-automart-tests")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
os.environ.setdefault("ENVIRONMENT", "development")

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine

from app.api.v1.endpoints import cars
from app.api.v1.endpoints.user import public_router
from app.core.database import get_session
from app.models.cars import Car, CarImage
from app.models.chat_history import ChatMessage, ChatSession
from app.models.dang_tin import DangTin
from app.models.lai_thu import LaiThu
from app.models.lien_he import LienHe
from app.models.news import News
from app.models.user import OTP, User
from app.models.uu_dai import UuDai


@pytest.fixture(name="db_session")
def db_session_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)


@pytest.fixture(name="client")
def client_fixture(db_session):
    app = FastAPI()
    app.include_router(cars.router, prefix="/api/v1")
    app.include_router(public_router, prefix="/api/v1")

    def override_get_session():
        yield db_session

    app.dependency_overrides[get_session] = override_get_session

    with TestClient(app) as test_client:
        yield test_client
