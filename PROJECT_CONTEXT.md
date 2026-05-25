# Plex Language & Subtitle Checker — Project Context

This document is the starting context for a project to build a tool that audits a Plex media server for English audio/subtitle coverage and lets the user bulk-set English subtitles on selected episodes.

This was originally prototyped as a single-file HTML page during a Claude conversation. The HTML prototype works but the goal going forward is to evolve it (or rewrite it) into something more robust — see "Next Steps / Open Questions" at the bottom.

---

## Background & Goal

**Problem:** The user has a Plex media server (`https://plex.yesowl.org`) with TV shows. They want to verify, per series, that every episode has either English audio OR English subtitles, without checking episode-by-episode in the Plex UI. They also want to bulk-set English subtitles as the default track on selected episodes.

**Server context:**
- Plex instance: `https://plex.yesowl.org`
- Two libraries:
  - Movies — section key `1`, path `/media/movies`
  - TV Shows — section key `2`, path `/media/tv`
- Library section UUID for TV: `eb7d7807-a42b-4c07-b759-18b7478a3a51`

---

## Plex API — What We Learned

### Authentication
- Uses an `X-Plex-Token` query parameter (or header) on every request.
- The user obtained their token from the "Get Info → View XML" trick in the Plex web UI.
- Token grants full server access; treat as a secret.

### Useful endpoints

| Endpoint | Purpose |
|---|---|
| `GET /library/sections` | List all libraries (Movies, TV Shows, etc). Returns `<Directory>` elements with section `key`, `type`, `title`. |
| `GET /library/sections/{sectionKey}/all` | List all top-level items (shows) in a library. Returns show-level metadata only — **no stream info**. Filter with `type=2` to limit to shows. |
| `GET /library/metadata/{showRatingKey}/allLeaves` | List every episode under a show. Returns `<Video>` elements with `<Media>` and `<Part>` children — **but the `<Stream>` array is omitted on the user's Plex server.** |
| `GET /library/metadata/{episodeRatingKey}` | Full metadata for a single episode, **including the `<Stream>` array** with all audio/subtitle tracks. This is the reliable way to get stream data. |
| `PUT /library/parts/{partId}?subtitleStreamID={streamId}&allParts=1` | Set the default subtitle stream for a part (per-server, not per-user). `audioStreamID={id}` works analogously for audio. |

### Stream object structure
Inside a `<Part>`, each `<Stream>` has:
- `streamType`: `1` = video, `2` = audio, `3` = subtitle
- `id`: stream ID (used in PUT calls)
- `language`: human-readable e.g. "English"
- `languageCode`: ISO code e.g. `eng`, `spa`, `jpn`
- `languageTag`: BCP-47 tag e.g. `en-US`
- `selected`: `1` if this is currently the active default track
- `forced`: `1` for forced subtitle tracks
- `displayTitle`, `title`: optional descriptive labels

### Critical quirk discovered
On this Plex server, `allLeaves` returns the list of episodes with `<Media>` and `<Part>` elements but **strips out the `<Stream>` children entirely**. Confirmed by inspection: 24 `<Media>` + 24 `<Part>` + **0 `<Stream>`** elements in the response for show `TO BE HERO X` (ratingKey `2334`, 24 episodes).

**Workaround:** Fetch each episode's full metadata individually via `/library/metadata/{episodeKey}`. This returns the full stream list. The prototype runs 6 parallel requests to keep this reasonably fast.

### Another quirk
The endpoint `/library/metadata/{key}` can target a show, season, or episode depending on the ratingKey. The `allLeaves` suffix only returns results for shows. If you call `/allLeaves` on a season's ratingKey, it returns `size="0"` with no children — silently. We hit this initially because show `TO BE HERO X` has ratingKey `2334` but Season 1 has ratingKey `2335`, and we tested with `2335` first by mistake.

### Language detection logic
A track counts as English if any of the following is true (case-insensitive):
- `languageCode` is `eng` or `en`
- `languageTag` starts with `en`
- `language` is `English` or starts with `English`

This catches the variations Plex stores depending on how the file was tagged.

---

## Current Prototype

Single self-contained HTML file (`plex-subs.html`). Vanilla JS, no build step, no dependencies. Open in a browser, paste server URL + token, search for a show, audit episodes, bulk-set English subs.

### Features working
- Connect to Plex server with URL + token
- List TV libraries and let user pick one
- Search shows by title (or list all)
- Per-show: fetch all episodes + their full stream details (parallel batched per-episode requests)
- Display per-episode table with:
  - Audio track language pills (green if English)
  - Subtitle track language pills (green if English, blue if currently selected, ⚑ if forced)
  - Status pill: "EN audio" / "EN subs only" / "no English"
  - Currently active subtitle pill
