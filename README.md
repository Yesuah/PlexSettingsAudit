# PlexSettingsAudit

A self-hosted tool for auditing English audio and subtitle coverage across your Plex media library, with bulk-update support for subtitle and audio track defaults.

Built as a Dockerized application with a FastAPI backend and a static frontend served by nginx.

---

## What it does

Plex does not provide an easy way to verify — at scale — whether every episode or movie in your library has English audio or subtitles available. This tool solves that by:

- Searching your Plex TV and movie libraries
- Fetching full stream metadata per episode (working around a Plex quirk where batch endpoints strip stream data)
- Classifying each episode/movie as:
  - **good** — has English audio
  - **warn** — no English audio, but English subtitles are available
  - **bad** — no English coverage at all
- Letting you bulk-set English subtitle or audio tracks as the default across many episodes at once
- Exposing a single-item endpoint for updating individual episodes or movies

---

## Project structure

```
PlexSettingsAudit/
├── api/                        # FastAPI backend
│   └── app/
│       ├── main.py             # App entry point, CORS middleware
│       ├── core/
│       │   └── config.py       # Reads credentials from Docker secrets or env vars
│       ├── domain/
│       │   ├── media.py        # Show, Episode, Movie, EpisodeStatus models
│       │   └── streams.py      # Stream, AudioTrack, SubtitleTrack models
│       ├── data/
│       │   ├── plex_client.py  # Async httpx wrapper for the Plex API
│       │   └── plex_parser.py  # Parses raw Plex JSON into domain models
│       ├── services/
│       │   ├── search_service.py    # Library search
│       │   ├── metadata_service.py  # Episode/movie stream hydration
│       │   └── settings_service.py  # Subtitle and audio track updates
│       └── api/
│           ├── search.py       # Search routes
│           ├── metadata.py     # Metadata routes
│           └── settings.py     # Settings routes
├── ui/                         # Static frontend served by nginx
│   ├── index.html
│   ├── nginx.conf              # Proxies /api/ to the FastAPI container
│   └── Dockerfile
├── docker-compose.yml
└── plex-subs.html              # Original single-file HTML prototype (reference)
```

---

## API endpoints

All endpoints are prefixed with `/api`.

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/search/tv?q={query}` | Search TV shows by title. Returns all shows if `q` is omitted. |
| `GET` | `/api/search/movies?q={query}` | Search movies by title. Returns all movies if `q` is omitted. |

### Metadata

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/shows/{show_id}/episodes` | Fetch all episodes for a show, including full audio and subtitle stream data. Each episode includes a computed `status` (`good`/`warn`/`bad`) and `code` (e.g. `S01E02`). |
| `GET` | `/api/movies/{movie_id}` | Fetch full metadata for a single movie including stream data. |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `PUT` | `/api/settings/subtitle/{part_id}?stream_id={stream_id}` | Set the default subtitle track for a single episode or movie part. |
| `PUT` | `/api/settings/audio/{part_id}?stream_id={stream_id}` | Set the default audio track for a single episode or movie part. |
| `PUT` | `/api/settings/subtitle/bulk` | Bulk-set subtitle tracks. Body: `{ "updates": [{ "part_id": "...", "stream_id": "..." }] }` |
| `PUT` | `/api/settings/audio/bulk` | Bulk-set audio tracks. Body: `{ "updates": [{ "part_id": "...", "stream_id": "..." }] }` |

Bulk endpoints return a map of `part_id → "ok"` or an error message for each item, so partial failures are visible.

A full interactive API reference is available at `/docs` (Swagger UI) when the API container is running.

---

## Configuration

Plex credentials are supplied via **Docker secrets** and never baked into the image.

Create the following files locally (they are gitignored):

```
secrets/
  plex_url.txt    # e.g. https://plex.example.com
  plex_token.txt  # your X-Plex-Token
```

For local development outside Docker, the app falls back to environment variables:

```
PLEX_URL=https://plex.example.com
PLEX_TOKEN=your-token-here
```

### Getting your Plex token

In the Plex web UI, play any item, then open **Get Info → View XML** in the browser. Your token is the `X-Plex-Token` query parameter in the URL.

---

## Running with Docker

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| UI | http://localhost:3000 |
| API | http://localhost:8000 |
| API docs | http://localhost:8000/docs |

---

## Branch strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable, protected. Merge via PR from `dev` only. |
| `dev` | Active development branch. |
| `release/X.Y.Z` | Auto-created on every merge to `main`. |

A GitHub Actions workflow enforces that PRs to `main` can only originate from `dev`. A second workflow automatically creates a `release/X.Y.Z` branch on every merge to `main`, incrementing the patch version.

---

## Known limitations

- One show or movie at a time — no library-wide batch audit yet
- No caching — stream metadata is re-fetched on every request
- Subtitle track selection always picks the first non-forced English track; no UI to choose between multiple English options (e.g. SDH vs regular)
- No OAuth — credentials are supplied via Docker secrets or environment variables
