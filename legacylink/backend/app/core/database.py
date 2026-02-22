import asyncpg
import redis.asyncio as aioredis
from typing import Optional
from app.core.config import settings

class Database:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.redis: Optional[aioredis.Redis] = None

    async def connect(self):
        try:
            self.pool = await asyncpg.create_pool(
                settings.DATABASE_URL, 
                min_size=2, 
                max_size=10
            )
            print("✅ PostgreSQL connected")
        except Exception as e:
            print(f"⚠️ PostgreSQL connection failed: {e}")

        try:
            self.redis = aioredis.from_url(settings.REDIS_URL)
            await self.redis.ping()
            print("✅ Redis connected")
        except Exception as e:
            print(f"⚠️ Redis connection failed: {e}")

    async def disconnect(self):
        if self.pool:
            await self.pool.close()
        if self.redis:
            await self.redis.close()

db = Database()
