from app.models.user import UserChangePassword, UserRegister, UserUpdateProfile
from app.services import user_service


def test_create_find_and_authenticate_user(db_session):
    data = UserRegister(
        ho_ten="Nguyen Van A",
        email="a@example.com",
        so_dien_thoai="0900000000",
        password="secret123",
    )

    user = user_service.create_user(db_session, data)

    assert user.id is not None
    assert user.password_hash != "secret123"
    assert user_service.find_user_by_email(db_session, "a@example.com").id == user.id
    assert user_service.find_user_by_id(db_session, user.id).email == "a@example.com"
    assert user_service.authenticate_user(db_session, "a@example.com", "secret123").id == user.id
    assert user_service.authenticate_user(db_session, "a@example.com", "bad-password") is None
    assert user_service.authenticate_user(db_session, "missing@example.com", "secret123") is None


def test_update_profile_only_changes_provided_fields(db_session):
    user = user_service.create_user(
        db_session,
        UserRegister(
            ho_ten="Old Name",
            email="old@example.com",
            so_dien_thoai="0911111111",
            password="secret123",
        ),
    )

    updated = user_service.update_profile(
        db_session,
        user,
        UserUpdateProfile(ho_ten="New Name"),
    )

    assert updated.ho_ten == "New Name"
    assert updated.so_dien_thoai == "0911111111"


def test_change_password_requires_current_password(db_session):
    user = user_service.create_user(
        db_session,
        UserRegister(
            ho_ten="Password User",
            email="password@example.com",
            so_dien_thoai="0922222222",
            password="old-secret",
        ),
    )

    bad_result = user_service.change_password(
        db_session,
        user,
        UserChangePassword(
            password_cu="wrong-secret",
            password_moi="new-secret",
            password_moi_confirm="new-secret",
        ),
    )
    assert bad_result is False
    assert user_service.authenticate_user(db_session, "password@example.com", "old-secret")

    good_result = user_service.change_password(
        db_session,
        user,
        UserChangePassword(
            password_cu="old-secret",
            password_moi="new-secret",
            password_moi_confirm="new-secret",
        ),
    )
    assert good_result is True
    assert user_service.authenticate_user(db_session, "password@example.com", "new-secret")
