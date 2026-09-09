import { useEffect, useRef, useState } from 'react'
import { getMood } from './data'
import {
  StarIcon,
  PlayIcon,
  PauseIcon,
  PlusIcon,
  CheckIcon,
  EyeIcon,
  ShareIcon,
  CloseIcon,
  ChevronDownIcon,
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
  const [paused, setPaused] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const iframeRef = useRef(null)

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

  // Solo se arma una URL de tráiler si es un video VERIFICADO para esta
  // película (movie.trailerKey). Nunca se sustituye por un video genérico:
  // si no hay tráiler verificado se ofrece movie.trailerSearchUrl en su lugar.
  const fallbackTrailerSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${movie.title} ${movie.year || ''} official trailer`.trim(),
  )}`
  const hasTrailer = Boolean(movie.trailerKey && movie.video?.verified)
  const trailerUrl = hasTrailer
    ? `https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1&rel=0&enablejsapi=1`
    : ''

  // Controla el iframe de YouTube vía postMessage (YouTube IFrame API),
  // sin necesidad de cargar el script completo de la API.
  function sendPlayerCommand(func) {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args: [] }),
      'https://www.youtube.com',
    )
  }

  function handlePlay() {
    if (!hasTrailer) return
    if (!playing) {
      setPlaying(true)
      setPaused(false)
      return
    }
    // Ya está reproduciéndose: el botón principal cierra el tráiler.
    setPlaying(false)
    setPaused(false)
  }

  function handleTogglePause() {
    if (!playing) return
    setPaused((value) => {
      const next = !value
      sendPlayerCommand(next ? 'pauseVideo' : 'playVideo')
      return next
    })
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
                ref={iframeRef}
                src={trailerUrl}
                title={`Tráiler de ${movie.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
              <button
                type="button"
                className="video-pause-btn"
                onClick={handleTogglePause}
                aria-label={paused ? 'Reanudar tráiler' : 'Pausar tráiler'}
              >
                {paused ? <PlayIcon size={20} fill="currentColor" /> : <PauseIcon size={20} fill="currentColor" />}
              </button>
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

          <button
            type="button"
            className="btn btn-ghost btn-sm modal-expand"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? 'Ocultar detalles' : 'Ver detalles'}
            <ChevronDownIcon size={14} style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }} />
          </button>

          {expanded && movie.ratings?.length || movie.director?.length || movie.actors?.length ? (
            <div className="modal-extra">
              {movie.ratings?.length ? (
                <div className="modal-ratings">
                  {movie.ratings.map((r) => (
                    <span key={r.source} className="rating-pill">
                      {r.source}: {r.value}
                    </span>
                  ))}
                </div>
              ) : null}
              {movie.director?.length ? (
                <p className="modal-credit">
                  <strong>Dirección:</strong> {movie.director.join(', ')}
                </p>
              ) : null}
              {movie.actors?.length ? (
                <p className="modal-credit">
                  <strong>Reparto:</strong> {movie.actors.join(', ')}
                </p>
              ) : null}
              {movie.awards ? (
                <p className="modal-credit">
                  <strong>Premios:</strong> {movie.awards}
                </p>
              ) : null}
              {movie.boxOffice ? (
                <p className="modal-credit">
                  <strong>Taquilla:</strong> {movie.boxOffice}
                </p>
              ) : null}
              {movie.country?.length ? (
                <p className="modal-credit">
                  <strong>País:</strong> {movie.country.join(', ')}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="modal-actions">
            {hasTrailer ? (
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handlePlay}
              >
                <PlayIcon size={20} fill="currentColor" />
                {playing ? 'Cerrar tráiler' : 'Reproducir tráiler'}
              </button>
            ) : (
              <a
                href={movie.trailerSearchUrl || fallbackTrailerSearchUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-secondary btn-lg"
              >
                <PlayIcon size={20} fill="currentColor" />
                Buscar tráiler en YouTube
              </a>
            )}
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