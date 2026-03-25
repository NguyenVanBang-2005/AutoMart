from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.models.cars import CarFilter
from app.services.car_service import get_cars
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