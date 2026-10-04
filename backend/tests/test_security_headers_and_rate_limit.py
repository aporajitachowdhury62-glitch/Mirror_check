import pytest
from fastapi.testclient import TestClient
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.main import app
from app.core.security import custom_rate_limit_handler


def test_security_headers_present(client: TestClient):
    """Ensure all responses include strict security headers."""
    resp = client.get("/health")
    assert resp.status_code == 200

    headers = resp.headers
    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("x-frame-options") == "DENY"
    assert headers.get("x-xss-protection") == "1; mode=block"
    assert headers.get("strict-transport-security") == "max-age=31536000; includeSubDomains"
    assert headers.get("content-security-policy") == "default-src 'self'"
    assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"


def test_cors_headers_allowed_origin(client: TestClient):
    """Ensure preflight / CORS requests from configured origins return allowed headers."""
    resp = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    # Status can be 200 or 204 for OPTIONS
    assert resp.status_code in [200, 204]
    assert resp.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_custom_rate_limit_handler_format():
    """Verify rate limit exception handler output schema."""
    import json
    from unittest.mock import MagicMock
    from slowapi.errors import RateLimitExceeded

    class MockRequest:
        pass

    mock_limit = MagicMock()
    mock_limit.error_message = "5 per 1 minute"
    exc = RateLimitExceeded(mock_limit)
    response = custom_rate_limit_handler(MockRequest(), exc)
    assert response.status_code == 429
    data = json.loads(response.body)
    assert data["error"] == "Too Many Requests"
    assert data["code"] == "RATE_LIMIT_EXCEEDED"
    assert "5 per 1 minute" in data["detail"]


