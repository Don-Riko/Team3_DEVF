import { getMood } from './data'
import { PlayIcon } from './icons'

export default function MovieCard({ movie, onOpen }) {
  const mood = getMood(movie.mood)
  return (
    <button
      type="button"
      onClick={() => onOpen(movie)}
      style={{ '--mood': mood.accent }}
      className="movie-card"
      aria-label={`Ver detalle de ${movie.title}`}
    >
      <span className="movie-poster">
        <img
          src={movie.poster}
          alt={`Póster de ${movie.title}`}
          loading="lazy"
          width={640}
          height={960}
        />
        <span aria-hidden="true" className="veil-bottom" />
        {movie.badge ? <span className="movie-badge">{movie.badge}</span> : null}
        <span aria-hidden="true" className="movie-play">
          <PlayIcon size={16} fill="currentColor" />
        </span>
      </span>
      <span className="movie-info">
        <span
          className="mood-pill"
          style={{
            color: 'var(--mood)',
            backgroundColor: 'color-mix(in oklab, var(--mood) 14%, transparent)',
            boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--mood) 35%, transparent)',
          }}
        >
          <span aria-hidden="true">{mood.glyph}</span>
          {mood.label}
        </span>
        <span className="movie-title">{movie.title}</span>
        <span className="movie-meta">
          <span className="match">
            {movie.match}
            % match
          </span>
          <span aria-hidden="true" className="sep">
            ·
          </span>
          <span>{movie.year}</span>
          <span aria-hidden="true" className="sep">
            ·
          </span>
          <span>{movie.duration}</span>
        </span>
      </span>
    </button>
  )
}