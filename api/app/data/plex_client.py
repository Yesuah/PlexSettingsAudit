import httpx
from ..core.config import Settings


class PlexClient:
    def __init__(self, settings: Settings) -> None:
        self._base_url = settings.url.rstrip("/")
        self._client = httpx.AsyncClient(
            headers={
                "Accept": "application/json",
                "X-Plex-Token": settings.token,
            },
            timeout=30.0,
        )

    async def get(self, path: str, **params) -> dict:
        url = f"{self._base_url}{path}"
        response = await self._client.get(url, params=params)
        response.raise_for_status()
        return response.json()

    async def put(self, path: str, **params) -> None:
        url = f"{self._base_url}{path}"
        response = await self._client.put(url, params=params)
        response.raise_for_status()

    async def aclose(self) -> None:
        await self._client.aclose()
