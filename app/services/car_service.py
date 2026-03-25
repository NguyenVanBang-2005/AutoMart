from sqlmodel import Session, select
from typing import List
from app.models.cars import Car, CarFilter


def get_cars(session: Session, f: CarFilter) -> List[Car]:
    query = select(Car)
    if f.hang:    query = query.where(Car.hang == f.hang)
    if f.loai:    query = query.where(Car.loai == f.loai)
    if f.nam:     query = query.where(Car.nam == f.nam)
    if f.gia_min: query = query.where(Car.gia >= f.gia_min)
    if f.gia_max: query = query.where(Car.gia <= f.gia_max)
    return session.exec(query).all()


def seed_cars(session: Session):
    """Chèn dữ liệu mẫu nếu bảng trống"""
    existing = session.exec(select(Car)).first()
    if existing:
        return  # đã có data rồi, không seed lại

    sample_cars = [
        Car(hang="Toyota", dong="Camry",  nam=2022, gia=950,  km=25000, loai="Sedan"),
        Car(hang="Honda",  dong="CR-V",   nam=2023, gia=1050, km=12000, loai="SUV"),
        Car(hang="Mazda",  dong="CX-5",   nam=2023, gia=899,  km=18000, loai="SUV"),
        Car(hang="Hyundai",dong="Tucson", nam=2022, gia=825,  km=30000, loai="SUV"),
        Car(hang="Kia",    dong="K5",     nam=2023, gia=750,  km=8000,  loai="Sedan"),
        Car(hang="Ford",   dong="Ranger", nam=2022, gia=700,  km=35000, loai="Pickup"),
    ]
    session.add_all(sample_cars)
    session.commit()