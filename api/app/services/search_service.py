from ..data.plex_client import PlexClient
from ..data.plex_parser import parse_movie, parse_show
from ..domain.media import Movie, Show

TV_SECTION = "2"
MOVIE_SECTION = "1"


class SearchService:
    def __init__(self, client: PlexClient) -> None:
        self._client = client

    async def search_tv(self, query: str) -> list[Show]:
        params: dict = {"type": 2}
        if query:
            params["title"] = query
        data = await self._client.get(f"/library/sections/{TV_SECTION}/all", **params)
        items = data.get("MediaContainer", {}).get("Metadata") or []
        return sorted([parse_show(item) for item in items], key=lambda s: s.title.lower())

    async def search_movies(self, query: str) -> list[Movie]:
        params: dict = {"type": 1}
        if query:
            params["title"] = query
        data = await self._client.get(f"/library/sections/{MOVIE_SECTION}/all", **params)
        items = data.get("MediaContainer", {}).get("Metadata") or []
        # Movie entries from /all don't include stream data; streams are fetched on demand
        # via MetadataService.get_movie() when the user selects a title.
        return sorted([parse_movie(item) for item in items], key=lambda m: m.title.lower())
