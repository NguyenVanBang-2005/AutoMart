from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime


class CarImage(SQLModel, table=True):
    __tablename__ = "car_images"

    id: Optional[int] = Field(default=None, primary_key=True)
    car_id: int = Field(foreign_key="cars.id", index=True)
    url: str
    is_main: bool = Field(default=False)  # ảnh đại diện
    created_at: datetime = Field(default_factory=datetime.utcnow)

    car: Optional["Car"] = Relationship(back_populates="images")


class Car(SQLModel, table=True):
    __tablename__ = "cars"

    id: Optional[int] = Field(default=None, primary_key=True)
    hang: str
    dong: str
    nam: int
    gia: int
    km: int
    loai: str
    anh: Optional[str] = ""  # giữ lại để tương thích, dùng làm thumbnail cache
    created_at: datetime = Field(default_factory=datetime.utcnow)

    images: List[CarImage] = Relationship(back_populates="car")


class CarFilter(SQLModel):
    hang: Optional[str] = None
    loai: Optional[str] = None
    nam: Optional[int] = None
    gia_min: Optional[int] = None
    gia_max: Optional[int] = None