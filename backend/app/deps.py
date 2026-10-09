from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session
from .database import get_db
from .models import User


def get_current_user(
    x_user_id: int | None = Header(default=None), db: Session = Depends(get_db)
) -> User:
    """Mock auth: the frontend's 'switch user' dropdown sends X-User-Id."""
    if x_user_id is None:
        raise HTTPException(401, "Missing X-User-Id header")
    user = db.get(User, x_user_id)
    if not user:
        raise HTTPException(401, "Unknown user")
    return user


def get_optional_user(
    x_user_id: int | None = Header(default=None), db: Session = Depends(get_db)
) -> User | None:
    return db.get(User, x_user_id) if x_user_id else None


def require_host(user: User = Depends(get_current_user)) -> User:
    if user.role != "host":
        raise HTTPException(403, "Host account required")
    return user
