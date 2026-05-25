"""
Converts raw Plex JSON responses into domain models.
All parsing of MediaContainer responses lives here so services stay clean.
"""
from ..domain.media import Episode, Movie, Show
from ..domain.streams import AudioTrack, StreamType, SubtitleTrack


def parse_show(raw: dict) -> Show:
    return Show(
        rating_key=str(raw["ratingKey"]),
        title=raw.get("title", ""),
        year=raw.get("year"),
        thumb=raw.get("thumb"),
        leaf_count=raw.get("leafCount", 0),
    )


def parse_movie(raw: dict) -> Movie:
    part = _first_part(raw)
    streams = _streams(part)
    return Movie(
        rating_key=str(raw["ratingKey"]),
        title=raw.get("title", ""),
        year=raw.get("year"),
        thumb=raw.get("thumb"),
        part_id=str(part["id"]) if part else "",
        audio_tracks=[_parse_audio(s) for s in streams if s.get("streamType") == StreamType.audio],
        subtitle_tracks=[_parse_subtitle(s) for s in streams if s.get("streamType") == StreamType.subtitle],
    )


def parse_episode(raw: dict) -> Episode:
    part = _first_part(raw)
    streams = _streams(part)
    return Episode(
        rating_key=str(raw["ratingKey"]),
        season_rating_key=str(raw.get("parentRatingKey", "")),
        show_rating_key=str(raw.get("grandparentRatingKey", "")),
        title=raw.get("title", ""),
        season_index=raw.get("parentIndex", 0),
        episode_index=raw.get("index", 0),
        part_id=str(part["id"]) if part else "",
        audio_tracks=[_parse_audio(s) for s in streams if s.get("streamType") == StreamType.audio],
        subtitle_tracks=[_parse_subtitle(s) for s in streams if s.get("streamType") == StreamType.subtitle],
    )


# --- private helpers ---

def _first_part(raw: dict) -> dict | None:
    media = raw.get("Media") or []
    if not media:
        return None
    parts = media[0].get("Part") or []
    return parts[0] if parts else None


def _streams(part: dict | None) -> list[dict]:
    if not part:
        return []
    return part.get("Stream") or []


def _parse_audio(raw: dict) -> AudioTrack:
    return AudioTrack(
        id=str(raw.get("id", "")),
        codec=raw.get("codec"),
        language=raw.get("language"),
        language_code=raw.get("languageCode"),
        language_tag=raw.get("languageTag"),
        display_title=raw.get("displayTitle"),
        selected=bool(raw.get("selected", 0)),
        forced=bool(raw.get("forced", 0)),
        channels=raw.get("channels"),
    )


def _parse_subtitle(raw: dict) -> SubtitleTrack:
    return SubtitleTrack(
        id=str(raw.get("id", "")),
        codec=raw.get("codec"),
        language=raw.get("language"),
        language_code=raw.get("languageCode"),
        language_tag=raw.get("languageTag"),
        display_title=raw.get("displayTitle"),
        selected=bool(raw.get("selected", 0)),
        forced=bool(raw.get("forced", 0)),
        title=raw.get("title"),
    )
