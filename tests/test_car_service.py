from app.models.cars import Car, CarFilter
from app.services.car_service import add_car_image, create_car, get_car_images, get_cars


def test_create_car_and_filter_cars(db_session):
    create_car(
        db_session,
        {"hang": "Toyota", "dong": "Camry", "nam": 2020, "gia": 850, "km": 20000, "loai": "Sedan"},
        image_url="https://example.com/camry.jpg",
    )
    create_car(
        db_session,
        {"hang": "Honda", "dong": "CR-V", "nam": 2021, "gia": 900, "km": 15000, "loai": "SUV"},
        image_url="https://example.com/crv.jpg",
    )

    toyotas = get_cars(db_session, CarFilter(hang="Toyota"))
    suvs_under_950 = get_cars(db_session, CarFilter(loai="SUV", gia_max=950))
    expensive_cars = get_cars(db_session, CarFilter(gia_min=880))

    assert [car.dong for car in toyotas] == ["Camry"]
    assert [car.hang for car in suvs_under_950] == ["Honda"]
    assert [car.hang for car in expensive_cars] == ["Honda"]


def test_add_main_car_image_updates_car_thumbnail(db_session):
    car = create_car(
        db_session,
        {"hang": "Kia", "dong": "K3", "nam": 2022, "gia": 520, "km": 10000, "loai": "Sedan"},
    )

    image = add_car_image(db_session, car.id, "https://example.com/k3-main.jpg", is_main=True)
    images = get_car_images(db_session, car.id)
    refreshed_car = db_session.get(Car, car.id)

    assert image.id is not None
    assert len(images) == 1
    assert images[0].is_main is True
    assert refreshed_car.anh == "https://example.com/k3-main.jpg"
