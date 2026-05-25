import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ChevronDown, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Show, Episode, AudioTrack, SubtitleTrack } from '@/types'

interface EpisodesPageProps {
  show: Show
  onBack: () => void
}

export default function EpisodesPage({ show, onBack }: EpisodesPageProps) {
  const { data: episodes, isLoading, isError } = useQuery({
    queryKey: ['episodes', show.rating_key],
    queryFn: () => api.getEpisodes(show.rating_key),
  })

  const grouped = useMemo(() => {
    if (!episodes) return new Map<number, Episode[]>()
    return episodes.reduce((acc, ep) => {
      const season = acc.get(ep.season_index) ?? []
      season.push(ep)
      acc.set(ep.season_index, season)
      return acc
    }, new Map<number, Episode[]>())
  }, [episodes])

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{show.title}</h1>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive-foreground">
            Failed to load episodes.
          </p>
        )}

        {episodes && (
          <div className="space-y-4">
            {Array.from(grouped.entries()).map(([seasonIndex, eps]) => (
              <SeasonGroup
                key={seasonIndex}
                season={seasonIndex}
                episodes={eps}
                showId={show.rating_key}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SeasonGroup({
  season,
  episodes,
  showId,
}: {
  season: number
  episodes: Episode[]
  showId: string
}) {
  const [open, setOpen] = useState(true)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm font-medium hover:bg-accent transition-colors">
        <span>
          Season {season}
          <span className="ml-2 text-muted-foreground font-normal">
            {episodes.length} episodes
          </span>
        </span>
        <ChevronDown
          className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-1 rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground w-[30%]">
                  Episode
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground w-[25%]">
                  Audio
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground w-[25%]">
                  Subtitle
                </th>
                <th className="px-4 py-2 text-center font-medium text-muted-foreground w-[10%]">
                  Eng Audio
                </th>
                <th className="px-4 py-2 text-center font-medium text-muted-foreground w-[10%]">
                  Eng Sub
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {episodes.map((ep) => (
                <EpisodeRow key={ep.rating_key} episode={ep} showId={showId} />
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function EpisodeRow({ episode, showId }: { episode: Episode; showId: string }) {
  const queryClient = useQueryClient()

  const audioMutation = useMutation({
    mutationFn: (streamId: string) => api.setAudio(episode.part_id, streamId),
    onSuccess: (_data, streamId) => {
      queryClient.setQueryData<Episode[]>(['episodes', showId], (old) =>
        old?.map((ep) =>
          ep.rating_key === episode.rating_key
            ? {
                ...ep,
                audio_tracks: ep.audio_tracks.map((t) => ({
                  ...t,
                  selected: t.id === streamId,
                })),
              }
            : ep,
        ),
      )
    },
  })

  const subtitleMutation = useMutation({
    mutationFn: (streamId: string) => api.setSubtitle(episode.part_id, streamId),
    onSuccess: (_data, streamId) => {
      queryClient.setQueryData<Episode[]>(['episodes', showId], (old) =>
        old?.map((ep) =>
          ep.rating_key === episode.rating_key
            ? {
                ...ep,
                subtitle_tracks: ep.subtitle_tracks.map((t) => ({
                  ...t,
                  selected: t.id === streamId,
                })),
              }
            : ep,
        ),
      )
    },
  })

  const selectedAudioId =
    episode.audio_tracks.find((t) => t.selected)?.id ??
    episode.audio_tracks[0]?.id ??
    ''
  const selectedSubtitleId =
    episode.subtitle_tracks.find((t) => t.selected)?.id ?? 'none'

  const hasEnglishAudio = episode.audio_tracks.some((t) => t.is_english)
  const hasEnglishSub = episode.subtitle_tracks.some((t) => t.is_english)

  return (
    <tr className="hover:bg-muted/20">
      <td className="px-4 py-2">
        <span className="font-mono text-xs text-muted-foreground mr-2">{episode.code}</span>
        {episode.title}
      </td>
      <td className="px-4 py-2">
        <TrackSelect
          tracks={episode.audio_tracks}
          value={selectedAudioId}
          isPending={audioMutation.isPending}
          isError={audioMutation.isError}
          onValueChange={(id) => audioMutation.mutate(id)}
        />
      </td>
      <td className="px-4 py-2">
        <TrackSelect
          tracks={episode.subtitle_tracks}
          value={selectedSubtitleId}
          isPending={subtitleMutation.isPending}
          isError={subtitleMutation.isError}
          onValueChange={(id) => subtitleMutation.mutate(id)}
          includeNone
        />
      </td>
      <td className="px-4 py-2 text-center">
        <AvailabilityIcon available={hasEnglishAudio} />
      </td>
      <td className="px-4 py-2 text-center">
        <AvailabilityIcon available={hasEnglishSub} />
      </td>
    </tr>
  )
}

function TrackSelect({
  tracks,
  value,
  isPending,
  isError,
  onValueChange,
  includeNone = false,
}: {
  tracks: AudioTrack[] | SubtitleTrack[]
  value: string
  isPending: boolean
  isError: boolean
  onValueChange: (id: string) => void
  includeNone?: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      <Select value={value} onValueChange={onValueChange} disabled={isPending}>
        <SelectTrigger className={cn('h-8 text-xs', isError && 'border-destructive')}>
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
      {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />}
    </div>
  )
}

function AvailabilityIcon({ available }: { available: boolean }) {
  return available ? (
    <Check className="h-4 w-4 text-green-500 mx-auto" />
  ) : (
    <X className="h-4 w-4 text-red-500 mx-auto" />
  )
}
