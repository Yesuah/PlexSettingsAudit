import type { Show, Episode, Movie } from '@/types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export const api = {
  searchTV: (q: string) =>
    request<Show[]>(`/search/tv?q=${encodeURIComponent(q)}`),

  searchMovies: (q: string) =>
    request<Movie[]>(`/search/movies?q=${encodeURIComponent(q)}`),

  getEpisodes: (showId: string) =>
    request<Episode[]>(`/shows/${showId}/episodes`),

  getMovie: (movieId: string) =>
    request<Movie>(`/movies/${movieId}`),

  setAudio: (partId: string, streamId: string) =>
    request<{ status: string }>(`/settings/audio/${partId}?stream_id=${streamId}`, {
      method: 'PUT',
    }),

  setSubtitle: (partId: string, streamId: string) =>
    request<{ status: string }>(`/settings/subtitle/${partId}?stream_id=${streamId}`, {
      method: 'PUT',
    }),
}
