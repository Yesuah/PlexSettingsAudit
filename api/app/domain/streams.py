from enum import IntEnum
from pydantic import BaseModel, computed_field


class StreamType(IntEnum):
    video = 1
    audio = 2
    subtitle = 3


class Stream(BaseModel):
    id: str
    stream_type: StreamType
    codec: str | None = None
    language: str | None = None
    language_code: str | None = None
    language_tag: str | None = None
    display_title: str | None = None
    selected: bool = False
    forced: bool = False

    @computed_field
    @property
    def is_english(self) -> bool:
        lc = (self.language_code or "").lower()
        lt = (self.language_tag or "").lower()
        lang = (self.language or "").lower()
        return (
            lc in ("eng", "en")
            or lt.startswith("en")
            or lang == "english"
            or lang.startswith("english")
        )


class AudioTrack(Stream):
    channels: int | None = None
    stream_type: StreamType = StreamType.audio


class SubtitleTrack(Stream):
    title: str | None = None
    stream_type: StreamType = StreamType.subtitle
