import json
import asyncio
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from redis_client import r


router = APIRouter(prefix="/real_time", tags=["real_time"])



async def event_generator(user_id: str, request: Request):
    async with r.pubsub() as pubsub:
        await pubsub.subscribe(f"real_time:{user_id}")

        try:
            async for message in pubsub.listen():
                if await request.is_disconnected():
                    break

                if message['type'] == 'message':
                    data = message['data']
                    if isinstance(data, bytes):
                        data = data.decode()
                    yield f"data: {data}\n\n"
        except asyncio.CancelledError:
            pass

@router.get("/{user_id}")
async def real_time(user_id: str, request: Request):
    return StreamingResponse(
        event_generator(user_id, request),
        media_type="text/event-stream",
    )


async def send_real_time(user_id: str, event_type: str, payload: dict):
    channel = f"real_time:{user_id}"
    data = {"event_type": event_type, "data": payload}
    print(f"Hello from publisher: {channel}, {data}")
    await r.publish(channel, json.dumps(data))

@router.post("/trigger/{user_id}")
async def trigger_event(user_id: str):
    await send_real_time(
        user_id,
        "notification",
        {
            "title": "Hello from server!",
            "message": "This is a test real-time notification.",
        },
    )
    return {"status": "sent"}
