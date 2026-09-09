const libraryService = require('../services/libraryService')

async function getLibrary(req, res) {
  const { username } = req.query
  if (!username) {
    return res.status(400).json({ ok: false, error: 'username requerido' })
  }
  const result = await libraryService.getLibrary(username)
  res.json(result)
}

async function saveLibraryItem(req, res) {
  const { username, movieId, source, title, poster, year, trailerKey, status } = req.body ?? {}
  if (!username || !movieId) {
    return res.status(400).json({ ok: false, error: 'username y movieId requeridos' })
  }
  const result = await libraryService.saveLibraryItem(username, {
    movieId,
    source,
    title,
    poster,
    year,
    trailerKey,
    status,
  })
  if (!result.ok) return res.status(404).json(result)
  res.status(201).json(result)
}

async function removeLibraryItem(req, res) {
  const { username, movieId } = req.query
  if (!username || !movieId) {
    return res.status(400).json({ ok: false, error: 'username y movieId requeridos' })
  }
  const result = await libraryService.removeLibraryItem(username, movieId)
  res.json(result)
}

async function getProfile(req, res) {
  const { username } = req.params
  if (!username) {
    return res.status(400).json({ ok: false, error: 'username requerido' })
  }
  const result = await libraryService.getProfile(username)
  if (!result.ok) return res.status(404).json(result)
  res.json(result)
}

module.exports = { getLibrary, saveLibraryItem, removeLibraryItem, getProfile }