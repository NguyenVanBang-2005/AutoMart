from sqlmodel import SQLModel, Session, create_engine

from app.core.config import settings


DATABASE_URL = settings.DATABASE_URL or "sqlite:///./automart.db"

if not DATABASE_URL.startswith("sqlite") and "sslmode" not in DATABASE_URL:
    if "?" in DATABASE_URL:
        DATABASE_URL += "&sslmode=require"
    else:
        DATABASE_URL += "?sslmode=require"

engine_kwargs = {"echo": settings.DEBUG}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs.update(
        pool_size=10,
        max_overflow=20,
        pool_timeout=30,
        pool_recycle=1800,
        pool_pre_ping=True,
    )

engine = create_engine(DATABASE_URL, **engine_kwargs)


def init_db():
    from app.models.cars import Car, CarImage  # noqa: F401
    from app.models.chat_history import ChatMessage, ChatSession  # noqa: F401
    from app.models.dang_tin import DangTin  # noqa: F401
    from app.models.lai_thu import LaiThu  # noqa: F401
    from app.models.lien_he import LienHe  # noqa: F401
    from app.models.news import News  # noqa: F401
    from app.models.user import OTP, User  # noqa: F401
    from app.models.uu_dai import UuDai  # noqa: F401

    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


if __name__ == "__main__":
    print("Connecting to:", DATABASE_URL)
    try:
        with engine.connect():
            print("Database connection succeeded.")
    except Exception as e:
        print("Database connection failed:", e)
