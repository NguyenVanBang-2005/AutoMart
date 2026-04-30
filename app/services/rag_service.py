from sqlalchemy import text
from sqlmodel import Session
from app.core.database import engine
from app.services.embedding_service import get_embedding


async def retrieve_relevant_cars(query: str, k: int = 3) -> str:
    try:
        query_vec = await get_embedding(query)
        vec_str = "[" + ",".join(str(x) for x in query_vec) + "]"

        with Session(engine) as session:
            rows = session.execute(
                text("""
                    SELECT hang, dong, nam, gia, km, loai
                    FROM cars
                    WHERE embedding IS NOT NULL
                    ORDER BY embedding <=> CAST(:vec AS vector)
                    LIMIT :k
                """),
                {"vec": vec_str, "k": k}
            ).fetchall()

        if not rows:
            return ""

        lines = []
        for r in rows:
            lines.append(
                f"- {r.hang} {r.dong} ({r.nam}) | "
                f"{r.gia:,} VNĐ | {r.km:,} km | {r.loai}"
            )
        return "XE PHÙ HỢP TRONG KHO (dữ liệu thực):\n" + "\n".join(lines)

    except Exception as e:
        print(f"[RAG] retrieve_cars error: {e}")
        return ""


async def retrieve_relevant_news(query: str, k: int = 2) -> str:
    try:
        query_vec = await get_embedding(query)
        vec_str = "[" + ",".join(str(x) for x in query_vec) + "]"

        with Session(engine) as session:
            rows = session.execute(
                text("""
                    SELECT title, description
                    FROM news
                    WHERE embedding IS NOT NULL
                    ORDER BY embedding <=> CAST(:vec AS vector)
                    LIMIT :k
                """),
                {"vec": vec_str, "k": k}
            ).fetchall()

        if not rows:
            return ""

        lines = [f"- {r.title}: {r.description}" for r in rows]
        return "TIN TỨC & TƯ VẤN LIÊN QUAN:\n" + "\n".join(lines)

    except Exception as e:
        print(f"[RAG] retrieve_news error: {e}")
        return ""