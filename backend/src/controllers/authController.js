const authService = require('../services/authService')

async function register(req, res) {
  const { username, password } = req.body ?? {}
  const result = await authService.register({ username, password })
  if (!result.ok) {
    return res.status(400).json(result)
  }
  res.status(201).json(result)
}

async function login(req, res) {
  const { username, password } = req.body ?? {}
  const result = await authService.login({ username, password })
  if (!result.ok) {
    return res.status(401).json(result)
  }
  res.json(result)
}

module.exports = { register, login }