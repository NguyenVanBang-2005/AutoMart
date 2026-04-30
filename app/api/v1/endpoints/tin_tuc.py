from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.core.database import get_session
from app.core.security import get_current_user_from_cookie
from app.models.news import NewsCreate, NewsOut, NewsCategory
from app.models.user import UserRole
from app.services.news_service import get_all_news, get_news_by_id, create_news, delete_news
from fastapi import Request
from typing import Optional
from sqlalchemy import text

router = APIRouter(prefix="/tin-tuc")


def _require_admin(request: Request, session: Session = Depends(get_session)):
    user = get_current_user_from_cookie(request, session)
    if not user or user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Yêu cầu quyền Admin")
    return user


async def _index_news(session: Session, news):
    """Embed và lưu vector cho 1 bài tin tức."""
    try:
        from app.services.embedding_service import get_embedding
        text_content = f"{news.title or ''} {news.description or ''} {news.content or ''}"
        emb = await get_embedding(text_content)
        vec_str = "[" + ",".join(str(x) for x in emb) + "]"
        session.execute(
            text("UPDATE news SET embedding = CAST(:vec AS vector) WHERE id = :id"),
            {"vec": vec_str, "id": news.id}
        )
        session.commit()
        print(f"[RAG] Indexed news {news.id}: {news.title}")
    except Exception as e:
        print(f"[RAG] Index error news {news.id}: {e}")


@router.get("", response_model=list[NewsOut])
def list_news(
    category: Optional[NewsCategory] = None,
    session: Session = Depends(get_session)
):
    return get_all_news(session, category)


@router.get("/{news_id}", response_model=NewsOut)
def get_news(news_id: int, session: Session = Depends(get_session)):
    news = get_news_by_id(session, news_id)
    if not news:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
    return news


@router.post("", response_model=NewsOut, status_code=201)
async def post_news(
    data: NewsCreate,
    session: Session = Depends(get_session),
    admin=Depends(_require_admin)
):
    news = create_news(session, data)
    # Auto-index embedding sau khi tạo bài viết
    await _index_news(session, news)
    return news


@router.delete("/{news_id}", status_code=204)
def del_news(
    news_id: int,
    session: Session = Depends(get_session),
    admin=Depends(_require_admin)
):
    if not delete_news(session, news_id):
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")