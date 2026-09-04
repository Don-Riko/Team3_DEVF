import { useEffect } from 'react'
import { getMood } from './data'
import { StarIcon, PlayIcon, PlusIcon, ShareIcon, CloseIcon } from './icons'

export default function MovieModal({ movie, open, onOpenChange }) {
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

  return (
    <div
      className="modal-overlay"
      onClick={() => onOpenChange(false)}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de ${movie.title}`}
        style={{ '--mood': mood.accent }}
        className="modal"
        onClick={(e) => e.stopPropagation()}
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
          <img
            src={movie.poster}
            alt={`Escena de ${movie.title}`}
            width={640}
            height={960}
          />
          <div aria-hidden="true" className="veil-bottom" />
          <div aria-hidden="true" className="modal-mood-glow" />
          <div className="modal-details">
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
            <span>{movie.year}</span>
            <span aria-hidden="true" className="sep">
              ·
            </span>
            <span>{movie.duration}</span>
            <span className="rating">{movie.rating}</span>
            <span className="hdr">4K HDR</span>
          </div>

          <div className="modal-text">
            <p className="tagline">{movie.tagline}</p>
            <p className="synopsis">{movie.synopsis}</p>
          </div>

          <div className="modal-genres">
            {movie.genres.map((g) => (
              <span key={g}>{g}</span>
            ))}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-primary btn-lg">
              <PlayIcon size={20} fill="currentColor" />
              Reproducir ahora
            </button>
            <button type="button" className="btn btn-secondary btn-lg">
              <PlusIcon size={20} />
              Mi lista
            </button>
            <button type="button" className="btn btn-ghost btn-lg">
              <ShareIcon size={20} />
              Compartir
            </button>
          </div>

          <p className="modal-footnote">
            Continúa donde lo dejaste en cualquier dispositivo. Audio original con subtítulos en 12
            idiomas.
          </p>
        </div>
      </div>
    </div>
  )
}