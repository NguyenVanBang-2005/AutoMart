from sqlmodel import Session, select
from typing import List
from app.models.cars import Car, CarFilter, CarImage
import cloudinary
import cloudinary.uploader
from app.core.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
)


def upload_car_image(file_bytes: bytes, public_id: str) -> str:
    result = cloudinary.uploader.upload(
        file_bytes,
        folder="automart/cars",
        public_id=public_id,
        overwrite=True,
        resource_type="image",
    )
    return result["secure_url"]


def add_car_image(session: Session, car_id: int, url: str, is_main: bool = False) -> CarImage:
    img = CarImage(car_id=car_id, url=url, is_main=is_main)
    session.add(img)
    session.commit()
    session.refresh(img)
    # Nếu là ảnh chính thì cache vào field anh của Car
    if is_main:
        car = session.get(Car, car_id)
        if car:
            car.anh = url
            session.add(car)
            session.commit()
    return img


def get_car_images(session: Session, car_id: int) -> List[CarImage]:
    return session.exec(select(CarImage).where(CarImage.car_id == car_id)).all()


def create_car(session: Session, car_data: dict, image_url: str = "") -> Car:
    car = Car(**car_data, anh=image_url)
    session.add(car)
    session.commit()
    session.refresh(car)
    return car


def get_cars(session: Session, f: CarFilter) -> List[Car]:
    query = select(Car)
    if f.hang:    query = query.where(Car.hang == f.hang)
    if f.loai:    query = query.where(Car.loai == f.loai)
    if f.nam:     query = query.where(Car.nam == f.nam)
    if f.gia_min: query = query.where(Car.gia >= f.gia_min)
    if f.gia_max: query = query.where(Car.gia <= f.gia_max)
    return session.exec(query).all()


