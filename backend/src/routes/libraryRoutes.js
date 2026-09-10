const express = require('express')
const { getLibrary, saveLibraryItem, removeLibraryItem, getProfile } = require('../controllers/libraryController')

const router = express.Router()

router.get('/library', getLibrary)
router.post('/library', saveLibraryItem)
router.delete('/library', removeLibraryItem)
router.get('/profile/:username', getProfile)

module.exports = router