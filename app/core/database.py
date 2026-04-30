import os

from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings

from dotenv import load_dotenv

load_dotenv(override=True)

DATABASE_URL = settings.DATABASE_URL

# debugging
print("="*60)
print("DEBUG DATABASE_URL:")
print("Raw value từ settings :", repr(settings.DATABASE_URL))   # quan trọng nhất
print("Từ os.getenv         :", repr(os.getenv("DATABASE_URL")))
print("="*60)

# Thử parse
try:
    engine = create_engine(
        settings.DATABASE_URL,
        echo=False,
        pool_pre_ping=True
    )
    print("✅ Parse URL thành công!")
except Exception as e:
    print("❌ Lỗi parse:", e)

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
    pool_pre_ping=True,        
)

def init_db():
    from app.models.user import User          
    from app.models.cars import Car, CarImage 
    from app.models.uu_dai import UuDai
    from app.models.dang_tin import DangTin   
    from app.models.news import News          
    from app.models.lai_thu import LaiThu     
    from app.models.lien_he import LienHe     

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