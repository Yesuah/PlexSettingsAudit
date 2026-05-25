from fastapi import APIRouter, Depends
from ..domain.media import Episode, Movie
from ..services.metadata_service import MetadataService
from .deps import get_metadata_service

router = APIRouter(tags=["metadata"])


@router.get("/shows/{show_id}/episodes", response_model=list[Episode])
async def get_episodes(
    show_id: str,
    service: MetadataService = Depends(get_metadata_service),
) -> list[Episode]:
    return await service.get_episodes(show_id)


@router.get("/movies/{movie_id}", response_model=Movie)
async def get_movie(
    movie_id: str,
    service: MetadataService = Depends(get_metadata_service),
) -> Movie:
    return await service.get_movie(movie_id)
