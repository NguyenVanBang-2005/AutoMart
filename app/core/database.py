from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,

    # Connection pooling
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True,
    connect_args={"sslmode": "disable"},
)


def init_db():
    # Import TẤT CẢ models ở đây để SQLModel.metadata biết các bảng cần tạo.
    # Thiếu import = bảng không được tạo dù model đã có file.
    from app.models.user import User          # noqa: F401
    from app.models.cars import Car, CarImage # noqa: F401
    from app.models.dang_tin import DangTin   # noqa: F401
    from app.models.news import News          # noqa: F401
    from app.models.lai_thu import LaiThu     # noqa: F401
    from app.models.lien_he import LienHe     # noqa: F401

    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


if __name__ == "__main__":
    print("🔗 Connecting to:", settings.DATABASE_URL)
    try:
        with engine.connect() as conn:
            print("✅ Kết nối thành công!")
    except Exception as e:
        print("❌ Lỗi kết nối:", e)