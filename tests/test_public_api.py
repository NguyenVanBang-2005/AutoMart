from app.models.cars import Car


def test_register_login_and_duplicate_registration(client):
    payload = {
        "ho_ten": "Nguyen Van A",
        "email": "api@example.com",
        "so_dien_thoai": "0900000000",
        "password": "secret123",
    }

    register_response = client.post("/api/v1/users/register", json=payload)

    assert register_response.status_code == 201
    body = register_response.json()
    assert body["user"]["email"] == "api@example.com"
    assert body["token_type"] == "bearer"
    assert "access_token" in body
    assert "automart_token=" in register_response.headers["set-cookie"]

    duplicate_response = client.post("/api/v1/users/register", json=payload)
    assert duplicate_response.status_code == 400

    login_response = client.post(
        "/api/v1/users/login",
        json={"email": "api@example.com", "password": "secret123"},
    )
    assert login_response.status_code == 200
    assert login_response.json()["user"]["email"] == "api@example.com"

    bad_login_response = client.post(
        "/api/v1/users/login",
        json={"email": "api@example.com", "password": "wrong-password"},
    )
    assert bad_login_response.status_code == 401


def test_list_cars_supports_query_filters(client, db_session):
    db_session.add_all(
        [
            Car(hang="Toyota", dong="Camry", nam=2020, gia=850, km=20000, loai="Sedan"),
            Car(hang="Honda", dong="CR-V", nam=2021, gia=900, km=15000, loai="SUV"),
        ]
    )
    db_session.commit()

    response = client.get("/api/v1/cars", params={"loai": "SUV", "gia_max": 950})

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["cars"][0]["hang"] == "Honda"
