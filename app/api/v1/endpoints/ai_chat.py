from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import httpx
from app.core.config import settings
from app.services.rag_service import retrieve_relevant_cars, retrieve_relevant_news

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    system_prompt: str

@router.post("/ai/chat")
async def ai_chat_legacy(payload: ChatRequest):
    return await tu_van_chat(payload)