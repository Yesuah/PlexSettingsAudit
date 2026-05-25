from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


def _read_docker_secret(name: str) -> str:
    path = Path(f"/run/secrets/{name}")
    if path.exists():
        return path.read_text().strip()
    return ""


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="PLEX_", env_file=".env", extra="ignore")

    url: str = ""
    token: str = ""

    def model_post_init(self, __context: object) -> None:
        # Docker secrets take precedence; fall back to env vars / .env
        if not self.url:
            object.__setattr__(self, "url", _read_docker_secret("plex_url"))
        if not self.token:
            object.__setattr__(self, "token", _read_docker_secret("plex_token"))


@lru_cache
def get_settings() -> Settings:
    return Settings()
