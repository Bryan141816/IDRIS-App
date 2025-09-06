from sqlalchemy.orm import Session
from models import Notifications
from real_time_handler import send_real_time
from datetime import datetime


def to_dict(obj):
    result = {}
    for c in obj.__table__.columns:
        value = getattr(obj, c.name)
        if isinstance(value, datetime):
            value = value.isoformat()  # or str(value)
        result[c.name] = value
    return result


# Create a notification
def create_notification(db: Session, obj_in: dict):
    """
    Inserts a notification record into the notifications_table.

    obj_in should be a dict with keys:
    - to
    - from_origin
    - title
    - message
    - url_redirect
    - isRead (optional, defaults to False)
    """
    # Ensure isRead has a default if not provided
    if "isRead" not in obj_in:
        obj_in["isRead"] = False

    notification = Notifications(**obj_in)
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


async def send_notification(db: Session, obj_in: dict):
    notification = create_notification(db, obj_in)
    notification_dict = to_dict(notification)  # convert to dict
    await send_real_time(obj_in["to"], "notification", notification_dict)
