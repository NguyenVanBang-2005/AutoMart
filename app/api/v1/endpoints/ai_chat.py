from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import httpx
from app.core.config import settings

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    system: str

@router.post("/ai/chat")
async def ai_chat_proxy(payload: ChatRequest):
    if not settings.GROQ_API_KEY:
        return JSONResponse(status_code=503, content={"error": "AI chua duoc cau hinh."})

    messages = [{"role": "system", "content": payload.system}]
    for msg in payload.messages:
        messages.append({"role": msg.role, "content": msg.content})

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            res = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": "Bearer " + settings.GROQ_API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": messages,
                    "max_tokens": 1000,
                    "temperature": 0.7,
                },
            )
            data = res.json()
            if not res.is_success:
                return JSONResponse(
                    status_code=res.status_code,
                    content={"error": data.get("error", {}).get("message", "Groq error")}
                )
            text = data["choices"][0]["message"]["content"]
            # Trả về Anthropic format để frontend không đổi
            return JSONResponse(content={
                "content": [{"type": "text", "text": text}]
            })
        except httpx.TimeoutException:
            return JSONResponse(status_code=504, content={"error": "Timeout."})
        except Exception as e:
            return JSONResponse(status_code=500, content={"error": str(e)})