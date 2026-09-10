const express = require('express')
const cors = require('cors')
const config = require('./config/env')
const { apiLimiter } = require('./middleware/rateLimit')
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler')

const authRoutes = require('./routes/authRoutes')
const catalogRoutes = require('./routes/catalogRoutes')
const libraryRoutes = require('./routes/libraryRoutes')
const moodRoutes = require('./routes/moodRoutes')

const app = express()

app.use(cors())
app.use(express.json())
app.use(apiLimiter)

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the Midnight backend!' })
})

app.use('/api', authRoutes)
app.use('/api', catalogRoutes)
app.use('/api', libraryRoutes)
app.use('/api', moodRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app