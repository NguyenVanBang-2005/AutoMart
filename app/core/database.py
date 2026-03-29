from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,

    # Connection pooling
    pool_size=10,           # số kết nối duy trì sẵn
    max_overflow=20,        # số kết nối tạm thêm khi quá tải
    pool_timeout=30,        # giây chờ lấy kết nối trước khi báo lỗi
    pool_recycle=1800,      # tái sử dụng kết nối sau 30 phút (tránh timeout)
    pool_pre_ping=True,     # kiểm tra kết nối còn sống trước khi dùng
    connect_args={"sslmode": "disable"},
)


def init_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session

if __name__ == "__main__":
    print("🔗 Connecting to:", settings.DATABASE_URL)
    try:
        with engine.connect() as conn:
            print("✅ Kết nối Supabase thành công!")
    except Exception as e:
        print("❌ Lỗi kết nối:", e)