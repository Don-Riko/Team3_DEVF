import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HERO_IMAGE, movies, getMood } from './data'
import {
  SearchIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from './icons'
import { useAuth } from './AuthContext'
import { recordMoodSelection } from './auth'
import { fetchLibrary, fetchOmdbCatalog, removeLibraryItem, saveLibraryItem } from './api'
import MoodPicker from './MoodPicker'
import MovieCard from './MovieCard'
import MovieModal from './MovieModal'
import ProfileModal from './ProfileModal'
import { TypingAnimation } from './components/TypingAnimation'

// Fallback: películas del catálogo local para el mood seleccionado.
function moviesForMood(moodId) {
  return movies.filter((m) => m.mood === moodId)
}

// Botón de perfil con las iniciales del usuario y un dropdown de acciones.
function ProfileMenu({ onOpenProfile }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  const initials = user?.initials ?? 'SM'

  // Cerrar al hacer click fuera o presionar Escape.
  useEffect(() => {
    if (!open) return
    function onPointer(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function handleLogout() {
    setOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  function handleProfile() {
    setOpen(false)
    onOpenProfile()
  }

  return (
    <div className="profile" ref={menuRef}>
      <button
        type="button"
        className="avatar avatar-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Perfil de ${user?.username ?? 'usuario'}`}
        onClick={() => setOpen((v) => !v)}
      >
        {initials}
      </button>
      {open ? (
        <div className="profile-menu" role="menu">
          <div className="profile-menu-head">
            <span className="profile-menu-name">{user?.username ?? 'Invitado'}</span>
            <span className="profile-menu-sub">Sesión iniciada</span>
          </div>
          <button
            type="button"
            className="profile-menu-item"
            role="menuitem"
            onClick={handleProfile}
          >
            Mi perfil de gustos
          </button>
          <button
            type="button"
            className="profile-menu-item"
            role="menuitem"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default function App() {
  const [mood, setMood] = useState(null)
  const [movie, setMovie] = useState(null)
  const { user } = useAuth()

  // ---- Catálogo / recomendaciones ----
  const [recs, setRecs] = useState({ source: 'catalog', items: [] })
  const [recLoading, setRecLoading] = useState(false)

  // ---- Biblioteca ----
  const libKey = `midnight.library.${user?.username ?? 'guest'}`
  const [library, setLibrary] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(libKey))
      return Array.isArray(stored) ? stored : []
    } catch {
      return []
    }
  })
  const [libTab, setLibTab] = useState('watchlist')

  // ---- Profile ----
  const [profileOpen, setProfileOpen] = useState(false)

  const moodMeta = mood ? getMood(mood) : null
  const watchlist = useMemo(
    () => library.filter((item) => item.status === 'watchlist'),
    [library],
  )
  const watchedList = useMemo(
    () => library.filter((item) => item.status === 'watched'),
    [library],
  )

  // Biblioteca: cache local + sincronización con el backend.
  useEffect(() => {
    if (!user?.username) return
    let cancelled = false
    fetchLibrary(user.username).then((items) => {
      if (cancelled || !items) return
      const mapped = items.map((item) => ({
        movieId: item.movie_id,
        source: item.source,
        title: item.title,
        poster: item.poster,
        year: item.year,
        trailerKey: item.trailer_key || null,
        status: item.status,
      }))
      setLibrary(mapped)
    })
    return () => {
      cancelled = true
    }
  }, [user?.username])

  useEffect(() => {
    try {
      localStorage.setItem(libKey, JSON.stringify(library))
    } catch {
      /* almacenamiento no disponible */
    }
  }, [libKey, library])

  // Carga de recomendaciones al cambiar mood.
  useEffect(() => {
    if (!mood) return
    let cancelled = false

    async function load() {
      setRecLoading(true)
      const catalog = await fetchOmdbCatalog(mood)
      if (cancelled) return
      if (catalog.ok && Array.isArray(catalog.results)) {
        setRecs({ source: 'omdb', items: catalog.results })
      } else {
        setRecs({ source: 'catalog', items: moviesForMood(mood) })
      }
      setRecLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [mood])

  function handleMoodChange(nextMood) {
    setMood(nextMood)
    if (nextMood && user?.username) {
      recordMoodSelection(user.username, nextMood)
    }
  }

  function openMovie(target) {
    setMovie(target)
  }

  // ---- Biblioteca handlers ----
  function syncItem(username, item) {
    if (username) saveLibraryItem(username, item)
  }

  function updateLibrary(movieObj, status, enabled) {
    if (enabled) {
      const item = {
        movieId: movieObj.id,
        source: movieObj.source || 'catalog',
        title: movieObj.title,
        poster: movieObj.poster,
        year: movieObj.year,
        trailerKey: movieObj.trailerKey || null,
        status,
      }
      setLibrary((prev) => {
        const exists = prev.some((entry) => entry.movieId === movieObj.id)
        return exists
          ? prev.map((entry) =>
              entry.movieId === movieObj.id ? { ...entry, ...item } : entry,
            )
          : [...prev, item]
      })
      syncItem(user?.username, item)
    } else {
      setLibrary((prev) => prev.filter((entry) => entry.movieId !== movieObj.id))
      if (user?.username) removeLibraryItem(user.username, movieObj.id)
    }
  }

  function handleToggleList(movieObj) {
    const inList = library.some(
      (entry) => entry.movieId === movieObj.id && entry.status === 'watchlist',
    )
    updateLibrary(movieObj, 'watchlist', !inList)
  }

  function handleToggleWatched(movieObj) {
    const watched = library.some(
      (entry) => entry.movieId === movieObj.id && entry.status === 'watched',
    )
    updateLibrary(movieObj, 'watched', !watched)
  }

  // ---- Scroll del carrusel ----
  const rowRef = useRef(null)
  function scrollRow(direction) {
    if (!rowRef.current) return
    rowRef.current.scrollBy({ left: direction * 320, behavior: 'smooth' })
  }

  const items = recs.items

  return (
    <main className="min-h-screen bg-background">
      <header className="site-header">
        <div className="container header-inner">
          <a href="/" className="brand">
            <span aria-hidden="true" className="brand-mark">
              <SparklesIcon size={16} />
            </span>
            <span className="brand-text">
              Midnight<span className="brand-dim"> Cinema &amp; Mood</span>
            </span>
          </a>

          <nav className="main-nav" aria-label="Navegación principal">
            <a href="#moods">Moods</a>
            <a href="#recomendaciones">Recomendaciones</a>
            <a href="#mi-biblioteca">Mi biblioteca</a>
          </nav>

          <div className="header-actions">
            <button type="button" className="icon-btn" aria-label="Buscar">
              <SearchIcon size={16} />
            </button>
            <ProfileMenu onOpenProfile={() => setProfileOpen(true)} />
          </div>
        </div>
      </header>

      <section id="moods" className="hero grain">
        <img
          src={HERO_IMAGE}
          alt=""
          width={1920}
          height={1080}
          className="hero-bg"
          aria-hidden="true"
        />
        <div aria-hidden="true" className="hero-bg--fade" />
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="step-badge">Paso 1 de 3 · Descubrimiento por ánimo</span>
            <h1 className="hero-title">¿Cómo te sientes hoy?</h1>
            <p className="hero-desc">
              Elige un estado de ánimo y armamos la sala: recomendaciones curadas para esa
              emoción exacta, listas para reproducir en tres clics.
            </p>
          </div>
          <div className="mood-wrap">
            <MoodPicker value={mood} onChange={handleMoodChange} themed />
          </div>
        </div>
      </section>

      <section id="recomendaciones" className="container recs">
        {mood ? (
          <div className="recs-reveal" key={mood}>
            <div className="recs-head">
              <div>
                <span className="recs-step">Paso 2 de 3</span>
                <h2 className="recs-title">
                  {'Para cuando te sientes'}{' '}
                  <TypingAnimation
                    className="recs-title-typed"
                    style={{ color: moodMeta?.accent }}
                    startOnView={true}
                    typeSpeed={70}
                    showCursor={false}
                  >
                    {moodMeta?.label.toLowerCase()}
                  </TypingAnimation>
                </h2>
                <p className="recs-sub">
                  {recs.source === 'omdb'
                    ? `${items.length} títulos de la cartelera OMDB afines a tu ánimo.`
                    : `${items.length} títulos del catálogo curado afines a tu ánimo.`}
                </p>
              </div>
              <div className="recs-actions">
                <div className="recs-arrows">
                  <button
                    type="button"
                    className="btn btn-secondary btn-icon"
                    aria-label="Anterior"
                    onClick={() => scrollRow(-1)}
                  >
                    <ChevronLeftIcon size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-icon"
                    aria-label="Siguiente"
                    onClick={() => scrollRow(1)}
                  >
                    <ChevronRightIcon size={16} />
                  </button>
                </div>
              </div>
            </div>

            {recLoading ? (
              <div className="empty">
                <p className="empty-sub">Cargando la cartelera…</p>
              </div>
            ) : items.length === 0 ? (
              <div className="empty">
                <p className="empty-title">Sin títulos por ahora</p>
                <p className="empty-sub">Intenta con otro ánimo.</p>
              </div>
            ) : (
              <div id="movie-row" className="movie-row no-scrollbar" ref={rowRef}>
                {items.map((m, i) => (
                  <div
                    className="movie-reveal"
                    style={{
                      '--reveal-delay': `calc(${i % 10} * var(--movie-stagger))`,
                    }}
                    key={m.id}
                  >
                    <MovieCard movie={m} onOpen={openMovie} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="empty">
            <p className="empty-title">Tu sala está en penumbra</p>
            <p className="empty-sub">
              Selecciona un mood arriba para revelar la selección de esta noche.
            </p>
          </div>
        )}
      </section>

      <section id="mi-biblioteca" className="container my-list">
        <div className="recs-head">
          <div>
            <span className="recs-step">Tu biblioteca</span>
            <h2 className="recs-title">
              Mi biblioteca
              {watchlist.length + watchedList.length > 0 ? (
                <span className="nav-count">
                  {watchlist.length + watchedList.length}
                </span>
              ) : null}
            </h2>
            <p className="recs-sub">
              {watchlist.length + watchedList.length > 0
                ? 'Tus películas guardadas, para ver ahora o después.'
                : 'Las películas que guardes o marques como vistas aparecerán aquí.'}
            </p>
          </div>
        </div>

        <div className="lib-tabs" role="tablist" aria-label="Secciones de biblioteca">
          <button
            type="button"
            role="tab"
            aria-selected={libTab === 'watchlist'}
            className={`lib-tab${libTab === 'watchlist' ? ' active' : ''}`}
            onClick={() => setLibTab('watchlist')}
          >
            Mi lista
            {watchlist.length > 0 ? <span className="nav-count">{watchlist.length}</span> : null}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={libTab === 'watched'}
            className={`lib-tab${libTab === 'watched' ? ' active' : ''}`}
            onClick={() => setLibTab('watched')}
          >
            Vistas
            {watchedList.length > 0 ? <span className="nav-count">{watchedList.length}</span> : null}
          </button>
        </div>

        {libTab === 'watchlist' && watchlist.length === 0 ? (
          <div className="empty">
            <p className="empty-title">Tu lista está vacía</p>
            <p className="empty-sub">
              Abre una película y toca "Mi lista" para guardarla y encontrarla aquí.
            </p>
          </div>
        ) : libTab === 'watched' && watchedList.length === 0 ? (
          <div className="empty">
            <p className="empty-title">Aún no marcas vistas</p>
            <p className="empty-sub">
              Cuando termines una película, toca "Marcar vista" para llevar tu registro.
            </p>
          </div>
        ) : (
          <div className="movie-row no-scrollbar lib-row">
            {(libTab === 'watchlist' ? watchlist : watchedList).map((item) => {
              const local = movies.find((m) => m.id === item.movieId)
              const movieObj = local
                ? { ...local, source: 'catalog' }
                : {
                    id: item.movieId,
                    imdbId: String(item.movieId).replace('omdb-', '') || null,
                    source: item.source || 'omdb',
                    title: item.title,
                    year: item.year,
                    duration: '',
                    rating: '',
                    match: 0,
                    genres: [],
                    mood: null,
                    tagline: '',
                    synopsis: 'Película guardada en tu biblioteca.',
                    poster: item.poster || '/poster-placeholder.svg',
                    trailerKey: item.trailerKey || null,
                    badge: '',
                  }
              return (
                <div className="movie-reveal" key={item.movieId}>
                  <MovieCard movie={movieObj} onOpen={openMovie} />
                </div>
              )
            })}
          </div>
        )}
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>Midnight Cinema &amp; Mood · Cine curado por emoción</p>
          <p>Del ánimo al play en tres clics.</p>
        </div>
      </footer>

      {movie ? (
        <MovieModal
          key={movie.id}
          movie={movie}
          open={true}
          onOpenChange={(open) => !open && setMovie(null)}
          inList={library.some((e) => e.movieId === movie.id && e.status === 'watchlist')}
          watched={library.some((e) => e.movieId === movie.id && e.status === 'watched')}
          onToggleList={handleToggleList}
          onToggleWatched={handleToggleWatched}
        />
      ) : null}

      {profileOpen ? (
        <ProfileModal open onClose={() => setProfileOpen(false)} />
      ) : null}
    </main>
  )
}