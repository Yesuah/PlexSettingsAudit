import asyncio
import logging
from ..data.plex_client import PlexClient
from ..data.plex_parser import parse_episode, parse_movie
from ..domain.media import Episode, Movie

logger = logging.getLogger(__name__)

# Cap parallel per-episode fetches — allLeaves strips Stream data on this server,
# so each episode needs its own metadata request.
CONCURRENCY = 6


class MetadataService:
    def __init__(self, client: PlexClient) -> None:
        self._client = client

    async def get_episodes(self, show_rating_key: str) -> list[Episode]:
        data = await self._client.get(f"/library/metadata/{show_rating_key}/allLeaves")
        stubs = data.get("MediaContainer", {}).get("Metadata") or []

        semaphore = asyncio.Semaphore(CONCURRENCY)
        tasks = [self._fetch_episode(ep["ratingKey"], semaphore) for ep in stubs]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        episodes: list[Episode] = []
        for rating_key, result in zip([ep["ratingKey"] for ep in stubs], results):
            if isinstance(result, Exception):
                logger.warning("Failed to fetch episode %s: %s", rating_key, result)
            else:
                episodes.append(result)

        return sorted(episodes, key=lambda e: (e.season_index, e.episode_index))

    async def get_movie(self, movie_rating_key: str) -> Movie:
        data = await self._client.get(f"/library/metadata/{movie_rating_key}")
        raw = (data.get("MediaContainer", {}).get("Metadata") or [{}])[0]
        return parse_movie(raw)

    async def _fetch_episode(self, rating_key: str, semaphore: asyncio.Semaphore) -> Episode:
        async with semaphore:
            data = await self._client.get(f"/library/metadata/{rating_key}")
            raw = (data.get("MediaContainer", {}).get("Metadata") or [{}])[0]
            return parse_episode(raw)
