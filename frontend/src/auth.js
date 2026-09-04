// auth.js
// Mecanismo TEMPORAL y PRIMITIVO de autenticación.
// Lee las credenciales desde el archivo mongo_usr.sql (raíz del repo,
// importado como texto crudo vía Vite ?raw) y las valida contra el
// formulario de login.
//
// ADVERTENCIA: comparar contraseñas en texto plano en el cliente es
// SOLO para demo/desarrollo. Sustituir por un backend con hashing
// cuando exista.

// El alias @db apunta a ../db (ver vite.config.js).
import rawSql from '@db/mongo_usr.sql?raw'

// El archivo usa un formato simple clave = valor, por ejemplo:
//   user = Admin
//   password = Admin123
// Parseamos esos pares y los agrupamos en registros de usuario.
//
// Este parser también tolera múltiples bloques de user/password
// (por si en el futuro se agregan más usuarios), agrupando cada vez
// que aparece una nueva clave `user`.
function parseCredentials(sql) {
  const lines = sql.split(/\r?\n/)
  const users = []
  let current = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('#')) continue

    const match = trimmed.match(/^(\w+)\s*=\s*(.+?)\s*;?$/)
    if (!match) continue

    const key = match[1].toLowerCase()
    const value = match[2].trim()

    if (key === 'user' || key === 'username') {
      // Nueva entrada de usuario.
      current = { username: value, password: '' }
      users.push(current)
    } else if (key === 'password' || key === 'pass') {
      if (!current) {
        current = { username: '', password: '' }
        users.push(current)
      }
      current.password = value
    }
  }

  return users.filter((u) => u.username && u.password)
}

const USERS = parseCredentials(rawSql)

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
 * Valida credenciales contra el archivo mongo_usr.sql.
 * Comparación sensible a mayúsculas en la contraseña; el usuario
 * se compara sin distinguir mayúsculas para mayor tolerancia.
 * @returns {{ok: true, user: {username: string, initials: string}} | {ok: false}}
 */
export function authenticate(username, password) {
  const found = USERS.find(
    (u) => u.username.toLowerCase() === String(username).toLowerCase(),
  )
  if (!found || found.password !== password) {
    return { ok: false }
  }
  return {
    ok: true,
    user: {
      username: found.username,
      initials: initialsFor(found.username),
    },
  }
}

// Exponer la lista (solo usernames) puede ser útil para debug/demo.
export const availableUsernames = USERS.map((u) => u.username)
