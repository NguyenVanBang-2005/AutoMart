from sqlmodel import Session, select
from typing import Optional
from app.models.user import User, UserRegister, UserUpdateProfile
from app.core.security import hash_password, verify_password


def find_user_by_email(session: Session, email: str) -> Optional[User]:
    return session.exec(select(User).where(User.email == email)).first()


def find_user_by_id(session: Session, user_id: int) -> Optional[User]:
    return session.get(User, user_id)


def create_user(session: Session, data: UserRegister) -> User:
    user = User(
        ho_ten=data.ho_ten,
        email=data.email,
        so_dien_thoai=data.so_dien_thoai,
        password_hash=hash_password(data.password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def authenticate_user(session: Session, email: str, password: str) -> Optional[User]:
    user = find_user_by_email(session, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def update_profile(session: Session, user: User, data: UserUpdateProfile) -> User:
    if data.ho_ten:
        user.ho_ten = data.ho_ten
    if data.so_dien_thoai:
        user.so_dien_thoai = data.so_dien_thoai
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def change_password(session: Session, user: User, password_cu: str, password_moi: str) -> bool:
    if not verify_password(password_cu, user.password_hash):
        return False
    user.password_hash = hash_password(password_moi)
    session.add(user)
    session.commit()
    return True