# app/api/v1/endpoints/cars.py
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request
from sqlmodel import Session
from typing import List
from app.models.cars import CarFilter
from app.services.car_service import (
    get_cars, create_car, upload_car_image,
    add_car_image, get_car_images
)
from app.core.database import get_session
from fastapi.templating import Jinja2Templates
from sqlalchemy import text
from pydantic import BaseModel as PydanticBaseModel

templates = Jinja2Templates(directory="templates")
router = APIRouter(prefix="/cars")


# ── Helper: chuyển Car thành text để embed ─────────────────
def _car_to_text(car) -> str:
    parts = [
        car.hang or "",
        car.dong or "",
        str(car.nam) if car.nam else "",
        f"{car.gia:,} VNĐ" if car.gia else "",
        f"{car.km:,} km" if car.km else "",
        car.loai or "",
    ]
    return " ".join(p for p in parts if p)


# ── Helper: auto-index embedding cho 1 xe ──────────────────
async def _index_car(session: Session, car):
    try:
        from app.services.embedding_service import get_embedding
        emb = await get_embedding(_car_to_text(car))
        vec_str = "[" + ",".join(str(x) for x in emb) + "]"
        session.execute(
            text("UPDATE cars SET embedding = CAST(:vec AS vector) WHERE id = :id"),
            {"vec": vec_str, "id": car.id}
        )
        session.commit()
        print(f"[RAG] Indexed car {car.id}: {car.hang} {car.dong}")
    except Exception as e:
        print(f"[RAG] Index error car {car.id}: {e}")


# ── Helper: chuyển row thành dict ──────────────────────────
def _row_to_dict(r):
    return {
        "id": r.id,
        "hang": r.hang,
        "dong": r.dong,
        "nam": r.nam,
        "gia": r.gia,
        "km": r.km,
        "loai": r.loai,
        "anh": r.anh or "",
    }


# ── GET /cars ──────────────────────────────────────────────
@router.get("")
def list_cars(
    hang: str = None, loai: str = None,
    nam: int = None, gia_min: int = None, gia_max: int = None,
    session: Session = Depends(get_session)
):
    f = CarFilter(hang=hang, loai=loai, nam=nam, gia_min=gia_min, gia_max=gia_max)
    cars = get_cars(session, f)
    return {"cars": cars, "total": len(cars)}


# ── POST /cars ─────────────────────────────────────────────
@router.post("")
async def add_car(
    hang: str = Form(...),
    dong: str = Form(...),
    nam: int = Form(...),
    gia: int = Form(...),
    km: int = Form(...),
    loai: str = Form(...),
    images: List[UploadFile] = File(default=[]),
    session: Session = Depends(get_session)
):
    car_data = dict(hang=hang, dong=dong, nam=nam, gia=gia, km=km, loai=loai)
    car = create_car(session, car_data)

    for i, img_file in enumerate(images):
        if not img_file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail=f"File {img_file.filename} không phải ảnh")
        file_bytes = await img_file.read()
        if len(file_bytes) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"Ảnh {img_file.filename} vượt quá 5MB")
        name_without_ext = img_file.filename.rsplit(".", 1)[0]
        url = upload_car_image(file_bytes, f"car_{car.id}_{name_without_ext}")
        is_main = (i == 0)
        add_car_image(session, car.id, url, is_main=is_main)

    # Auto-index embedding sau khi tạo xe
    await _index_car(session, car)

    return {"message": "Đăng xe thành công", "car_id": car.id}


# ── DELETE /cars/{car_id} ──────────────────────────────────
@router.delete("/{car_id}")
def delete_car(car_id: int, session: Session = Depends(get_session)):
    from sqlmodel import select
    from app.models.cars import Car, CarImage

    car = session.get(Car, car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Không tìm thấy xe")

    images = session.exec(select(CarImage).where(CarImage.car_id == car_id)).all()
    for img in images:
        session.delete(img)

    session.delete(car)
    session.commit()
    return {"message": "Xóa xe thành công", "car_id": car_id}


# ── GET /cars/{car_id}/images ──────────────────────────────
@router.get("/{car_id}/images")
def list_car_images(car_id: int, session: Session = Depends(get_session)):
    images = get_car_images(session, car_id)
    return {"images": images}


# ── GET /cars/{car_id}/detail ──────────────────────────────
@router.get("/{car_id}/detail")
def car_detail_page(request: Request, car_id: int, session: Session = Depends(get_session)):
    from sqlmodel import select
    from app.models.cars import Car
    car = session.get(Car, car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Không tìm thấy xe")
    images = get_car_images(session, car_id)
    return templates.TemplateResponse("car_detail.html", {
        "request": request,
        "car": car,
        "images": images
    })


# ── POST /cars/semantic-search ─────────────────────────────
class SemanticSearchRequest(PydanticBaseModel):
    query: str
    k: int = 12

@router.post("/semantic-search")
async def semantic_search(req: SemanticSearchRequest, session: Session = Depends(get_session)):
    try:
        from app.services.embedding_service import get_embedding

        # Bước 1: keyword search trước
        keyword = f"%{req.query}%"
        keyword_rows = session.execute(
            text("""
                SELECT c.id, c.hang, c.dong, c.nam, c.gia, c.km, c.loai,
                       ci.url as anh
                FROM cars c
                LEFT JOIN car_images ci ON ci.car_id = c.id AND ci.is_main = true
                WHERE LOWER(c.hang || ' ' || c.dong) LIKE LOWER(:kw)
                LIMIT :k
            """),
            {"kw": keyword, "k": req.k}
        ).fetchall()

        # Nếu có kết quả keyword → trả về luôn
        if keyword_rows:
            return {
                "cars": [_row_to_dict(r) for r in keyword_rows],
                "total": len(keyword_rows),
                "query": req.query,
                "mode": "keyword"
            }

        # Bước 2: fallback sang semantic search
        emb = await get_embedding(req.query)
        vec_str = "[" + ",".join(str(x) for x in emb) + "]"

        semantic_rows = session.execute(
            text("""
                SELECT c.id, c.hang, c.dong, c.nam, c.gia, c.km, c.loai,
                       ci.url as anh
                FROM cars c
                LEFT JOIN car_images ci ON ci.car_id = c.id AND ci.is_main = true
                WHERE c.embedding IS NOT NULL
                ORDER BY c.embedding <=> CAST(:vec AS vector)
                LIMIT :k
            """),
            {"vec": vec_str, "k": req.k}
        ).fetchall()

        return {
            "cars": [_row_to_dict(r) for r in semantic_rows],
            "total": len(semantic_rows),
            "query": req.query,
            "mode": "semantic"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
