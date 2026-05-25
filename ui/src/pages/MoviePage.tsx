import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Movie, AudioTrack, SubtitleTrack } from '@/types'

interface MoviePageProps {
  movie: Movie
  onBack: () => void
}

export default function MoviePage({ movie, onBack }: MoviePageProps) {
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['movie', movie.rating_key],
    queryFn: () => api.getMovie(movie.rating_key),
    initialData: movie,
  })

  const audioMutation = useMutation({
    mutationFn: (streamId: string) => api.setAudio(data.part_id, streamId),
    onSuccess: (_result, streamId) => {
      queryClient.setQueryData<Movie>(['movie', movie.rating_key], (old) =>
        old
          ? {
              ...old,
              audio_tracks: old.audio_tracks.map((t) => ({
                ...t,
                selected: t.id === streamId,
              })),
            }
          : old,
      )
    },
  })

  const subtitleMutation = useMutation({
    mutationFn: (streamId: string) => api.setSubtitle(data.part_id, streamId),
    onSuccess: (_result, streamId) => {
      queryClient.setQueryData<Movie>(['movie', movie.rating_key], (old) =>
        old
          ? {
              ...old,
              subtitle_tracks: old.subtitle_tracks.map((t) => ({
                ...t,
                selected: t.id === streamId,
              })),
            }
          : old,
      )
    },
  })

  const selectedAudioId =
    data.audio_tracks.find((t) => t.selected)?.id ?? data.audio_tracks[0]?.id ?? ''
  const selectedSubtitleId =
    data.subtitle_tracks.find((t) => t.selected)?.id ?? 'none'

  const hasEnglishAudio = data.audio_tracks.some((t) => t.is_english)
  const hasEnglishSub = data.subtitle_tracks.some((t) => t.is_english)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        {isLoading && <Skeleton className="h-64" />}
        {isError && (
          <p className="text-sm text-destructive-foreground">Failed to load movie details.</p>
        )}

        {data && (
          <Card>
            <CardHeader>
              <CardTitle>{data.title}</CardTitle>
              {data.year && (
                <p className="text-sm text-muted-foreground">{data.year}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <TrackRow
                label="Audio"
                tracks={data.audio_tracks}
                value={selectedAudioId}
                isPending={audioMutation.isPending}
                isError={audioMutation.isError}
                isEnglishAvailable={hasEnglishAudio}
                onValueChange={(id) => audioMutation.mutate(id)}
              />
              <TrackRow
                label="Subtitle"
                tracks={data.subtitle_tracks}
                value={selectedSubtitleId}
                isPending={subtitleMutation.isPending}
                isError={subtitleMutation.isError}
                isEnglishAvailable={hasEnglishSub}
                onValueChange={(id) => subtitleMutation.mutate(id)}
                includeNone
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function TrackRow({
  label,
  tracks,
  value,
  isPending,
  isError,
  isEnglishAvailable,
  onValueChange,
  includeNone = false,
}: {
  label: string
  tracks: AudioTrack[] | SubtitleTrack[]
  value: string
  isPending: boolean
  isError: boolean
  isEnglishAvailable: boolean
  onValueChange: (id: string) => void
  includeNone?: boolean
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-16 text-sm font-medium text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-2 flex-1">
        <Select value={value} onValueChange={onValueChange} disabled={isPending}>
          <SelectTrigger className={cn('flex-1', isError && 'border-destructive')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {includeNone && <SelectItem value="none">None</SelectItem>}
            {tracks.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.display_title ?? t.language ?? 'Unknown'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        English
        {isEnglishAvailable ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <X className="h-4 w-4 text-red-500" />
        )}
      </div>
    </div>
  )
}
