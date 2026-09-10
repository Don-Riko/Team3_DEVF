function errorHandler(err, req, res, next) {
  console.error('ERROR:', err.message, err.stack)
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ ok: false, error: err.message })
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ ok: false, error: 'No autorizado' })
  }
  
  const status = err.status || 500
  const message = err.message || 'Error interno del servidor'
  
  res.status(status).json({ ok: false, error: message })
}

function notFoundHandler(req, res) {
  res.status(404).json({ ok: false, error: 'Endpoint no encontrado' })
}

module.exports = { errorHandler, notFoundHandler }