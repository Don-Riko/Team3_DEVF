const omdbService = require('../services/omdbService')

async function getCatalog(req, res) {
  try {
    const { mood } = req.query
    if (!mood) {
      return res.status(400).json({ ok: false, error: 'Mood es requerido' })
    }

    const results = await omdbService.buildMoodCatalog(mood)
    
    if (!results || results.length === 0) {
      return res.json({ ok: true, mood, source: 'catalog', results: [] })
    }

    res.json({ ok: true, mood, source: 'omdb', results })
  } catch (err) {
    console.error('Error en catálogo:', err.message)
    res.json({ ok: true, mood: req.query.mood, source: 'catalog', results: [], error: err.message })
  }
}

async function searchMovies(req, res) {
  try {
    const { q } = req.query
    const page = Math.max(1, parseInt(req.query.page) || 1)
    
    if (!q || !q.trim()) {
      return res.status(400).json({ ok: false, error: 'Parámetro q requerido' })
    }

    const result = await omdbService.searchMoviesOMDB(q.trim(), page)
    
    if (!result.ok && result.rateLimit) {
      return res.json({ ok: true, query: q, total: 0, results: [], source: 'catalog', error: 'Rate limit OMDB' })
    }
    
    res.json({ ok: true, query: q, source: 'omdb', ...result })
  } catch (err) {
    console.error('Error en búsqueda:', err.message)
    res.json({ ok: true, query: req.query.q, total: 0, results: [], source: 'catalog', error: err.message })
  }
}

async function moodSearch(req, res) {
  try {
    const { q } = req.query
    if (!q || !q.trim()) {
      return res.status(400).json({ ok: false, error: 'Parámetro q requerido' })
    }

    const result = await omdbService.moodSearch(q.trim())
    res.json(result)
  } catch (err) {
    console.error('Error en mood-search:', err.message)
    res.json({ ok: true, query: req.query.q, results: [], source: 'catalog', error: err.message })
  }
}

async function getMovieDetail(req, res) {
  try {
    const { imdbId } = req.params
    const movie = await omdbService.getMovieDetail(imdbId)
    
    if (!movie) {
      return res.status(404).json({ ok: false, error: 'Película no encontrada' })
    }
    
    res.json({ ok: true, movie })
  } catch (err) {
    console.error('Error en detalle OMDB:', err.message)
    const isRateLimit = err.response?.Error?.includes('limit') || err.response?.Error?.includes('limit reached')
    if (isRateLimit) {
      return res.status(429).json({ ok: false, error: 'Rate limit OMDB alcanzado' })
    }
    res.status(502).json({ ok: false, error: err.message })
  }
}

module.exports = { getCatalog, searchMovies, moodSearch, getMovieDetail }