def seed_cars(session: Session):
    existing = session.exec(select(Car)).first()
    if existing:
        return
    sample_cars = [
        # ── Toyota ───────────────────────────────────────
        Car(hang="Toyota", dong="Camry 2.0E SX",           nam=2019, gia=850,  km=45000,  loai="Sedan"),
        Car(hang="Toyota", dong="Veloz Cross 2022 CVT Top", nam=2022, gia=720,  km=80000,  loai="MPV"),
        Car(hang="Toyota", dong="YARIS 2015 Bản G",         nam=2015, gia=380,  km=60000,  loai="Hatchback"),
        Car(hang="Toyota", dong="Land Cruiser V8 2011",     nam=2011, gia=1850, km=90000,  loai="SUV"),
        Car(hang="Toyota", dong="Fortuner 2.7V 4x2 AT",    nam=2016, gia=650,  km=75000,  loai="SUV"),
        Car(hang="Toyota", dong="Innova 2.0E",              nam=2017, gia=480,  km=98000,  loai="MPV"),

        # ── Honda ────────────────────────────────────────
        Car(hang="Honda",  dong="CR-V 2.4 Màu Trắng",      nam=2016, gia=560,  km=65000,  loai="SUV"),
        Car(hang="Honda",  dong="Civic 2020 1.5RS",         nam=2020, gia=680,  km=35000,  loai="Sedan"),
        Car(hang="Honda",  dong="City 2025 L 1.5 AT",       nam=2025, gia=520,  km=7000,   loai="Sedan"),
        Car(hang="Honda",  dong="CRV-L 2024",               nam=2024, gia=1050, km=8000,   loai="SUV"),
        Car(hang="Honda",  dong="Civic 2008 Bắc 150.000km", nam=2008, gia=220,  km=150000, loai="Sedan"),

        # ── Mazda ────────────────────────────────────────
        Car(hang="Mazda",  dong="CX-5 2.0 Premium SX",     nam=2021, gia=750,  km=30000,  loai="SUV"),
        Car(hang="Mazda",  dong="CX5 2.5 2019 Màu Đỏ",     nam=2019, gia=680,  km=45000,  loai="SUV"),
        Car(hang="Mazda",  dong="Mazda2 2011 Trắng",        nam=2011, gia=220,  km=92000,  loai="Hatchback"),
        Car(hang="Mazda",  dong="3 Sport 2020 1.5L Luxury", nam=2020, gia=560,  km=28000,  loai="Sedan"),
        Car(hang="Mazda",  dong="2 2018 1.5 AT Sedan",      nam=2018, gia=360,  km=60000,  loai="Sedan"),
        Car(hang="Mazda",  dong="6 2014 2.0 AT",            nam=2014, gia=420,  km=85000,  loai="Sedan"),

        # ── Hyundai ──────────────────────────────────────
        Car(hang="Hyundai", dong="Tucson ĐK T1221 Siêu Mới", nam=2021, gia=750, km=15000, loai="SUV"),
        Car(hang="Hyundai", dong="Santa Fe 2016 2.4L 4WD",  nam=2016, gia=620,  km=98000,  loai="SUV"),
        Car(hang="Hyundai", dong="Grand i10 2025 1.2 MT",   nam=2025, gia=360,  km=5000,   loai="Hatchback"),
        Car(hang="Hyundai", dong="Avante 2011 1.6L Đen",    nam=2011, gia=270,  km=95000,  loai="Sedan"),
        Car(hang="Hyundai", dong="Stargazer 2022 1.5 AT",   nam=2022, gia=480,  km=22000,  loai="MPV"),
        Car(hang="Hyundai", dong="SANTAFE Full Dầu T1221",  nam=2021, gia=890,  km=30000,  loai="SUV"),

        # ── Kia ──────────────────────────────────────────
        Car(hang="Kia",    dong="K5",                        nam=2023, gia=750,  km=8000,   loai="Sedan"),
        Car(hang="Kia",    dong="K3 1.6 Premium 2022",       nam=2022, gia=520,  km=58000,  loai="Sedan"),
        Car(hang="Kia",    dong="Sorento 2021 Máy Dầu",      nam=2021, gia=850,  km=40000,  loai="SUV"),
        Car(hang="Kia",    dong="Sonet Màu Đỏ",              nam=2022, gia=480,  km=15000,  loai="SUV"),
        Car(hang="Kia",    dong="Morning Van 2016 Xanh Nhạt", nam=2016, gia=220, km=65000,  loai="Hatchback"),

        # ── Ford ─────────────────────────────────────────
        Car(hang="Ford",   dong="Ranger 2016 Wildtrak 3.2 4x4", nam=2016, gia=580, km=120000, loai="Pickup"),
        Car(hang="Ford",   dong="Territory 2023 Titanium X",  nam=2023, gia=820,  km=52000,  loai="SUV"),
        Car(hang="Ford",   dong="EcoSport 2019 Đỏ Ruby",      nam=2019, gia=420,  km=45000,  loai="SUV"),
        Car(hang="Ford",   dong="Focus 2.0 Titanium 2013",    nam=2013, gia=320,  km=90000,  loai="Sedan"),
        Car(hang="Ford",   dong="Escape 2007 Vàng Cát",       nam=2007, gia=180,  km=120000, loai="SUV"),
        Car(hang="Ford",   dong="Everest Titanium 2.0L 4x2AT", nam=2023, gia=950, km=18000,  loai="SUV"),

        # ── BMW ──────────────────────────────────────────
        Car(hang="BMW",    dong="X1 sDrive20i 2017",          nam=2017, gia=780,  km=65000,  loai="SUV"),
        Car(hang="BMW",    dong="330i M Sport 2024",           nam=2024, gia=1850, km=8000,   loai="Sedan"),
        Car(hang="BMW",    dong="328i Model 2015 up M3",       nam=2015, gia=950,  km=75000,  loai="Sedan"),
        Car(hang="BMW",    dong="X1 Nhập Mỹ 2019 52000km",    nam=2019, gia=1050, km=52000,  loai="SUV"),
        Car(hang="BMW",    dong="320i Sport Line 2022",        nam=2022, gia=1380, km=28000,  loai="Sedan"),
        Car(hang="BMW",    dong="X3 xDrive20i CUV 2014",      nam=2014, gia=820,  km=88000,  loai="SUV"),

        # ── Mercedes-Benz ────────────────────────────────
        Car(hang="Benz",   dong="C300 AMG sx 2015",           nam=2015, gia=980,  km=70000,  loai="Sedan"),
        Car(hang="Benz",   dong="CLA 200 2015 đk 2016",       nam=2015, gia=750,  km=55000,  loai="Sedan"),
        Car(hang="Benz",   dong="C200 2016 đăng ký 2017",     nam=2016, gia=850,  km=60000,  loai="Sedan"),
        Car(hang="Benz",   dong="GL V8 4Matic 2011",          nam=2011, gia=1050, km=95000,  loai="SUV"),
        Car(hang="Benz",   dong="E280 2005 Đen 160.000km",    nam=2005, gia=380,  km=160000, loai="Sedan"),
        Car(hang="Benz",   dong="Sprinter 2010",               nam=2010, gia=420,  km=180000, loai="Van"),

        # ── Vinfast ──────────────────────────────────────
        Car(hang="Vinfast", dong="VF8 Plus 2023",              nam=2023, gia=850,  km=15000,  loai="SUV"),
        Car(hang="Vinfast", dong="VF5 2025 Plus 39000km",      nam=2025, gia=420,  km=39000,  loai="Hatchback"),
        Car(hang="Vinfast", dong="VF6 Plus Full Option 2024",  nam=2024, gia=680,  km=12000,  loai="SUV"),
        Car(hang="Vinfast", dong="VF3 Xám Xi Măng",            nam=2024, gia=320,  km=8000,   loai="Hatchback"),
        Car(hang="Vinfast", dong="Limo Green 2026 0km",        nam=2026, gia=1200, km=0,      loai="Sedan"),
    ]
    session.add_all(sample_cars)
    session.commit()