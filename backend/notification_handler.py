import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import asyncio
from redis_client import r


router = APIRouter(prefix="/notifications", tags=["notifications"])


async def event_generator(user_id: str):
    pubsub = r.pubsub()
    await pubsub.subscribe(f"notifications:{user_id}")

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
        await pubsub.unsubscribe(f"notifications:{user_id}")
        await pubsub.close()


@router.get("/{user_id}")
async def notifications(user_id: str):
    return StreamingResponse(event_generator(user_id), media_type="text/event-stream")
