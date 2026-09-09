// auth.js
// Autenticación real de Midnight Cinema & Mood contra el backend Express.
// El backend valida las credenciales contra la tabla `users` en Supabase.
//
// Endpoint configurable por entorno:
//   VITE_ENDPOINT -> URL base de la API (por defecto "/api", servida por
//                    el proxy de Vite hacia el backend Express).

const ENDPOINT = import.meta.env.VITE_ENDPOINT || '/api'

/**
 * Deriva las iniciales para el avatar a partir del nombre de usuario.
 * - "Sofia Marquez" -> "SM"
 * - "Admin"         -> "AD"
 * - "team3"         -> "TE"
 */
export function initialsFor(username) {
  if (!username) return '?'
  const parts = username.trim().split(/[\s._-]+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return username.trim().slice(0, 2).toUpperCase()
}

/**
 * Valida credenciales contra el backend (POST /api/login).
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ok: true, user: {id, username, initials}} | {ok: false, error?: string}>}
 */
export async function authenticate(username, password) {
  try {
    const response = await fetch(`${ENDPOINT}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.ok) {
      return { ok: false, error: data?.error || 'Usuario o contraseña incorrectos.' }
    }

    return {
      ok: true,
      user: {
        id: data.user.id,
        username: data.user.username,
        initials: data.user.initials || initialsFor(data.user.username),
      },
    }
  } catch (error) {
    console.error('Error al autenticar con el backend:', error)
    return { ok: false, error: 'No se pudo conectar con el servidor.' }
  }
}

/**
 * Registra en el backend la selección de un mood por parte del usuario.
 * @param {string} username
 * @param {string} mood
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function recordMoodSelection(username, mood) {
  try {
    const response = await fetch(`${ENDPOINT}/mood-selection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, mood }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.ok) {
      return { ok: false, error: data?.error || 'No se pudo registrar la selección.' }
    }
    return { ok: true }
  } catch (error) {
    console.error('Error al registrar el mood:', error)
    return { ok: false, error: 'No se pudo conectar con el servidor.' }
  }
}