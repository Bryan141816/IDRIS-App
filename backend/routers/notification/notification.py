from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from models import Notifications
from crud_functions.user_profile_crud import UserProfileCRUD
from routers.GetUserId import GetUserId
from pydantic import BaseModel

router = APIRouter(tags=["notifications"])


class NotificationResponse(BaseModel):
    notification_id: int
    to: str
    from_origin: str
    title: str
    message: str
    url_redirect: str
    date: datetime
    isRead: bool

    class Config:
        orm_mode = True


@router.get("/get_notifications", response_model=List[NotificationResponse])
def get_notifications(
    user_id: str = Depends(GetUserId()), db: Session = Depends(get_db)
):
    """Get all notifications for a user, ordered by date (latest first)."""
    notifications = (
        db.query(Notifications)
        .filter(Notifications.to == user_id)
        .order_by(Notifications.date.desc())
        .all()
    )

    if not notifications:
        raise HTTPException(status_code=404, detail="No notifications found")

    return notifications


# ✅ New Pydantic model for marking as read
class NotificationReadRequest(BaseModel):
    notification_id: int


@router.post("/notifications/mark_as_read", response_model=NotificationResponse)
def mark_as_read(
    payload: NotificationReadRequest,
    user_id: str = Depends(GetUserId()),
    db: Session = Depends(get_db),
):
    """Mark a notification as read by ID for the current user."""
    notification = (
        db.query(Notifications)
        .filter(
            Notifications.notification_id == payload.notification_id,
            Notifications.to == user_id,  # ensure user owns it
        )
        .first()
    )

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.isRead = True
    db.commit()
    db.refresh(notification)
    return notification


class NotificationCreateRequest(BaseModel):
    title: str
    message: str
    url_redirect: str
    donors: list[str]


@router.post("/create_notification")
def create_notification(
    payload: NotificationCreateRequest,
    user_id: str = Depends(GetUserId()),
    db: Session = Depends(get_db),
):
    """Create a notification for a list of users."""
    notifications = []

    for donor_id in payload.donors:
        user_profile = UserProfileCRUD.get_user_profile_by_user_id(db, donor_id)
        if user_profile:
            message = payload.message.replace("[donor_name]", user_profile.first_name)
        else:
            message = payload.message.replace("[donor_name]", "Donor")

        notification = Notifications(
            to=donor_id,
            from_origin=user_id,
            title=payload.title,
            message=message,
            url_redirect=payload.url_redirect,
            date=datetime.now(),
            isRead=False,
        )
        notifications.append(notification)

    db.add_all(notifications)
    db.commit()

    return {"message": "Notifications created successfully"}
