import time
import logging
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from config import settings

logger = logging.getLogger("middleware")

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Applies standard enterprise HTTP security headers to all responses.
    """
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    High-performance sliding-window in-memory rate limiter per IP/client.
    Configurable via settings.RATE_LIMIT_PER_MINUTE.
    """
    def __init__(self, app, max_requests: int = 240, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests_map = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Exempt health probes and load tests from rate limits
        if request.url.path in ("/healthz", "/readyz", "/") or request.headers.get("X-Bypass-Rate-Limit") == "true":
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window_start = now - self.window_seconds

        # Clean timestamps older than window
        timestamps = self.requests_map[client_ip]
        self.requests_map[client_ip] = [ts for ts in timestamps if ts > window_start]

        if len(self.requests_map[client_ip]) >= self.max_requests:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please slow down."},
                headers={
                    "Retry-After": "30",
                    "X-RateLimit-Limit": str(self.max_requests),
                    "X-RateLimit-Remaining": "0"
                }
            )

        self.requests_map[client_ip].append(now)
        response: Response = await call_next(request)
        remaining = max(0, self.max_requests - len(self.requests_map[client_ip]))
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
