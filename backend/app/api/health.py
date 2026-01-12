"""Health check endpoints"""

import redis
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db

router = APIRouter()


@router.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
    }


@router.get("/health/detailed")
async def detailed_health_check(db: Session = Depends(get_db)):
    """Detailed health check with dependency status"""
    health_status = {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
        "checks": {},
    }

    # Check PostgreSQL
    try:
        db.execute(text("SELECT 1"))
        health_status["checks"]["postgres"] = {"status": "healthy"}
    except Exception as e:
        health_status["checks"]["postgres"] = {"status": "unhealthy", "error": str(e)}
        health_status["status"] = "degraded"

    # Check Redis
    try:
        r = redis.from_url(settings.redis_url)
        r.ping()
        health_status["checks"]["redis"] = {"status": "healthy"}
    except Exception as e:
        health_status["checks"]["redis"] = {"status": "unhealthy", "error": str(e)}
        health_status["status"] = "degraded"

    # Check MCP servers availability (basic port check would go here)
    health_status["checks"]["mcp_servers"] = {
        "google_ads": f"http://{settings.mcp_host}:{settings.mcp_google_ads_port}",
        "meta_ads": f"http://{settings.mcp_host}:{settings.mcp_meta_ads_port}",
        "tiktok_ads": f"http://{settings.mcp_host}:{settings.mcp_tiktok_ads_port}",
        "linkedin_ads": f"http://{settings.mcp_host}:{settings.mcp_linkedin_ads_port}",
    }

    return health_status
