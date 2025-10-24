import os
import redis.asyncio as redis
from decouple import config

REDIS_URL = config("REDIS_URL")

# keep your global instance
r: redis.Redis = redis.from_url(REDIS_URL, decode_responses=True)


async def close_redis():
    """Close redis connection and pool."""
    await r.close()
    await r.connection_pool.disconnect()
