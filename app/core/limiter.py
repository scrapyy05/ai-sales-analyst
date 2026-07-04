from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from jose import jwt
from app.core.config import settings
from app.core import security

def get_jwt_user_id(request: Request) -> str:
    """
    Custom Rate Limiter Key Function:
    Extracts the authenticated user ID (email/sub) from the JWT Bearer token in the request headers.
    This ensures rate limiting is strictly per-user, independent of IP address.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return "unauthenticated"
    
    token = auth_header.split(" ")[1]
    try:
        # Decode the token in memory (~0.01ms latency) without hitting the PostgreSQL DB
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
        user_id = payload.get("sub")
        return user_id if user_id else "unauthenticated"
    except Exception:
        return "invalid_token"

# Initialize SlowAPI Limiter using our custom JWT identification function
limiter = Limiter(key_func=get_jwt_user_id)

def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """
    Returns HTTP 429 Too Many Requests with a clean JSON error response.
    """
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "detail": "You have exceeded your allowed limit of 20 requests per minute on the AI Analyst endpoint. Please wait a moment before trying again."
        }
    )
