from fastapi import APIRouter
from .search import router as search_router
from .metadata import router as metadata_router
from .settings import router as settings_router

router = APIRouter(prefix="/api")
router.include_router(search_router)
router.include_router(metadata_router)
router.include_router(settings_router)