- Summary stats: total episodes, EN-audio count, EN-subs-only count, no-English count
- Bulk select episodes; helper buttons: Select All, Clear, Select Missing English Subs (auto-picks episodes that have English subs available but aren't currently using them)
- Bulk action: set first non-forced English subtitle as default for selected episodes (falls back to forced if that's all there is). Uses `PUT /library/parts/{partId}?subtitleStreamID={id}&allParts=1`.

### Architecture notes
- All state in a single `state` object (server, token, libraries, shows, selectedShow, episodes)
- `plexGet` / `plexPut` helpers wrap `fetch` and inject the token automatically
- Asks Plex for JSON via `Accept: application/json` header (Plex serves XML by default but supports JSON content negotiation)
- Episode processing in `processEpisode()` normalizes stream data and tags each episode with a status (`good` / `warn` / `bad`)
- Per-episode metadata fetch uses a parallel worker pool (concurrency = 6) to balance speed vs. server load

### Known limitations of the prototype
- No audio-track switching (only subtitles)
- No library-wide scan (one show at a time)
- No CSV/JSON export of the audit
- No persistence — token must be re-entered each session
- Synchronous re-fetch on every show selection (no caching)
- The "Set Selected → English Subtitles" only picks the first non-forced English track; doesn't let user choose which English track when multiple exist (e.g. SDH vs regular)
- Error reporting on bulk operations is rudimentary

---

## Next Steps / Open Questions

Things the user may want to build out next — TBD which to prioritize:

1. **Move off single-file HTML** — Possibly a small local web app (Python/FastAPI backend + frontend) or a CLI tool, depending on user preference. The user has strong Python and .NET/C# experience.
2. **Library-wide audit** — Scan every show in the library and produce a report of which shows/seasons/episodes are missing English coverage. Useful as a one-shot health check.
3. **Caching** — Cache the per-episode metadata fetch to disk so re-runs are fast.
4. **Audio track switching** — Same pattern as subtitle switching but with `audioStreamID`.
5. **Smarter sub track selection** — When multiple English subs exist, let the user pick (regular vs SDH vs commentary). Heuristics on `title`, `displayTitle`, and `forced` flag.
6. **Export to CSV/JSON** — For tracking over time or for ingest into other tools.
7. **Auth via Plex.tv OAuth** — Instead of pasting a token. Optional, the token approach is fine for personal use.
8. **Home Assistant integration?** — User runs Home Assistant; could expose audit results as sensors or send notifications when new media is added without English subs. Speculative.
9. **Handle file metadata fixes** — When tracks are tagged with `unk` / wrong language, the user has to fix the file (e.g. mkvtoolnix). Could the tool flag those files and produce a list to feed into a remux script?

---

## Useful Sample Data

### Example show entry (from `/library/sections/2/all`)
```xml
<Directory ratingKey="2334" key="/library/metadata/2334/children"
  type="show" title="TO BE HERO X" year="2025"
  leafCount="24" childCount="1" addedAt="1757808525" ... />
```

### Example episode entry (from `/library/metadata/2334/allLeaves` — note no Stream children)
```xml
<Video ratingKey="2336" parentRatingKey="2335" grandparentRatingKey="2334"
  type="episode" title="NICE" index="1" parentIndex="1" ...>
  <Media ...>
    <Part id="3214" key="/library/parts/3214/1744083519/file.mkv"
      file="/media/tv/TO BE HERO X/TO.BE.HERO.X.S01E01.NICE.1080p.CR.WEB-DL.DUAL.AAC2.0.H.264-Kitsune.mkv"
      container="mkv" videoProfile="high" audioProfile="lc" />
  </Media>
</Video>
```

### Example full episode metadata (from `/library/metadata/2336`)
Same structure plus `<Stream>` children inside `<Part>`:
```xml
<Stream id="..." streamType="1" codec="h264" .../>  <!-- video -->
<Stream id="..." streamType="2" codec="aac" language="English" languageCode="eng" selected="1" .../>
<Stream id="..." streamType="2" codec="aac" language="Chinese" languageCode="zho" .../>
<Stream id="..." streamType="3" codec="ass" language="English" languageCode="eng" selected="1" .../>
```

---

## Files to Carry Forward

- `plex-subs.html` — The working prototype. Use as the source of truth for the API patterns and the language-detection logic.

---

## User Background (for tone/depth calibration)

Software developer comfortable with .NET/C#, Python, Azure Functions, SQL Server. Runs a substantial homelab: Home Assistant on Proxmox, Zigbee2MQTT, pfSense, Unraid, Tailscale, self-hosted services (Immich, etc.). Strong Python preference for scripting/tooling. Hands-on with Docker, CI/CD, certs/networking. Speaks Spanish conversationally. Lives in Chicago.
