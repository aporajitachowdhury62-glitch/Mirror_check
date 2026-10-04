import logging
from typing import Callable
from fastapi import FastAPI, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings

logger = logging.getLogger(__name__)

# Rate limiter instance
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[settings.RATE_LIMIT_PER_MINUTE],
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware that injects standard modern security headers into all responses."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Returns a clean, structured JSON response when the client exceeds their rate limit."""
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "error": "Too Many Requests",
            "detail": f"Rate limit exceeded: {exc.detail}",
            "code": "RATE_LIMIT_EXCEEDED",
        },
    )


def setup_security(app: FastAPI) -> None:
    """Configures CORS, rate limiting, security headers, and safe error handling."""
    # 1. State for SlowAPI
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, custom_rate_limit_handler)

    # 2. CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )

    # 3. Security Headers
    app.add_middleware(SecurityHeadersMiddleware)

    # 4. Validation Error Handler
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = exc.errors()
        clean_errors = []
        for err in errors:
            loc = " -> ".join(str(l) for l in err.get("loc", []))
            msg = err.get("msg", "Invalid value")
            clean_errors.append(f"{loc}: {msg}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "Validation Error",
                "detail": "; ".join(clean_errors),
                "code": "INVALID_INPUT",
            },
        )

    # 5. Global Unhandled Exception Handler (prevent leaking stack traces)
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled server error: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Internal Server Error",
                "detail": "An unexpected error occurred while processing your request.",
                "code": "INTERNAL_SERVER_ERROR",
            },
        )
