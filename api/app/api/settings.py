from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ..services.settings_service import SettingsService
from .deps import get_settings_service

router = APIRouter(prefix="/settings", tags=["settings"])


class TrackUpdate(BaseModel):
    part_id: str
    stream_id: str


class BulkTrackUpdate(BaseModel):
    updates: list[TrackUpdate]


@router.put("/subtitle/{part_id}")
async def set_subtitle(
    part_id: str,
    stream_id: str,
    service: SettingsService = Depends(get_settings_service),
) -> dict:
    await service.set_subtitle(part_id, stream_id)
    return {"status": "ok"}


@router.put("/audio/{part_id}")
async def set_audio(
    part_id: str,
    stream_id: str,
    service: SettingsService = Depends(get_settings_service),
) -> dict:
    await service.set_audio(part_id, stream_id)
    return {"status": "ok"}


@router.put("/subtitle/bulk")
async def bulk_set_subtitle(
    body: BulkTrackUpdate,
    service: SettingsService = Depends(get_settings_service),
) -> dict[str, str]:
    pairs = [(u.part_id, u.stream_id) for u in body.updates]
    return await service.bulk_set_subtitle(pairs)


@router.put("/audio/bulk")
async def bulk_set_audio(
    body: BulkTrackUpdate,
    service: SettingsService = Depends(get_settings_service),
) -> dict[str, str]:
    pairs = [(u.part_id, u.stream_id) for u in body.updates]
    return await service.bulk_set_audio(pairs)
