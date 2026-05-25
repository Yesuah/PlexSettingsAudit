from fastapi import Depends
from ..core.config import Settings, get_settings
from ..data.plex_client import PlexClient
from ..services.search_service import SearchService
from ..services.metadata_service import MetadataService
from ..services.settings_service import SettingsService


def get_plex_client(settings: Settings = Depends(get_settings)) -> PlexClient:
    return PlexClient(settings)


def get_search_service(client: PlexClient = Depends(get_plex_client)) -> SearchService:
    return SearchService(client)


def get_metadata_service(client: PlexClient = Depends(get_plex_client)) -> MetadataService:
    return MetadataService(client)


def get_settings_service(client: PlexClient = Depends(get_plex_client)) -> SettingsService:
    return SettingsService(client)
