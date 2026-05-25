from ..data.plex_client import PlexClient


class SettingsService:
    def __init__(self, client: PlexClient) -> None:
        self._client = client

    async def set_subtitle(self, part_id: str, stream_id: str) -> None:
        await self._client.put(
            f"/library/parts/{part_id}",
            subtitleStreamID=stream_id,
            allParts=1,
        )

    async def set_audio(self, part_id: str, stream_id: str) -> None:
        await self._client.put(
            f"/library/parts/{part_id}",
            audioStreamID=stream_id,
            allParts=1,
        )

    async def bulk_set_subtitle(self, part_stream_pairs: list[tuple[str, str]]) -> dict[str, str]:
        """Returns a map of part_id -> 'ok' | error message."""
        results: dict[str, str] = {}
        for part_id, stream_id in part_stream_pairs:
            try:
                await self.set_subtitle(part_id, stream_id)
                results[part_id] = "ok"
            except Exception as exc:
                results[part_id] = str(exc)
        return results

    async def bulk_set_audio(self, part_stream_pairs: list[tuple[str, str]]) -> dict[str, str]:
        """Returns a map of part_id -> 'ok' | error message."""
        results: dict[str, str] = {}
        for part_id, stream_id in part_stream_pairs:
            try:
                await self.set_audio(part_id, stream_id)
                results[part_id] = "ok"
            except Exception as exc:
                results[part_id] = str(exc)
        return results
