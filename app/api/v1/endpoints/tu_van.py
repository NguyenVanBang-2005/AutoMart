from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import httpx
from app.services.rag_service import retrieve_relevant_cars, retrieve_relevant_news
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

    # Lấy câu hỏi mới nhất của user
    last_user_msg = ""
    for msg in reversed(req.messages):
        if msg.role == "user":
            last_user_msg = msg.content
            break

    # RAG: retrieve context từ DB
    cars_context = await retrieve_relevant_cars(last_user_msg, k=3)
    news_context = await retrieve_relevant_news(last_user_msg, k=2)

    rag_block = ""
    if cars_context:
        rag_block += f"\n\n{cars_context}"
    if news_context:
        rag_block += f"\n\n{news_context}"
    if rag_block:
        if rag_block:
            rag_block += (
                "\n\nĐÂY LÀ DỮ LIỆU XE THỰC TẾ TRONG KHO CỦA AUTOMART. "
                "Bắt buộc phải gợi ý các xe trong danh sách trên trước tiên. "
                "Không được nói 'không có xe phù hợp' nếu danh sách trên không rỗng. "
                "Trích dẫn chính xác tên xe, năm, giá, số km từ danh sách."
            )

    full_system = req.system_prompt + rag_block

    messages = [{"role": "system", "content": full_system}]
    messages += [{"role": m.role, "content": m.content} for m in req.messages[-20:]]

    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "max_tokens": 1024,
                "temperature": 0.7,
                "messages": messages,
            },
        )

    if res.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Groq API lỗi: {res.text}")

    data = res.json()
    reply = data["choices"][0]["message"]["content"]
    return {"reply": reply}