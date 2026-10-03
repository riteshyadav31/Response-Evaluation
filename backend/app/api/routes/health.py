from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.database.connection import mongodb

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def get_health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-response-quality-platform"}


@router.get("/database")
def get_database_health() -> dict[str, str]:
    is_available, message = mongodb.check()
    if not is_available:
        raise HTTPException(
            status_code=503,
            detail={"status": "unavailable", "database": settings.database_name, "message": message},
        )
    return {"status": "ok", "database": settings.database_name, "message": message}