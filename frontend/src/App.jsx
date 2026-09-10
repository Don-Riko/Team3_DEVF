import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { HERO_IMAGE, movies, getMood, moods } from './data'
import {
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  PlayIcon,
} from './icons'
import { useAuth } from './AuthContext'
import { recordMoodSelection } from './auth'
import {
  fetchLibrary,
  fetchOmdbCatalog,
  searchMovies,
  searchMood,
  removeLibraryItem,
  saveLibraryItem,
  fetchProfile,
} from './api'
import MoodPicker from './MoodPicker'
import MoodTextField from './MoodTextField'
import MovieCard from './MovieCard'
import MovieModal from './MovieModal'
import ProfileModal from './ProfileModal'
import { TypingAnimation } from './components/TypingAnimation'

// Fallback: películas del catálogo local para el mood seleccionado.
function moviesForMood(moodId) {
  return movies.filter((m) => m.mood === moodId)
}

// Mapeo de palabras clave a moods para entrada conversacional
const MOOD_KEYWORDS = {
  melancolico: [
    'melancolico',
    'triste',
    'llorar',
    'lluvia',
    'silencio',
    'solitario',
    'nostalgia',
    'deprimido',
    'bajon',
    'down',
    'sad',
  ],
  energico: [
    'energico',
    'accion',
    'adrenalina',
    'intenso',
    'rapido',
    'explosiones',
    'peleas',
    'lucha',
    'correr',
    'action',
    'energy',
  ],
  nostalgico: [
    'nostalgico',
    'infancia',
    'pasado',
    'verano',
    'recuerdos',
    'niñez',
    'antiguo',
    'clasico',
    'retro',
    'vintage',
    'nostalgic',
  ],
  suspenso: [
    'suspenso',
    'tension',
    'misterio',
    'intriga',
    'thriller',
    'sospecha',
    'enigma',
    'oscuro',
    'suspense',
    'mystery',
  ],
  feliz: [
    'feliz',
    'alegre',
    'risas',
    'comedia',
    'divertido',
    'buen rollo',
    'positivo',
    'animado',
    'gracioso',
    'happy',
    'comedy',
    'funny',
  ],
  romantico: [
    'romantico',
    'amor',
    'pareja',
    'enamorado',
    'cita',
    'boda',
    'besos',
    'corazon',
    'romance',
    'love',
    'romantic',
  ],
  aventurero: [
    'aventurero',
    'aventura',
    'viaje',
    'explorar',
    'descubrir',
    'mapa',
    'expedicion',
    'selva',
    'montaña',
    'adventure',
    'journey',
  ],
  reflexivo: [
    'reflexivo',
    'pensar',
    'profundo',
    'filosofico',
    'existencia',
    'sentido',
    'vida',
    'mente',
    'cerebro',
    'intelectual',
    'thoughtful',
    'deep',
  ],
}

function parseMoodFromText(text) {
  const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const [moodId, keywords] of Object.entries(MOOD_KEYWORDS)) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      return moodId
    }
  }
  return null
}

