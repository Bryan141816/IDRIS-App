from datetime import datetime, timezone

def make_aware(dt):
    # If dt already aware, return it; otherwise attach UTC
    if dt is None:
        return None
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)