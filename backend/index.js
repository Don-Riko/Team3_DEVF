// index.js
// Backend Express para Midnight Cinema & Mood.
// Conecta a una base de datos Supabase (Postgres) usando la connection string
// que expone el proyecto en Supabase (Settings > Database > Connection string).
//
// Requiere las siguientes variables de entorno (ver .env.example):
//   PG_CONNECTION_STRING  -> connection string Postgres de Supabase
//   PORT                  -> puerto (por defecto 3000)

const express = require('express')
const cors = require('cors')
const pg = require('pg')
const dotenv = require('dotenv')
dotenv.config()

const PORT = process.env.PORT || 3000
const server = express()

// Cliente compartido de Postgres (Supabase). La conexión es lazy:
// se abre en el primer request para no fallar al arrancar sin red/credenciales.
const client = new pg.Client({
  connectionString: process.env.PG_CONNECTION_STRING,
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: false
  }
})
let clientConnectionPromise

const DATABASE_SCHEMA = process.env.SUPABASE_SCHEMA || 'public'

// middlewares
server.use(cors())
server.use(express.json())

// Abre la conexión a Supabase una sola vez y la reutiliza.
async function ensureConnection() {
  if (!clientConnectionPromise) {
    clientConnectionPromise = client.connect().catch((error) => {
      clientConnectionPromise = null
      throw error
    })
  }
  await clientConnectionPromise
}

server.get('/api/hello', (request, response) => {
  response.json({ message: 'Hello from the Midnight backend!' })
})

// POST /api/login
// Valida las credenciales contra la tabla `users` de Supabase.
// Cuerpo esperado: { username, password }
server.post('/api/login', async (request, response) => {
  try {
    const { username, password } = request.body ?? {}

    if (!username || !password) {
      return response.status(400).json({ ok: false, error: 'Usuario y contraseña son requeridos.' })
    }

    await ensureConnection()

    const result = await client.query(
      `SELECT id, username, initials FROM ${DATABASE_SCHEMA}.users
       WHERE LOWER(username) = LOWER($1) AND password = $2
       LIMIT 1`,
      [username, password],
    )

    if (result.rows.length === 0) {
      return response.status(401).json({ ok: false, error: 'Usuario o contraseña incorrectos.' })
    }

    const user = result.rows[0]
    return response.json({ ok: true, user })
  } catch (error) {
    console.error('SERVER ERROR [POST /api/login]:', error)
    return response.status(500).json({ ok: false, error: 'Error en el servidor.' })
  }
})

// POST /api/mood-selection
// Registra el estado de ánimo seleccionado por un usuario de Midnight.
// Cuerpo esperado: { username, mood }
server.post('/api/mood-selection', async (request, response) => {
  try {
    const { username, mood } = request.body ?? {}

    if (!username || !mood) {
      return response.status(400).json({ ok: false, error: 'username y mood son requeridos.' })
    }

    await ensureConnection()

    const userResult = await client.query(
      `SELECT id FROM ${DATABASE_SCHEMA}.users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
      [username],
    )
    if (userResult.rows.length === 0) {
      return response.status(404).json({ ok: false, error: 'Usuario no encontrado.' })
    }

    const userId = userResult.rows[0].id
    const insertResult = await client.query(
      `INSERT INTO ${DATABASE_SCHEMA}.mood_selections (user_id, mood) VALUES ($1, $2) RETURNING id, user_id, mood, created_at`,
      [userId, mood],
    )

    return response.status(201).json({ ok: true, selection: insertResult.rows[0] })
  } catch (error) {
    console.error('SERVER ERROR [POST /api/mood-selection]:', error)
    return response.status(500).json({ ok: false, error: 'Error en el servidor.' })
  }
})

server.listen(PORT, async () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`)
  try {
    await ensureConnection()
    console.log('Conectado a la base de datos (Supabase)')
  } catch (error) {
    console.warn('No se pudo conectar a Supabase:', error.message)
    console.warn('Verifica PG_CONNECTION_STRING en el archivo .env')
  }
})

module.exports = server