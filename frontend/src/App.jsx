import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HERO_IMAGE, getMood, recommendationsFor } from './data'
import { SearchIcon, SparklesIcon, ChevronLeftIcon, ChevronRightIcon } from './icons'
import { useAuth } from './AuthContext'
import { recordMoodSelection } from './auth'
import MoodPicker from './MoodPicker'
import MovieCard from './MovieCard'
import MovieModal from './MovieModal'
import { TypingAnimation } from './components/TypingAnimation'

// Botón de perfil con las iniciales del usuario y un dropdown para cerrar sesión.
function ProfileMenu() {
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

  const recommendations = useMemo(() => recommendationsFor(mood), [mood])
  const moodMeta = mood ? getMood(mood) : null

  function handleMoodChange(nextMood) {
    setMood(nextMood)
    if (nextMood && user?.username) {
      // Registra la selección en Supabase vía el backend Express.
      recordMoodSelection(user.username, nextMood)
    }
  }

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
            <span className="nav-static">Mi lista</span>
          </nav>

          <div className="header-actions">
            <button type="button" className="icon-btn" aria-label="Buscar">
              <SearchIcon size={16} />
            </button>
            <ProfileMenu />
          </div>
        </div>
      </header>

      <section id="moods" className="hero grain">
        <img src={HERO_IMAGE} alt="" width={1920} height={1080} className="hero-bg" aria-hidden="true" />
        <div aria-hidden="true" className="hero-bg--fade" />
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="step-badge">Paso 1 de 3 · Descubrimiento por ánimo</span>
            <h1 className="hero-title">¿Cómo te sientes hoy?</h1>
            <p className="hero-desc">
              Elige un estado de ánimo y armamos la sala: recomendaciones curadas para esa emoción
              exacta, listas para reproducir en tres clics.
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
                  Para cuando te sientes{'  '}
                  <TypingAnimation
                    className="recs-title-typed"
                    style={{ color: moodMeta.accent }}
                    startOnView={true}
                    typeSpeed={70}
                    showCursor={false}
                  >
                    {moodMeta.label.toLowerCase()}
                  </TypingAnimation>
                </h2>
                <p className="recs-sub">
                  {recommendations.length} títulos ordenados por afinidad con tu ánimo.
                </p>
              </div>
              <div className="recs-arrows">
                <button type="button" className="btn btn-secondary btn-icon" aria-label="Anterior">
                  <ChevronLeftIcon size={16} />
                </button>
                <button type="button" className="btn btn-secondary btn-icon" aria-label="Siguiente">
                  <ChevronRightIcon size={16} />
                </button>
              </div>
            </div>

            <div id="movie-row" className="movie-row no-scrollbar">
              {recommendations.map((m, i) => (
                <div
                  className="movie-reveal"
                  style={{ '--reveal-delay': `calc(${i} * var(--movie-stagger))` }}
                  key={m.id}
                >
                  <MovieCard movie={m} onOpen={setMovie} />
                </div>
              ))}
            </div>
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

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>Midnight Cinema &amp; Mood · Cine curado por emoción</p>
          <p>Del ánimo al play en tres clics.</p>
        </div>
      </footer>

      <MovieModal movie={movie} open={!!movie} onOpenChange={(open) => !open && setMovie(null)} />
    </main>
  )
}