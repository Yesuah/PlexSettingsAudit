import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Tv, Film } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import type { Show, Movie } from '@/types'

interface SearchPageProps {
  onSelectShow: (show: Show) => void
  onSelectMovie: (movie: Movie) => void
}

export default function SearchPage({ onSelectShow, onSelectMovie }: SearchPageProps) {
  const [mediaType, setMediaType] = useState<'tv' | 'movie'>('tv')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 400)
    return () => clearTimeout(timer)
  }, [query])

  const { data: shows, isLoading: showsLoading, isError: showsError } = useQuery({
    queryKey: ['search', 'tv', debouncedQuery],
    queryFn: () => api.searchTV(debouncedQuery),
    enabled: mediaType === 'tv' && debouncedQuery.length >= 2,
  })

  const { data: movies, isLoading: moviesLoading, isError: moviesError } = useQuery({
    queryKey: ['search', 'movie', debouncedQuery],
    queryFn: () => api.searchMovies(debouncedQuery),
    enabled: mediaType === 'movie' && debouncedQuery.length >= 2,
  })

  const isLoading = showsLoading || moviesLoading
  const isError = showsError || moviesError
  const hasResults =
    (mediaType === 'tv' && (shows?.length ?? 0) > 0) ||
    (mediaType === 'movie' && (movies?.length ?? 0) > 0)
  const isEmpty =
    debouncedQuery.length >= 2 && !isLoading && !hasResults && !isError

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold tracking-tight">Plex Settings Audit</h1>

        <div className="mb-6 flex gap-2">
          <div className="flex rounded-md border overflow-hidden shrink-0">
            <button
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                mediaType === 'tv'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent text-foreground'
              }`}
              onClick={() => setMediaType('tv')}
            >
              <Tv className="h-4 w-4" />
              TV
            </button>
            <button
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                mediaType === 'movie'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent text-foreground'
              }`}
              onClick={() => setMediaType('movie')}
            >
              <Film className="h-4 w-4" />
              Movies
            </button>
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={`Search ${mediaType === 'tv' ? 'TV shows' : 'movies'}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {isLoading && (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive-foreground">
            Failed to load results. Is the API running?
          </p>
        )}

        {isEmpty && (
          <p className="text-center text-muted-foreground py-12">
            No results for &ldquo;{debouncedQuery}&rdquo;
          </p>
        )}

        {mediaType === 'tv' && shows && shows.length > 0 && (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {shows.map((show) => (
              <button
                key={show.rating_key}
                onClick={() => onSelectShow(show)}
                className="flex flex-col gap-2 rounded-lg border bg-card p-4 text-left hover:bg-accent transition-colors"
              >
                <Tv className="h-5 w-5 text-muted-foreground" />
                <div className="font-medium text-sm leading-tight">{show.title}</div>
                <div className="text-xs text-muted-foreground">
                  {show.year && <span>{show.year} &middot; </span>}
                  {show.leaf_count} episodes
                </div>
              </button>
            ))}
          </div>
        )}

        {mediaType === 'movie' && movies && movies.length > 0 && (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {movies.map((movie) => (
              <button
                key={movie.rating_key}
                onClick={() => onSelectMovie(movie)}
                className="flex flex-col gap-2 rounded-lg border bg-card p-4 text-left hover:bg-accent transition-colors"
              >
                <Film className="h-5 w-5 text-muted-foreground" />
                <div className="font-medium text-sm leading-tight">{movie.title}</div>
                {movie.year && (
                  <div className="text-xs text-muted-foreground">{movie.year}</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