// Personalidad de animación del glow de fondo según el ánimo elegido: cada
// mood "respira" distinto (energico es rápido y marcado, reflexivo es lento
// y sutil), para que la transición se sienta ligada a la emoción, no solo al
// color.
const MOOD_MOTION = {
  melancolico: { scale: [1, 1.06, 1], opacity: [0.28, 0.5, 0.28], duration: 6 },
  energico: { scale: [1, 1.22, 1], opacity: [0.45, 0.85, 0.45], duration: 1.3 },
  nostalgico: { scale: [1, 1.05, 1], opacity: [0.25, 0.45, 0.25], duration: 5 },
  suspenso: { scale: [1, 1.12, 0.97, 1], opacity: [0.25, 0.6, 0.3, 0.25], duration: 3.2 },
  feliz: { scale: [1, 1.16, 1], opacity: [0.4, 0.75, 0.4], duration: 1.8 },
  romantico: { scale: [1, 1.08, 1], opacity: [0.3, 0.58, 0.3], duration: 4.2 },
  aventurero: { scale: [1, 1.2, 1], opacity: [0.35, 0.68, 0.35], duration: 2.4 },
  reflexivo: { scale: [1, 1.04, 1], opacity: [0.25, 0.42, 0.25], duration: 7 },
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
            onClick={() => alert('Configuración')}
          >
            Configuración
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

  // ---- Mood text input (Describe cómo te sientes) ----
  const [moodText, setMoodText] = useState('')
  const [moodTextLoading, setMoodTextLoading] = useState(false)
  // Estado del "logger mágico": 'idle' | 'loading' | 'success' | 'error' | 'empty'.
  const [moodTextStatus, setMoodTextStatus] = useState('idle')
  const moodTextDebounceRef = useRef(null)

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (moodTextDebounceRef.current) clearTimeout(moodTextDebounceRef.current)
    }
  }, [])

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
  const [moodHistory, setMoodHistory] = useState({})

  // ---- Buscador OMDB ----
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null) // null = sin búsqueda aún
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchPage, setSearchPage] = useState(1)
  const [searchTotal, setSearchTotal] = useState(0)
  const [searchHasMore, setSearchHasMore] = useState(false)
  const [searchSource, setSearchSource] = useState('omdb')
  const searchInputRef = useRef(null)

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

  // Historial de moods para personalizar orden del carrusel
  useEffect(() => {
    if (!user?.username) return
    let cancelled = false
    fetchProfile(user.username).then((result) => {
      if (cancelled || !result?.ok) return
      const histogram = result.profile?.histogram || []
      const history = Object.fromEntries(histogram.map((h) => [h.mood, h.count]))
      setMoodHistory(history)
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

  // Debounced conversational mood search
  const handleMoodTextSearch = useCallback(async (text) => {
    const trimmed = text.trim()
    if (!trimmed) return

    setMoodTextLoading(true)
    setMoodTextStatus('loading')
    try {
      const result = await searchMood(trimmed)
      if (result.ok && result.llm?.mood) {
        setMoodTextStatus('success')
        handleMoodChange(result.llm.mood)
        // Deja ver el mensaje de éxito antes de limpiar el input.
        setTimeout(() => {
          setMoodText('')
          setMoodTextStatus('idle')
        }, 1200)
        return
      }
    } catch (error) {
      console.warn('LLM mood search failed:', error)
      // Antes de rendirse, intenta el parser local (abajo). Solo marcamos error
      // si tampoco ese detecta algo.
    } finally {
      setMoodTextLoading(false)
    }

    // Fallback: parser local de keywords
    const detected = parseMoodFromText(trimmed)
    if (detected) {
      setMoodTextStatus('success')
      handleMoodChange(detected)
      setTimeout(() => {
        setMoodText('')
        setMoodTextStatus('idle')
      }, 1200)
    } else {
      // No se entendió la intención del usuario.
      setMoodTextLoading(false)
      setMoodTextStatus('empty')
    }
  }, [handleMoodChange])

  function handlePlayNow() {
    if (!mood || items.length === 0) return
    const topMatch = items.reduce((best, current) =>
      (current.match || 0) > (best.match || 0) ? current : best
    )
    setMovie(topMatch)
  }

  function openMovie(target) {
    setMovie(target)
  }

  // ---- Buscador handlers ----
  function openSearch() {
    setSearchOpen(true)
    requestAnimationFrame(() => searchInputRef.current?.focus())
  }

  function closeSearch() {
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults(null)
    setSearchPage(1)
    setSearchTotal(0)
    setSearchHasMore(false)
  }

  async function handleSearchSubmit(event) {
    event?.preventDefault()
    const query = searchQuery.trim()
    if (!query) return
    setSearchLoading(true)
    const result = await searchMovies(query, 1)
    setSearchLoading(false)
    if (result.ok) {
      setSearchResults(result.results)
      setSearchPage(result.page)
      setSearchTotal(result.total)
      setSearchHasMore(result.hasMore)
      setSearchSource(result.source || 'omdb')
    } else {
      setSearchResults([])
      setSearchHasMore(false)
      setSearchSource('omdb')
    }
  }

  async function handleLoadMoreSearch() {
    const query = searchQuery.trim()
    if (!query || searchLoading || !searchHasMore) return
    setSearchLoading(true)
    const result = await searchMovies(query, searchPage + 1)
    setSearchLoading(false)
    if (!result.ok) return
    setSearchResults((current) => [...(current || []), ...result.results])
    setSearchPage(result.page)
    setSearchTotal(result.total)
    setSearchHasMore(result.hasMore)
    setSearchSource(result.source || 'omdb')
  }

  function handleSearchKeyDown(event) {
    if (event.key === 'Escape') closeSearch()
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

  const items = useMemo(() => {
    if (!recs.items.length) return recs.items
    // Ordenar por frecuencia del mood del usuario (moods más frecuentes primero)
    return [...recs.items].sort((a, b) => {
      const moodA = a.mood || mood
      const moodB = b.mood || mood
      const countA = moodHistory[moodA] || 0
      const countB = moodHistory[moodB] || 0
      if (countA !== countB) return countB - countA
      // Desempatar por match
      return (b.match || 0) - (a.match || 0)
    })
  }, [recs.items, mood, moodHistory])

  return (
    <main className="min-h-screen bg-background">
      <header className="site-header">
        <div className="container header-inner">
          
            
          

          <nav className="main-nav" aria-label="Navegación principal">
            <a href="#moods">Moods</a>
            <a href="#recomendaciones">Recomendaciones</a>
            <a href="#mi-biblioteca">Mi biblioteca</a>
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="icon-btn"
              aria-label="Buscar"
              aria-expanded={searchOpen}
              onClick={openSearch}
            >
              <SearchIcon size={16} />
            </button>
            <ProfileMenu onOpenProfile={() => setProfileOpen(true)} />
          </div>
        </div>
      </header>

      <section className="brand-banner" aria-label="Midnight Cinema & Mood">
        <div className="brand-banner-inner">
          <span className="brand-banner-popcorn">
            <img src="/imagenes/palomita.png" alt="Palomitas de cine" />
          </span>
          <h1>Midnight Cinema &amp; Mood</h1>
        </div>
      </section>

      {searchOpen ? (
        <div
          className="search-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Buscar películas por nombre"
          onClick={closeSearch}
          onKeyDown={handleSearchKeyDown}
        >
          <div className="search-panel" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              aria-label="Cerrar búsqueda"
              onClick={closeSearch}
            >
              <CloseIcon size={16} />
            </button>
            <span className="recs-step">Buscador de cartelera</span>
            <h2 className="search-title">Busca una película por nombre</h2>
            <p className="search-sub">
              Consulta del catálogo real de OMDB con la utilización de su API.
            </p>
            <form className="search-form" onSubmit={handleSearchSubmit}>
              <input
                ref={searchInputRef}
                className="search-input"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Ej. Inception, Interstellar, Amélie…"
                aria-label="Nombre de la película"
                autoComplete="off"
              />
              <button type="submit" className="btn btn-primary">
                Buscar
              </button>
            </form>
            {searchLoading ? (
              <div className="empty">
                <p className="empty-sub">Buscando en OMDB…</p>
              </div>
            ) : searchResults === null ? (
              <div className="empty">
                <p className="empty-sub">
                  Escribe un título y presiona Buscar para explorar la cartelera.
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="empty">
                <p className="empty-title">Sin resultados</p>
                <p className="empty-sub">Prueba con otro título.</p>
              </div>
            ) : (
              <>
                {searchSource === 'catalog' && (
                  <div className="search-fallback-notice">
                    <span className="fallback-icon">⚡</span>
                    <span>Mostrando catálogo local (OMDB no disponible)</span>
                  </div>
                )}
                <p className="recs-sub">
                  {searchResults.length} de {searchTotal || searchResults.length} resultado{searchTotal === 1 ? '' : 's'} de
                  {searchSource === 'catalog' ? 'catálogo local' : 'OMDB'} para "{searchQuery.trim()}".
                </p>
                <div className="movie-row no-scrollbar search-results">
                  {searchResults.map((m) => (
                    <div className="movie-reveal" key={m.id}>
                      <MovieCard
                        movie={m}
                        onOpen={(target) => {
                          closeSearch()
                          openMovie(target)
                        }}
                      />
                    </div>
                  ))}
                </div>
                {searchHasMore ? (
                  <button
                    type="button"
                    className="btn btn-secondary search-more"
                    onClick={handleLoadMoreSearch}
                    disabled={searchLoading}
                  >
                    {searchLoading ? 'Cargando...' : 'Cargar más resultados'}
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}

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
        <AnimatePresence mode="wait">
          {mood ? (
            <motion.div
              key={mood}
              aria-hidden="true"
              className={`hero-mood-scene hero-mood-scene--${mood}`}
              initial={{ opacity: 0, scale: 1.12 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.08 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          ) : null}
        </AnimatePresence>
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="step-badge">Paso 1 de 3 · Descubrimiento por estado de ánimo</span>
            <h1 className="hero-title">¿Cómo te sientes hoy?</h1>
            <p className="hero-desc">
              Elige tu estado de ánimo y descubre diferentes recomendaciones de peliculas listas para ver.
            </p>
          </div>
          <div className="mood-wrap">
            <MoodPicker value={mood} onChange={handleMoodChange} themed />
            <MoodTextField
              value={moodText}
              onChange={(value) => {
                setMoodText(value)
                if (moodTextDebounceRef.current) clearTimeout(moodTextDebounceRef.current)
                moodTextDebounceRef.current = setTimeout(() => {
                  handleMoodTextSearch(value)
                }, 500)
              }}
              onSubmit={(value) => {
                if (moodTextDebounceRef.current) clearTimeout(moodTextDebounceRef.current)
                handleMoodTextSearch(value)
              }}
              loading={moodTextLoading}
              status={moodTextStatus}
            />
            {mood && items.length > 0 && !recLoading && (
              <button
                type="button"
                className="btn btn-primary btn-lg play-now"
                onClick={handlePlayNow}
                aria-label="Reproducir la mejor coincidencia ahora"
              >
                <PlayIcon size={20} fill="currentColor" />
                Dale play ya
              </button>
            )}
          </div>
        </div>
      </section>

      <section id="recomendaciones" className="container recs">
        <AnimatePresence>
          {mood ? (
            <motion.div
              key={mood}
              aria-hidden="true"
              className="recs-mood-glow"
              style={{ '--mood': moodMeta?.accent }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{
                opacity: MOOD_MOTION[mood]?.opacity ?? [0.3, 0.55, 0.3],
                scale: MOOD_MOTION[mood]?.scale ?? [1, 1.08, 1],
              }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{
                duration: MOOD_MOTION[mood]?.duration ?? 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ) : null}
        </AnimatePresence>
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
                <p className="empty-sub">Intenta con otro estado de ánimo.</p>
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
                    trailerSearchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
                      `${item.title} ${item.year || ''} official trailer`.trim(),
                    )}`,
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
          <p>Midnight Cinema &amp; Mood · Cine exacto para todo tipo de emoción.</p>
          <p>Elige tu peli y dale play en tres clics.</p>
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