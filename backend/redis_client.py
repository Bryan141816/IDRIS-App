import os
import asyncio
import redis.asyncio as redis

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
r = redis.from_url(REDIS_URL, decode_responses=True)


async def wait_redis(retries=10, delay=1):
    for i in range(retries):
        try:
            if await r.ping():
                print("✅ Redis is ready")
                return
        except Exception as e:
            print(f"Redis not ready, retry {i+1}/{retries}...")
            await asyncio.sleep(delay)
    raise Exception("❌ Could not connect to Redis")
