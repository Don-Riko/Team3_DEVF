// ProfileModal.jsx
// Perfil de gusto emocional: histórico de moods, frecuencia y resumen de
// biblioteca. Los datos vienen del backend (tabla mood_selections).

import { useEffect, useState } from 'react'
import { moods } from './data'
import { CloseIcon, SparklesIcon } from './icons'
import { fetchProfile } from './api'
import { useAuth } from './AuthContext'

export default function ProfileModal({ open, onClose }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !user?.username) return
    let cancelled = false
    fetchProfile(user.username).then((result) => {
      if (cancelled) return
      if (result.ok) setProfile(result.profile)
      else setError(result.error)
    })
    return () => {
      cancelled = true
    }
  }, [open, user])

  if (!open) return null

  const histogram = profile?.histogram ?? []
  const max = Math.max(1, ...histogram.map((h) => h.count))
  const dominant =
    profile?.histogram?.[0] && moods.find((m) => m.id === profile.histogram[0].mood)
  const library = profile?.library ?? { watchlist: 0, watched: 0 }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Perfil de gusto emocional"
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <CloseIcon size={16} />
        </button>

        <div className="modal-body profile-body">
          <span className="recs-step">Tu perfil · {user?.username}</span>
          <h3 className="modal-title profile-title">
            <SparklesIcon size={22} />
            Perfil de gusto emocional
          </h3>

          {error ? (
            <div className="empty">
              <p className="empty-title">No pudimos cargar tu perfil</p>
              <p className="empty-sub">{error}</p>
            </div>
          ) : !profile ? (
            <div className="empty">
              <p className="empty-sub">Cargando tu historial…</p>
            </div>
          ) : (
            <>
              {dominant && profile.total > 0 ? (
                <p className="recs-sub profile-dominant">
                  Tu ánimo dominante es{' '}
                  <strong style={{ color: dominant.accent }}>
                    {dominant.glyph} {dominant.label.toLowerCase()}
                  </strong>{' '}
                  · {profile.total} selecciones registradas.
                </p>
              ) : (
                <p className="recs-sub">
                  Aún no registras selecciones. Elige un mood en la pantalla principal y tu
                  historial crecerá aquí.
                </p>
              )}

              <div className="profile-histogram">
                {histogram.length === 0 ? (
                  <p className="recs-sub">Sin datos todavía.</p>
                ) : (
                  histogram.map(({ mood: moodId, count }) => {
                    const mood = moods.find((m) => m.id === moodId)
                    if (!mood) return null
                    return (
                      <div className="profile-bar" key={moodId}>
                        <span className="profile-bar-label">
                          {mood.glyph} {mood.label}
                        </span>
                        <div className="profile-bar-track">
                          <div
                            className="profile-bar-fill"
                            style={{
                              '--bar-color': mood.accent,
                              width: `${(count / max) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="profile-bar-count">{count}</span>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="profile-stats">
                <div className="profile-stat">
                  <span className="profile-stat-value">{profile.total || 0}</span>
                  <span className="profile-stat-label">Ánimos elegidos</span>
                </div>
                <div className="profile-stat">
                  <span className="profile-stat-value">{library.watchlist || 0}</span>
                  <span className="profile-stat-label">En Mi lista</span>
                </div>
                <div className="profile-stat">
                  <span className="profile-stat-value">{library.watched || 0}</span>
                  <span className="profile-stat-label">Vistas</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}