from fastapi import FastAPI
from app.core.config import settings
from app.core.security import setup_security
from app.routers.api import router as api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Mirror Check Backend API - An AI thinking companion that helps users examine their doubt "
        "about 'Should I learn this skill?'. It strictly surfaces assumptions and asks Socratic questions "
        "without recommending or advising."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# Apply security, CORS, headers, rate limiting, and safe exception handlers
setup_security(app)

# Include API endpoints
app.include_router(api_router)


@app.get(
    "/health",
    tags=["System"],
    summary="Service Health Check",
    description="Returns the health and operational status of the Mirror Check API.",
)
async def health_check():
    return {
        "status": "ok",
        "service": "mirror-check-api",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }
