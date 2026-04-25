from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import httpx

from app.models.forms import ConsultForm
from app.core.config import settings

router = APIRouter()


# ── Schema cho chat ────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str      # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    system_prompt: str = ""


# ── POST /tu-van — đăng ký tư vấn ─────────────────────────
@router.post("/tu-van")
def tu_van(form: ConsultForm):
    # TODO: lưu lịch tư vấn vào DB
    return {"success": True, "message": "Đăng ký tư vấn thành công!"}


# ── POST /tu-van/chat — chat với Groq AI ──────────────────
@router.post("/tu-van/chat")
async def tu_van_chat(req: ChatRequest):
    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY chưa được cấu hình")

    # Build messages: system prompt đứng đầu
    messages = [{"role": "system", "content": req.system_prompt}]
    messages += [{"role": m.role, "content": m.content} for m in req.messages[-20:]]

    payload = {
        "model": "llama-3.3-70b-versatile",
        "max_tokens": 1024,
        "temperature": 0.7,
        "messages": messages,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )

    if res.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Groq API lỗi: {res.text}")

    data = res.json()
    reply = data["choices"][0]["message"]["content"]
    return {"reply": reply}