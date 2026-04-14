from sqlmodel import Session, select
from app.models.news import News, NewsCreate, NewsCategory
from typing import Optional


def get_all_news(session: Session, category: Optional[NewsCategory] = None):
    q = select(News).order_by(News.created_at.desc())
    if category:
        q = q.where(News.category == category)
    return session.exec(q).all()


def get_news_by_id(session: Session, news_id: int) -> Optional[News]:
    return session.get(News, news_id)


def create_news(session: Session, data: NewsCreate) -> News:
    news = News(**data.model_dump())
    session.add(news)
    session.commit()
    session.refresh(news)
    return news


def delete_news(session: Session, news_id: int) -> bool:
    news = session.get(News, news_id)
    if not news:
        return False
    session.delete(news)
    session.commit()
    return True