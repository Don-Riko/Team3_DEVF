// AuthContext.jsx
// Estado de sesión del usuario logueado, con persistencia en localStorage.
// La autenticación la realiza el backend Express contra Supabase.
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authenticate } from './auth'

const STORAGE_KEY = 'midnight.session'
const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  // Persistir cambios de sesión.
  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* almacenamiento no disponible: la sesión será solo en memoria */
    }
  }, [user])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      /**
       * Intenta iniciar sesión validando contra el backend (Supabase).
       * @returns {Promise<{ok: true} | {ok: false, error?: string}>}
       */
      async login(username, password) {
        const result = await authenticate(username, password)
        if (result.ok) {
          setUser(result.user)
          return { ok: true }
        }
        return { ok: false, error: result.error }
      },
      logout() {
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// El hook conviven con el provider en este archivo: patrón idiomático de
// React Context. El fast-refresh no aplica a este export utilitario.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}