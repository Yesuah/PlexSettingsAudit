import { useState } from 'react'
import SearchPage from '@/pages/SearchPage'
import EpisodesPage from '@/pages/EpisodesPage'
import MoviePage from '@/pages/MoviePage'
import type { Show, Movie } from '@/types'

type View =
  | { type: 'search' }
  | { type: 'episodes'; show: Show }
  | { type: 'movie'; movie: Movie }

export default function App() {
  const [view, setView] = useState<View>({ type: 'search' })

  if (view.type === 'episodes') {
    return (
      <EpisodesPage
        show={view.show}
        onBack={() => setView({ type: 'search' })}
      />
    )
  }

  if (view.type === 'movie') {
    return (
      <MoviePage
        movie={view.movie}
        onBack={() => setView({ type: 'search' })}
      />
    )
  }

  return (
    <SearchPage
      onSelectShow={(show) => setView({ type: 'episodes', show })}
      onSelectMovie={(movie) => setView({ type: 'movie', movie })}
    />
  )
}
