from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings

# Sửa quan trọng cho Render
DATABASE_URL = settings.DATABASE_URL

# Thêm sslmode=require nếu chưa có
if DATABASE_URL and "sslmode" not in DATABASE_URL:
    if "?" in DATABASE_URL:
        DATABASE_URL += "&sslmode=require"
    else:
        DATABASE_URL += "?sslmode=require"

engine = create_engine(
    DATABASE_URL,
    echo=settings.DEBUG,

    # Connection pooling
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True,        # Rất quan trọng khi deploy
)

def init_db():
    # Import TẤT CẢ models ở đây để SQLModel.metadata biết các bảng cần tạo.
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
    print("🔗 Connecting to:", DATABASE_URL)
    try:
        with engine.connect() as conn:
            print("✅ Kết nối thành công!")
    except Exception as e:
        print("❌ Lỗi kết nối:", e)