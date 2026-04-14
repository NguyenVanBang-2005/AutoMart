import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()

class Settings(BaseSettings):
    gmail_user: str = ""
    gmail_app_password: str = ""

    # OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    FACEBOOK_CLIENT_ID: str = ""
    FACEBOOK_CLIENT_SECRET: str = ""

    APP_NAME: str = "AutoMart"
    DEBUG: bool = True
    DATABASE_URL: str = "postgresql://Bang:trungHoang%402005@localhost:5432/automartdb"
    SECRET_KEY: str = "changeme"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    FRONTEND_URL: str = "http://localhost:3000"
    ENVIRONMENT: str = "development"
    CLOUDINARY_CLOUD_NAME: str = "di0dg1uru"
    CLOUDINARY_API_KEY: str = "186712837536447"
    CLOUDINARY_API_SECRET: str = "aWoW4l--DYXBDx-FVpjQ0cDFXjk"
    GROQ_API_KEY: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()