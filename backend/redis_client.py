import os
import redis.asyncio as redis

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

# keep your global instance
r: redis.Redis = redis.from_url(REDIS_URL, decode_responses=True)


async def close_redis():
    """Close redis connection and pool."""
    await r.close()
    await r.connection_pool.disconnect()
