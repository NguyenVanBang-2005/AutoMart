from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_session
from app.core.security import get_current_user_from_cookie
from app.models.chat_history import ChatSession, ChatMessage
from fastapi import Request

router = APIRouter(prefix="/chat-history")


# ── Schemas ────────────────────────────────────────────────
class MessageIn(BaseModel):
    role: str
    content: str

class SaveRequest(BaseModel):
    session_id: Optional[int] = None
    messages: List[MessageIn]
    page: str = "tu_van"
    car_id: Optional[int] = None

class SessionOut(BaseModel):
    id: int
    title: str
    page: str
    car_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    preview: str = ""

class MessageOut(BaseModel):
    role: str
    content: str
    created_at: datetime


# ── POST /chat-history/save — lưu tin nhắn ────────────────
@router.post("/save")
def save_chat(
    req: SaveRequest,
    request: Request,
    session: Session = Depends(get_session),
):
    user = get_current_user_from_cookie(request, session)
    if not user:
        raise HTTPException(status_code=401, detail="Chưa đăng nhập")

    # Tạo session mới hoặc dùng session cũ
    if req.session_id:
        chat_session = session.get(ChatSession, req.session_id)
        if not chat_session or chat_session.user_id != user.id:
            raise HTTPException(status_code=404, detail="Session không tồn tại")
        chat_session.updated_at = datetime.utcnow()
    else:
        # Tạo title từ tin nhắn đầu tiên của user
        first_user_msg = ""
        for m in req.messages:
            if m.role == "user":
                first_user_msg = m.content[:50]
                break
        chat_session = ChatSession(
            user_id=user.id,
            title=first_user_msg or "Cuộc trò chuyện mới",
            page=req.page,
            car_id=req.car_id,
        )
        session.add(chat_session)
        session.commit()
        session.refresh(chat_session)

    # Lưu từng message
    for m in req.messages:
        msg = ChatMessage(
            session_id=chat_session.id,
            role=m.role,
            content=m.content,
        )
        session.add(msg)

    session.commit()

    return {"session_id": chat_session.id, "saved": len(req.messages)}


# ── GET /chat-history/sessions — danh sách sessions ───────
@router.get("/sessions", response_model=List[SessionOut])
def list_sessions(
    request: Request,
    page: str = None,
    session: Session = Depends(get_session),
):
    user = get_current_user_from_cookie(request, session)
    if not user:
        raise HTTPException(status_code=401, detail="Chưa đăng nhập")

    query = select(ChatSession).where(ChatSession.user_id == user.id)
    if page:
        query = query.where(ChatSession.page == page)
    query = query.order_by(ChatSession.updated_at.desc())

    sessions = session.exec(query).all()

    result = []
    for s in sessions:
        # Lấy preview từ message cuối
        last_msg = session.exec(
            select(ChatMessage)
            .where(ChatMessage.session_id == s.id)
            .order_by(ChatMessage.created_at.desc())
            .limit(1)
        ).first()
        preview = last_msg.content[:80] + "..." if last_msg and len(last_msg.content) > 80 else (last_msg.content if last_msg else "")

        result.append(SessionOut(
            id=s.id,
            title=s.title,
            page=s.page,
            car_id=s.car_id,
            created_at=s.created_at,
            updated_at=s.updated_at,
            preview=preview,
        ))

    return result


# ── GET /chat-history/{session_id} — load messages ────────
@router.get("/{session_id}", response_model=List[MessageOut])
def get_session_messages(
    session_id: int,
    request: Request,
    session: Session = Depends(get_session),
):
    user = get_current_user_from_cookie(request, session)
    if not user:
        raise HTTPException(status_code=401, detail="Chưa đăng nhập")

    chat_session = session.get(ChatSession, session_id)
    if not chat_session or chat_session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session không tồn tại")

    messages = session.exec(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    ).all()

    return [MessageOut(role=m.role, content=m.content, created_at=m.created_at) for m in messages]


# ── DELETE /chat-history/{session_id} — xóa session ───────
@router.delete("/{session_id}")
def delete_session(
    session_id: int,
    request: Request,
    session: Session = Depends(get_session),
):
    user = get_current_user_from_cookie(request, session)
    if not user:
        raise HTTPException(status_code=401, detail="Chưa đăng nhập")

    chat_session = session.get(ChatSession, session_id)
    if not chat_session or chat_session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session không tồn tại")

    # Xóa messages trước
    messages = session.exec(
        select(ChatMessage).where(ChatMessage.session_id == session_id)
    ).all()
    for m in messages:
        session.delete(m)

    session.delete(chat_session)
    session.commit()

    return {"deleted": session_id}