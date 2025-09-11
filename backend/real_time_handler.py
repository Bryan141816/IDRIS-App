import json
import asyncio
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from redis_client import r


router = APIRouter(prefix="/real_time", tags=["real_time"])


async def event_generator(user_id: str, request: Request):
    pubsub = r.pubsub()
    await pubsub.subscribe(f"real_time:{user_id}")

    try:
        while True:

            if await request.is_disconnected():
                break

            message = await pubsub.get_message(
                ignore_subscribe_messages=True, timeout=1.0
            )
            if message and "data" in message:
                data = message["data"]
                if isinstance(data, bytes):
                    data = data.decode()
                yield f"data: {data}\n\n"

            await asyncio.sleep(0.1)

    except asyncio.CancelledError:
        # client or server shutdown
        pass
    finally:
        await pubsub.unsubscribe(f"real_time:{user_id}")
        await pubsub.close()


@router.get("/{user_id}")
async def real_time(user_id: str, request: Request):
    return StreamingResponse(
        event_generator(user_id, request),
        media_type="text/event-stream",
    )


async def send_real_time(user_id: str, event_type: str, payload: dict):
    channel = f"real_time:{user_id}"
    data = {"event_type": event_type, "data": payload}
    await r.publish(channel, json.dumps(data))
