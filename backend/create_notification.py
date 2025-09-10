import asyncio
from sqlalchemy.orm import Session
from models import Notifications
from real_time_handler import send_real_time
from datetime import datetime
from typing import List, Dict


def to_dict(obj):
    result = {}
    for c in obj.__table__.columns:
        value = getattr(obj, c.name)
        if isinstance(value, datetime):
            value = value.isoformat()
        result[c.name] = value
    return result


# ---------------------------
# DB Insert Functions
# ---------------------------


def create_notification(db: Session, obj_in: dict) -> Notifications:
    """Insert a single notification."""
    if "isRead" not in obj_in:
        obj_in["isRead"] = False

    notification = Notifications(**obj_in)
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def create_notifications_bulk(db: Session, objs_in: List[Dict]) -> List[Notifications]:
    """Insert multiple notifications in a single commit."""
    notifications = []
    for obj_in in objs_in:
        if "isRead" not in obj_in:
            obj_in["isRead"] = False
        notifications.append(Notifications(**obj_in))

    db.add_all(notifications)
    db.commit()

    # Load DB-generated fields
    for n in notifications:
        db.refresh(n)

    return notifications


# ---------------------------
# Send Functions
# ---------------------------


async def send_notification(db: Session, obj_in: dict):
    """Insert + send a single notification."""
    notification = create_notification(db, obj_in)
    notification_dict = to_dict(notification)
    await send_real_time(obj_in["to"], "notification", notification_dict)


async def send_notifications_bulk(db: Session, objs_in: List[Dict]):
    """
    Insert + send multiple notifications.
    Each dict in objs_in must include a 'to' key.
    """
    notifications = create_notifications_bulk(db, objs_in)

    tasks = []
    for notification in notifications:
        notification_dict = to_dict(notification)
        tasks.append(send_real_time(notification.to, "notification", notification_dict))

    # Run all sends concurrently
    await asyncio.gather(*tasks)
