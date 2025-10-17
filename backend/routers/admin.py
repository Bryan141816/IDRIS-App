from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User
from .auth.authentication import get_current_user_from_access_token
from email_handler import send_user_activated_email

router = APIRouter(prefix="/admin", tags=["admin"])


def get_current_active_superuser(
    current_user: User = Depends(get_current_user_from_access_token),
):
    if "superadmin" not in current_user.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user


@router.post("/activate_user/{user_id}")
async def activate_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    user_to_activate = db.query(User).filter(User.user_id == user_id).first()
    if not user_to_activate:
        raise HTTPException(status_code=404, detail="User not found")

    user_to_activate.is_activated = True
    db.commit()

    await send_user_activated_email(user_to_activate.email)

    return {"message": f"User {user_to_activate.email} has been activated."}