import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import asyncio
from redis_client import r


router = APIRouter(prefix="/real_time", tags=["real_time"])


async def event_generator(user_id: str):
    pubsub = r.pubsub()
    await pubsub.subscribe(f"real_time:{user_id}")

    try:
        while True:
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
        # Client disconnected
        pass
    finally:
        await pubsub.unsubscribe(f"real_time:{user_id}")
        await pubsub.close()


@router.get("/{user_id}")
async def real_time(user_id: str):
    return StreamingResponse(event_generator(user_id), media_type="text/event-stream")


async def send_real_time(user_id: str, event_type: str, payload: dict):
    channel = f"real_time:{user_id}"

    data = {"event_type": event_type, "data": payload}
    print(channel)
    print(data)
    await r.publish(channel, json.dumps(data))
