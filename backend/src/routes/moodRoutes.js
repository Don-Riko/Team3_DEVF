const express = require('express')
const { recordMoodSelection } = require('../controllers/moodController')

const router = express.Router()

router.post('/mood-selection', recordMoodSelection)

module.exports = router