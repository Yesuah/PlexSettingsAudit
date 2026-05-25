from enum import Enum
from pydantic import BaseModel, computed_field
from .streams import AudioTrack, SubtitleTrack


class MediaType(str, Enum):
    tv = "tv"
    movie = "movie"


class EpisodeStatus(str, Enum):
    good = "good"  # has English audio
    warn = "warn"  # no English audio, but has English subtitles
    bad = "bad"    # no English audio or subtitles


class Show(BaseModel):
    rating_key: str
    title: str
    year: int | None = None
    thumb: str | None = None
    leaf_count: int = 0


class Season(BaseModel):
    rating_key: str
    show_rating_key: str
    title: str
    index: int


class Episode(BaseModel):
    rating_key: str
    season_rating_key: str
    show_rating_key: str
    title: str
    season_index: int
    episode_index: int
    part_id: str
    audio_tracks: list[AudioTrack] = []
    subtitle_tracks: list[SubtitleTrack] = []

    @computed_field
    @property
    def code(self) -> str:
        return f"S{self.season_index:02d}E{self.episode_index:02d}"

    @computed_field
    @property
    def status(self) -> EpisodeStatus:
        if any(t.is_english for t in self.audio_tracks):
            return EpisodeStatus.good
        if any(t.is_english for t in self.subtitle_tracks):
            return EpisodeStatus.warn
        return EpisodeStatus.bad

    @computed_field
    @property
    def active_subtitle(self) -> SubtitleTrack | None:
        return next((t for t in self.subtitle_tracks if t.selected), None)


class Movie(BaseModel):
    rating_key: str
    title: str
    year: int | None = None
    thumb: str | None = None
    part_id: str
    audio_tracks: list[AudioTrack] = []
    subtitle_tracks: list[SubtitleTrack] = []

    @computed_field
    @property
    def active_subtitle(self) -> SubtitleTrack | None:
        return next((t for t in self.subtitle_tracks if t.selected), None)
