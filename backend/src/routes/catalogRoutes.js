const express = require('express')
const { searchLimiter } = require('../middleware/rateLimit')
const { getCatalog, searchMovies, moodSearch, getMovieDetail } = require('../controllers/catalogController')

const router = express.Router()

router.get('/catalog', getCatalog)
router.get('/search', searchLimiter, searchMovies)
router.get('/mood-search', searchLimiter, moodSearch)
router.get('/omdb/:imdbId', getMovieDetail)

module.exports = router