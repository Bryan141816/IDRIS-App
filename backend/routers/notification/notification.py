from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from models import Notifications
from routers.GetUserId import GetUserId
from pydantic import BaseModel

router = APIRouter(tags=["notifications"])


class NotificationResponse(BaseModel):
    notification_id: int
    to: int
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
    user_id: int = Depends(GetUserId()), db: Session = Depends(get_db)
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
    user_id: int = Depends(GetUserId()),
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
