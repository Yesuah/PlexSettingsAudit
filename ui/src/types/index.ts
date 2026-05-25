export interface AudioTrack {
  id: string
  stream_type: number
  codec: string | null
  language: string | null
  language_code: string | null
  language_tag: string | null
  display_title: string | null
  selected: boolean
  forced: boolean
  channels: number | null
  is_english: boolean
}

export interface SubtitleTrack {
  id: string
  stream_type: number
  codec: string | null
  language: string | null
  language_code: string | null
  language_tag: string | null
  display_title: string | null
  selected: boolean
  forced: boolean
  title: string | null
  is_english: boolean
}

export interface Show {
  rating_key: string
  title: string
  year: number | null
  thumb: string | null
  leaf_count: number
}

export interface Episode {
  rating_key: string
  season_rating_key: string
  show_rating_key: string
  title: string
  season_index: number
  episode_index: number
  part_id: string
  audio_tracks: AudioTrack[]
  subtitle_tracks: SubtitleTrack[]
  code: string
  status: 'good' | 'warn' | 'bad'
  active_subtitle: SubtitleTrack | null
}

export interface Movie {
  rating_key: string
  title: string
  year: number | null
  thumb: string | null
  part_id: string
  audio_tracks: AudioTrack[]
  subtitle_tracks: SubtitleTrack[]
  active_subtitle: SubtitleTrack | null
}
