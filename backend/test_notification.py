# test_notification.py
import asyncio
import json
from redis_client import r  # your async Redis client


async def send_test_notification(user_id: str):
    """Send a test notification with a fixed title and message."""
    channel = f"notifications:{user_id}"
    payload = {"title": "Test notification", "message": "This is a test notification"}
    await r.publish(channel, json.dumps(payload))
    print(f"Sent test notification to user {user_id}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python test_notification.py <user_id>")
        sys.exit(1)

    user_id = sys.argv[1]
    asyncio.run(send_test_notification(user_id))
