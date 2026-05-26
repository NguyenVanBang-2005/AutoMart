from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class ChatSession(SQLModel, table=True):
    __tablename__ = "chat_sessions"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    title: str = Field(default="Cuộc trò chuyện mới")
    page: str = Field(default="tu_van")
    car_id: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ChatMessage(SQLModel, table=True):
    __tablename__ = "chat_messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(index=True)
    role: str = Field()
    content: str = Field()
    created_at: datetime = Field(default_factory=datetime.utcnow)