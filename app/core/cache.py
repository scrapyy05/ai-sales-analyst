import json
import hashlib
from typing import Any, Optional
import fakeredis

class RedisQueryCache:
    def __init__(self, ttl_seconds: int = 300):
        # 300 seconds = 5 minutes expiration
        self.ttl = ttl_seconds
        
        # decode_responses=True tells Redis to return normal Python strings instead of raw binary bytes
        self.redis_client = fakeredis.FakeRedis(decode_responses=True)

    def _generate_key(self, prompt: str) -> str:
        # 1. Lowercase and remove multiple spaces
        normalized = " ".join(prompt.lower().strip().split())
        
        # 2. Convert to a 64-character SHA-256 hash string
        hashed = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
        
        # 3. Add a prefix folder label for neat Redis organization
        return f"cache:ask:{hashed}"

    def get(self, prompt: str) -> Optional[Any]:
        key = self._generate_key(prompt)
        
        # Check if Redis has this key stored
        cached_json_string = self.redis_client.get(key)
        
        if cached_json_string:
            # Convert the stored JSON string back into a Python dictionary/list
            return json.loads(cached_json_string)
            
        return None  # Cache Miss!

    def set(self, prompt: str, payload: Any):
        key = self._generate_key(prompt)
        
        # Convert our Python dictionary/list into a text JSON string
        json_string = json.dumps(payload)
        
        # setex = Set with Expiration. Saves data and starts the 300s countdown timer!
        self.redis_client.setex(key, self.ttl, json_string)

    def clear(self):
        # Wipes all cached database keys clean
        self.redis_client.flushdb()

# Create one global instance to share across our FastAPI backend
query_cache = RedisQueryCache(ttl_seconds=300)
