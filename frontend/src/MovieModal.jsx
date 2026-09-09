import { useEffect, useState } from 'react'
import { getMood } from './data'
import {
  StarIcon,
  PlayIcon,
  PlusIcon,
  CheckIcon,
  EyeIcon,
  ShareIcon,
  CloseIcon,
} from './icons'

export default function MovieModal({
  movie,
  open,
  onOpenChange,
  inList = false,
  watched = false,
  onToggleList,
  onToggleWatched,
}) {
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!open || !movie) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, movie, onOpenChange])

  if (!movie) return null
  const mood = getMood(movie.mood)

  const trailerUrl = movie.trailerKey
    ? `https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1&rel=0`
    : null

  function handlePlay() {
    setPlaying((value) => !value)
  }

  return (
    <div
      className="modal-overlay"
      onClick={() => onOpenChange(false)}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={mood ? { '--mood': mood.accent } : undefined}
        className="modal"
      >
        <button
          type="button"
          className="modal-close"
          onClick={() => onOpenChange(false)}
          aria-label="Cerrar"
        >
          <CloseIcon size={16} />
        </button>

        <div className="modal-poster">
          {playing && trailerUrl ? (
            <div className="modal-video">
              <iframe
                src={trailerUrl}
                title={`Tráiler de ${movie.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : playing ? (
            <div className="modal-video modal-video-empty">
              <p>Tráiler no disponible para este título.</p>
            </div>
          ) : (
            <img
              src={movie.poster}
              alt={`Escena de ${movie.title}`}
              width={640}
              height={960}
            />
          )}
          <div aria-hidden="true" className="veil-bottom" />
          <div aria-hidden="true" className="modal-mood-glow" />
          <div className="modal-details">
            {mood ? (
              <span
                className="mood-pill"
                style={{
                  color: 'var(--mood)',
                  backgroundColor: 'color-mix(in oklab, var(--mood) 16%, transparent)',
                  boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--mood) 40%, transparent)',
                }}
              >
                <span aria-hidden="true">{mood.glyph}</span>
                Para un ánimo {mood.label.toLowerCase()}
              </span>
            ) : (
              <span className="mood-pill">Añadida a tu biblioteca</span>
            )}
            <h3 className="modal-title">{movie.title}</h3>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-meta">
            <span className="match">
              <StarIcon size={14} fill="currentColor" />
              {movie.match}
              % match
            </span>
            <span aria-hidden="true" className="sep">
              ·
            </span>
            <span>{movie.year || '—'}</span>
            {movie.duration ? (
              <>
                <span aria-hidden="true" className="sep">
                  ·
                </span>
                <span>{movie.duration}</span>
              </>
            ) : null}
            {movie.rating ? <span className="rating">{movie.rating}</span> : null}
          </div>

          <div className="modal-text">
            {movie.tagline ? <p className="tagline">{movie.tagline}</p> : null}
            <p className="synopsis">{movie.synopsis}</p>
          </div>

          {movie.genres?.length ? (
            <div className="modal-genres">
              {movie.genres.map((g) => (
                <span key={g}>{g}</span>
              ))}
            </div>
          ) : null}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handlePlay}
              disabled={!trailerUrl && !playing}
            >
              <PlayIcon size={20} fill="currentColor" />
              {!trailerUrl ? 'Tráiler no disponible' : playing ? 'Cerrar tráiler' : 'Reproducir tráiler'}
            </button>
            <button
              type="button"
              className={`btn btn-secondary btn-lg${inList ? ' btn-in-list' : ''}`}
              onClick={() => onToggleList(movie)}
            >
              {inList ? <CheckIcon size={20} /> : <PlusIcon size={20} />}
              {inList ? 'En mi lista' : 'Mi lista'}
            </button>
            <button
              type="button"
              className={`btn btn-secondary btn-lg${watched ? ' btn-in-list' : ''}`}
              onClick={() => onToggleWatched(movie)}
            >
              <EyeIcon size={20} />
              {watched ? 'Ya vista' : 'Marcar vista'}
            </button>
            <button type="button" className="btn btn-ghost btn-lg" aria-label="Compartir">
              <ShareIcon size={20} />
            </button>
          </div>

          <p className="modal-footnote">
            Continúa donde lo dejaste en cualquier dispositivo. Audio original con subtítulos en
            12 idiomas.
          </p>
        </div>
      </div>
    </div>
  )
}