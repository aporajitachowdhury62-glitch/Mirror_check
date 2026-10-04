import asyncio
import hashlib
import json
from typing import Any, Optional
from cachetools import TTLCache
from app.core.config import settings


class AsyncTTLCache:
    """Async wrapper around cachetools.TTLCache for caching response payloads."""

    def __init__(self, maxsize: int = 500, ttl: int = 300):
        self._cache = TTLCache(maxsize=maxsize, ttl=ttl)
        self._lock = asyncio.Lock()

    @staticmethod
    def generate_key(prefix: str, payload: dict) -> str:
        """Create a deterministic hash key from endpoint prefix and request dictionary."""
        sorted_payload = json.dumps(payload, sort_keys=True, default=str)
        hash_digest = hashlib.sha256(sorted_payload.encode("utf-8")).hexdigest()
        return f"{prefix}:{hash_digest}"

    async def get(self, key: str) -> Optional[Any]:
        """Retrieve an item from cache if present and unexpired."""
        async with self._lock:
            return self._cache.get(key)

    async def set(self, key: str, value: Any) -> None:
        """Store an item into cache with TTL."""
        async with self._lock:
            self._cache[key] = value

    async def clear(self) -> None:
        """Clear all cache entries."""
        async with self._lock:
            self._cache.clear()

    async def size(self) -> int:
        """Get the count of active cache items."""
        async with self._lock:
            return len(self._cache)


# Global cache instance using settings
request_cache = AsyncTTLCache(
    maxsize=settings.CACHE_MAX_ITEMS,
    ttl=settings.CACHE_TTL_SECONDS,
)
