import os
import pytest
from typing import AsyncGenerator
from fastapi.testclient import TestClient
import httpx

# Set test environment before imports
os.environ["GEMINI_API_KEY"] = "mock-gemini-test-key"
os.environ["ENVIRONMENT"] = "testing"
os.environ["RATE_LIMIT_PER_MINUTE"] = "100/minute"

from app.main import app
from app.services.cache import request_cache


@pytest.fixture(autouse=True)
def clear_cache():
    """Ensure the in-memory cache is cleared before and after each test."""
    request_cache._cache.clear()
    yield
    request_cache._cache.clear()


@pytest.fixture
def client() -> TestClient:
    """Synchronous test client for FastAPI."""
    return TestClient(app)


@pytest.fixture
async def async_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    """Asynchronous HTTP test client for FastAPI."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


class MockGenAIResponse:
    """Mock object simulating google.genai response with .text attribute."""
    def __init__(self, text: str):
        self.text = text
