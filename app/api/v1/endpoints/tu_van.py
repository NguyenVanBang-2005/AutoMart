from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import httpx
from app.models.forms import ConsultForm
from app.core.config import settings

router = APIRouter()


# ── Schema cho chat ────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    system_prompt: str = ""


# ── Từ khóa nhận biết câu hỏi liên quan DB ────────────────
DB_KEYWORDS = [
    # hãng xe
    'xe', 'hang', 'hãng', 'gia', 'giá', 'toyota', 'honda', 'kia', 'mazda',
    'hyundai', 'ford', 'bmw', 'mercedes', 'vinfast',
    # model phổ biến
    'morning', 'vios', 'camry', 'corolla', 'civic', 'city', 'crv', 'hrv',
    'fortuner', 'innova', 'veloz', 'xpander', 'seltos', 'carnival',
    'vf3', 'vf5', 'vf6', 'vf7', 'vf8', 'vf9',
    # câu hỏi thường gặp có/không dấu
    'bao nhieu', 'bao nhiêu', 'con khong', 'còn không', 'co khong', 'có không',
    'shop co', 'shop có', 'km', 'nam', 'năm',
    're nhat', 'rẻ nhất', 'dat nhat', 'đắt nhất',
    'tim', 'tìm', 'goi y', 'gợi ý', 'de xuat', 'đề xuất',
    'mua', 'chon', 'chọn', 'phu hop', 'phù hợp',
    'ngan sach', 'ngân sách', 'trieu', 'triệu', 'ty', 'tỷ',
    # so sánh
    'so sanh', 'so sánh', 'phan khuc', 'phân khúc',
]

def _needs_db(question: str) -> bool:
    q = question.lower()
    return any(kw in q for kw in DB_KEYWORDS)


def _query_cars_context(question: str, history: list) -> str:
    try:
        from app.services.sql_agent import run_sql_agent

        # Resolve đại từ mơ hồ ("xe đó", "xe này"...) từ history
        VAGUE_REFS = [
            'xe đó', 'xe do', 'chiếc đó', 'chiec do',
            'xe này', 'xe nay', 'xe trên', 'xe tren',
            'nó', 'cái đó', 'cai do',
        ]
        enriched = question
        if any(ref in question.lower() for ref in VAGUE_REFS):
            for msg in reversed(history):
                if msg.get('role') == 'assistant' and any(
                    brand in msg['content']
                    for brand in ['Toyota', 'Honda', 'Kia', 'Mazda', 'Hyundai',
                                  'Ford', 'BMW', 'Mercedes', 'VinFast']
                ):
                    for line in msg['content'].split('\n'):
                        if any(b in line for b in ['Toyota', 'Honda', 'Kia', 'Mazda',
                                                    'Hyundai', 'Ford', 'BMW', 'Mercedes', 'VinFast']):
                            enriched = question + f" (xe được nhắc đến: {line.strip()})"
                            break
                    break

        result = run_sql_agent(enriched)
        print(f"[SQL Agent] Question: {enriched}")
        print(f"[SQL Agent] SQL: {result.get('sql')}")
        print(f"[SQL Agent] Row count: {result.get('row_count')}")
        print(f"[SQL Agent] Data: {result.get('data')}")

        if result.get('error') or not result.get('data'):
            return ''

        rows = result['data']
        lines = []
        for r in rows[:10]:
            lines.append(
                'ID:{id} | {hang} {dong} | Năm:{nam} | Giá:{gia:,}đ | KM:{km:,} | Loại:{loai}'.format(
                    id=r.get('id', ''),
                    hang=r.get('hang', ''),
                    dong=r.get('dong', ''),
                    nam=r.get('nam', ''),
                    gia=int(r.get('gia') or 0),
                    km=int(r.get('km') or 0),
                    loai=r.get('loai', ''),
                )
            )
        return '\n'.join(lines)
    except Exception as e:
        print(f'[SQL Agent] Lỗi: {e}')
        return ''


# ── POST /tu-van — đăng ký tư vấn ─────────────────────────
@router.post("/tu-van")
def tu_van(form: ConsultForm):
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

    # SQL Agent
    db_block = ""
    if _needs_db(last_user_msg):
        history_dicts = [{"role": m.role, "content": m.content} for m in req.messages]
        db_data = _query_cars_context(last_user_msg, history_dicts)
        if db_data:
            db_block = (
                "\n\nDỮ LIỆU XE THỰC TẾ TRONG KHO AUTOMART (realtime từ database):\n"
                + db_data
                + "\n\nBẮT BUỘC:"
                + "\n- Chỉ gợi ý xe có trong danh sách trên, KHÔNG bịa xe ngoài danh sách."
                + "\n- Trích dẫn chính xác tên xe, năm, giá, số km từ danh sách."
                + "\n- Nếu danh sách trống, nói thật là hiện không có xe phù hợp."
            )

    full_system = req.system_prompt + db_block

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