from fastapi import APIRouter, Depends, Query
from ..domain.media import Movie, Show
from ..services.search_service import SearchService
from .deps import get_search_service

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/tv", response_model=list[Show])
async def search_tv(
    q: str = Query(..., description="Show title to search for"),
    service: SearchService = Depends(get_search_service),
) -> list[Show]:
    return await service.search_tv(q)


@router.get("/movies", response_model=list[Movie])
async def search_movies(
    q: str = Query(..., description="Movie title to search for"),
    service: SearchService = Depends(get_search_service),
) -> list[Movie]:
    return await service.search_movies(q)
