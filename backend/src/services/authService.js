const crypto = require('crypto')
const userRepo = require('../repositories/userRepository')

function generateInitials(username) {
  return username
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

async function register({ username, password }) {
  if (!username || !password) {
    return { ok: false, error: 'Usuario y contraseña son requeridos' }
  }
  if (username.length < 3) {
    return { ok: false, error: 'El usuario debe tener al menos 3 caracteres' }
  }
  if (password.length < 6) {
    return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres' }
  }

  const existing = await userRepo.findUserByUsername(username)
  if (existing) {
    return { ok: false, error: 'El usuario ya existe' }
  }

  const initials = generateInitials(username)
  const user = await userRepo.createUser({ username, password, initials })
  return { ok: true, user }
}

async function login({ username, password }) {
  if (!username || !password) {
    return { ok: false, error: 'Usuario y contraseña son requeridos' }
  }

  const user = await userRepo.findUserByUsername(username)
  if (!user || user.password !== password) {
    return { ok: false, error: 'Usuario o contraseña incorrectos' }
  }

  return { ok: true, user: { id: user.id, username: user.username, initials: user.initials } }
}

module.exports = { register, login }