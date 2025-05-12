from fastapi import APIRouter

from app.api.routes import (
    items,
    login,
    private,
    promoter_profiles,
    student_profiles,
    thesis_applications,
    thesis_topics,
    users,
    utils,
)
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(promoter_profiles.router)
api_router.include_router(student_profiles.router)
api_router.include_router(thesis_applications.router)
api_router.include_router(thesis_topics.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
