// AuthContext.jsx
// Estado de sesión del usuario logueado, con persistencia en localStorage.
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
       * Intenta iniciar sesión validando contra mongo_usr.sql.
       * @returns {{ok: true} | {ok: false}}
       */
      login(username, password) {
        const result = authenticate(username, password)
        if (result.ok) {
          setUser(result.user)
          return { ok: true }
        }
        return { ok: false }
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
