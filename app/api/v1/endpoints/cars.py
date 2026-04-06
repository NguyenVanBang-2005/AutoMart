from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlmodel import Session
from typing import Optional, List
from app.models.cars import CarFilter
from app.services.car_service import (
    get_cars, create_car, upload_car_image,
    add_car_image, get_car_images
)
from app.core.database import get_session

router = APIRouter(prefix="/cars")


@router.get("")
def list_cars(
    hang: str = None, loai: str = None,
    nam: int = None, gia_min: int = None, gia_max: int = None,
    session: Session = Depends(get_session)
):
    f = CarFilter(hang=hang, loai=loai, nam=nam, gia_min=gia_min, gia_max=gia_max)
    cars = get_cars(session, f)
    return {"cars": cars, "total": len(cars)}


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
        is_main = (i == 0)  # ảnh đầu tiên là ảnh chính
        add_car_image(session, car.id, url, is_main=is_main)

    return {"message": "Đăng xe thành công", "car_id": car.id}


@router.get("/{car_id}/images")
def list_car_images(car_id: int, session: Session = Depends(get_session)):
    images = get_car_images(session, car_id)
    return {"images": images}