const rateLimit = require('express-rate-limit')
const config = require('../config/env')

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { ok: false, error: 'Demasiadas peticiones, intenta más tarde' },
  standardHeaders: true,
  legacyHeaders: false,
})

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { ok: false, error: 'Límite de búsquedas alcanzado, espera un minuto' },
  standardHeaders: true,
  legacyHeaders: false,
})

module.exports = { apiLimiter, searchLimiter }