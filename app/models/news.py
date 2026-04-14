from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class NewsCategory(str, Enum):
    tin_tuc = "tin_tuc"
    hoi_dap = "hoi_dap"


class News(SQLModel, table=True):
    __tablename__ = "news"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    content: str
    thumbnail_url: Optional[str] = ""
    video_url: Optional[str] = ""
    category: NewsCategory = Field(default=NewsCategory.tin_tuc)
    author: str = Field(default="AutoMart")
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ── Request schemas ──────────────────────────────────
class NewsCreate(SQLModel):
    title: str
    description: str
    content: str
    thumbnail_url: Optional[str] = ""
    video_url: Optional[str] = ""
    category: NewsCategory = NewsCategory.tin_tuc
    author: str = "AutoMart"


class NewsOut(SQLModel):
    id: int
    title: str
    description: str
    content: str
    thumbnail_url: Optional[str]
    video_url: Optional[str] = ""
    category: NewsCategory
    author: str
    created_at: datetime