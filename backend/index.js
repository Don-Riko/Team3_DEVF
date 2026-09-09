// index.js
// Backend Express para Midnight Cinema & Mood.
// Conecta a una base de datos Supabase (Postgres) usando la connection string
// que expone el proyecto en Supabase (Settings > Database > Connection string).
//
// Requiere las siguientes variables de entorno (ver README):
//   PG_CONNECTION_STRING  -> connection string Postgres de Supabase
//   OMDB_API_KEY          -> API key de omdbapi.com (catálogo dinámico real)
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

// ---------- OMDB (catálogo dinámico enriquecido) ----------
const OMDB_KEY = process.env.OMDB_API_KEY
const OMDB_BASE = 'https://www.omdbapi.com'

// Cache en memoria por imdbID para no gastar la cuota diaria de OMDB.
const omdbCache = new Map()

// OMDB no permite filtrar por género en su búsqueda `s=` (solo busca en
// títulos), así que el catálogo dinámico arma un pool de películas con estas
// palabras clave genéricas y luego filtra por el género real del detalle
// (`i=ImdbID`). Deja de ser un catálogo hardcodeado: todo se consume de la API.
const SEED_QUERIES = [
  'love',
  'night',
  'day',
  'summer',
  'world',
  'man',
  'last',
  'lost',
  'dark',
  'house',
  'war',
  'fire',
  'run',
  'story',
  'sun',
  'sea',
]

// Géneros de OMDB que sintonizan con cada ánimo de Midnight.
const MOOD_GENRES = {
  melancolico: ['Drama', 'Romance', 'Music'],
  energico: ['Action', 'Thriller'],
  nostalgico: ['Comedy', 'Family', 'Drama'],
  suspenso: ['Thriller', 'Crime', 'Mystery', 'Horror'],
  feliz: ['Comedy', 'Family', 'Animation', 'Musical'],
  romantico: ['Romance', 'Comedy'],
  aventurero: ['Adventure', 'Western', 'Sci-Fi', 'Fantasy'],
  reflexivo: ['Sci-Fi', 'Drama', 'Fantasy'],
}

// Prioridad de géneros para asignar un mood a los resultados de búsqueda.
const MOOD_BY_GENRE = [
  ['Romance', 'romantico'],
  ['Comedy', 'feliz'],
  ['Musical', 'feliz'],
  ['Action', 'energico'],
  ['Thriller', 'suspenso'],
  ['Horror', 'suspenso'],
  ['Crime', 'suspenso'],
  ['Mystery', 'suspenso'],
  ['Adventure', 'aventurero'],
  ['Western', 'aventurero'],
  ['Animation', 'feliz'],
  ['Family', 'nostalgico'],
  ['Sci-Fi', 'reflexivo'],
  ['Fantasy', 'aventurero'],
  ['Drama', 'melancolico'],
  ['Music', 'melancolico'],
]

// Máximo de películas devueltas por mood y tamaño del pool de candidatos.
const CATALOG_TARGET = 12
const CATALOG_POOL_MAX = 24

// Cache en memoria del catálogo ya armado por mood para no repetir requests.
const catalogCache = new Map()

function moodForGenres(genres) {
  for (const [genre, moodId] of MOOD_BY_GENRE) {
    if (genres.includes(genre)) return moodId
  }
  return 'feliz'
}

function moodGenreTuned(movie, mood) {
  const genreList = MOOD_GENRES[mood] || []
  return (movie.genres || []).some((genre) => genreList.includes(genre))
}

// Arma una sola vez el pool de películas candidatas (búsquedas con cache).
let searchPoolPromise
function buildSearchPool(limit = CATALOG_POOL_MAX) {
  if (!searchPoolPromise) {
    searchPoolPromise = (async () => {
      const pool = new Map() // imdbID -> entry
      await Promise.all(
        SEED_QUERIES.map(async (query) => {
          try {
            const raw = await omdb({ s: query, type: 'movie' })
            for (const hit of raw.Search || []) {
              if (!pool.has(hit.imdbID)) {
                pool.set(hit.imdbID, { imdbId: hit.imdbID, title: hit.Title || query })
              }
            }
          } catch {
            // una búsqueda fallida no detiene al resto del pool
          }
        }),
      )
      return [...pool.values()].slice(0, limit)
    })().catch((error) => {
      searchPoolPromise = null
      throw error
    })
  }
  return searchPoolPromise
}

async function enrichMovies(entries) {
  return Promise.all(
    entries.map(async (entry) => {
      if (omdbCache.has(entry.imdbId)) return omdbCache.get(entry.imdbId)
      try {
        const raw = await omdb({ i: entry.imdbId, plot: 'short' })
        const movie = omdbToMovie(entry, raw)
        if (movie) omdbCache.set(entry.imdbId, movie)
        return movie
      } catch {
        return null
      }
    }),
  )
}

// Catálogo dinámico por mood, consumido integro de OMDB: arma un pool con
// las búsquedas por palabra clave, lo enriquece con el detalle real y filtra
// por el género que sintoniza con el ánimo. Primera vez se arma en vivo y
// queda cacheado para los siguientes clicks.
async function buildMoodCatalog(mood) {
  if (catalogCache.has(mood)) return catalogCache.get(mood)

  if (!MOOD_GENRES[mood]) {
    catalogCache.set(mood, [])
    return []
  }

  const pool = await buildSearchPool()
  const movies = (await enrichMovies(pool)).filter(Boolean)

  const tuned = movies.filter((movie) => moodGenreTuned(movie, mood))
  const rest = movies.filter((movie) => !moodGenreTuned(movie, mood))
  const results = [...tuned, ...rest]
    .slice(0, CATALOG_TARGET)
    .map((movie) => ({ ...movie, mood }))

  catalogCache.set(mood, results)
  return results
}

// Tráiler oficial de títulos conocidos por IMDb ID (video ID de YouTube).
// OMDB no provee tráileres, así que se resuelven aquí; cualquier título que no
// esté mapeado recibe DEFAULT_TRAILER_KEY (footage libre de derechos).
const MOVIE_TRAILERS = {
  tt0338013: '07-QBnEkgXU', // Eternal Sunshine of the Spotless Mind
  tt1798709: 'ne6p6MfLBxc', // Her
  tt4034228: 'gsVoD0pTge0', // Manchester by the Sea
  tt3896198: 'wUn05hdkhjM', // Guardians of the Galaxy Vol. 2
  tt1392190: 'hEJnMQG9ev8', // Mad Max: Fury Road
  tt2911666: '2AUmvWm5ZDQ', // John Wick
  tt0109830: 'XHhAG-YLdk8', // Forrest Gump
  tt0092005: '9UUcTNZKrks', // Stand by Me
  tt0088847: 'BSXBvor47Zs', // The Breakfast Club
  tt2267998: '2-_-1nJf8Vg', // Gone Girl
  tt0114369: 'KPOuJGkpblk', // Seven
  tt0102926: '6iB21hsprAQ', // The Silence of the Lambs
  tt1675434: 'dvdJ--DV0Uo', // The Intouchables
  tt0829482: '4eaZ_48ZYog', // Superbad
  tt1570728: '8iCwtxJejik', // Crazy, Stupid, Love.
  tt3783958: '0pdqf4P9MB8', // La La Land
  tt3104988: 'ZQ-YX-5bAs0', // Crazy Rich Asians
  tt0125439: '4RI0QvaGoiI', // Notting Hill
  tt0359950: 'QD6cy4PBQPI', // The Secret Life of Walter Mitty
  tt0758758: 'XZG1FzyB8DI', // Into the Wild
  tt0082971: '0xQSIdSRlAk', // Raiders of the Lost Ark
  tt0816692: 'zSWdZVtXT7E', // Interstellar
  tt2543164: 'tFMo3UJ4B4g', // Arrival
  tt1856101: 'gCcx85zbxz4', // Blade Runner 2049
}

// Tráiler por defecto (video libre de derechos) para garantizar que ninguna
// película de la app se quede sin tráiler. Es footage cinematográfico sin
// copyright (no es un tráiler oficial, pero reproduce algo siempre).
const DEFAULT_TRAILER_KEY = 'lOYaMF_8OmI'

async function omdb(params) {
  if (!OMDB_KEY) throw new Error('OMDB_API_KEY no configurada en el .env del backend')
  const url = new URL(OMDB_BASE)
  url.searchParams.set('apikey', OMDB_KEY)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  }
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`OMDB respondió ${response.status}`)
  }
  return response.json()
}

function runtimeLabel(minutes) {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

// Normaliza una película de OMDB a la forma que usa la app.
function omdbToMovie(entry, raw) {
  if (!raw || raw.Response !== 'True') return null
  const vote = Number(raw.imdbRating) || 0
  const minutesMatch = /(\d+)\s*min/.exec(raw.Runtime || '')
  const minutes = minutesMatch ? Number(minutesMatch[1]) : null
  const genres = String(raw.Genre || '')
    .split(',')
    .map((genre) => genre.trim())
    .filter(Boolean)
  return {
    id: `omdb-${raw.imdbID}`,
    source: 'omdb',
    title: raw.Title || entry.title,
    year: Number(raw.Year) || '',
    duration: runtimeLabel(minutes),
    rating: raw.Rated && raw.Rated !== 'N/A' ? raw.Rated : '',
    match: Math.min(98, Math.max(74, Math.round(44 + vote * 6))),
    vote,
    genres,
    mood: entry.mood,
    tagline: '',
    synopsis:
      raw.Plot && raw.Plot !== 'N/A'
        ? raw.Plot
        : 'Sinopsis no disponible para este título.',
    poster: raw.Poster && raw.Poster !== 'N/A' ? raw.Poster : '',
    badge: '',
    trailerKey: MOVIE_TRAILERS[raw.imdbID] || MOVIE_TRAILERS[entry.imdbId] || DEFAULT_TRAILER_KEY,
  }
}

// ---------- middlewares ----------
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

// GET /api/catalog?mood=X
// Cartelera OMDB dinámica por mood: arma un pool desde las búsquedas de OMDB,
// lo enriquece con el detalle real (póster, rating IMDb, duración, género,
// sinopsis) y filtra por el género que sintoniza con ese ánimo. La primera vez
// se arma en vivo y queda cacheada para los siguientes clicks.
server.get('/api/catalog', async (request, response) => {
  try {
    const { mood } = request.query

    if (!OMDB_KEY) {
      return response.status(503).json({
        ok: false,
        error: 'OMDB_API_KEY no configurada en el .env del backend.',
      })
    }

    const results = await buildMoodCatalog(mood)

    return response.json({ ok: true, mood, source: 'omdb', results })
  } catch (error) {
    console.error('SERVER ERROR [GET /api/catalog]:', error)
    return response.status(502).json({ ok: false, error: error.message })
  }
})

// GET /api/search?q=X
// Busca películas reales en OMDB por nombre. Cada resultado se enriquece con
// el detalle completo y un tráiler (mapa por IMDb ID o video por defecto).
server.get('/api/search', async (request, response) => {
  try {
    const { q } = request.query
    const query = q ? String(q).trim() : ''

    if (!query) {
      return response.status(400).json({ ok: false, error: 'El parámetro q es requerido.' })
    }

    if (!OMDB_KEY) {
      return response.status(503).json({
        ok: false,
        error: 'OMDB_API_KEY no configurada en el .env del backend.',
      })
    }

    const raw = await omdb({ s: query, type: 'movie' })
    if (raw.Response !== 'True' || !Array.isArray(raw.Search)) {
      return response.json({ ok: true, query, total: 0, results: [] })
    }

    const maxResults = Math.min(raw.Search.length, 10)
    const candidates = raw.Search.slice(0, maxResults).map((hit) => ({
      imdbId: hit.imdbID,
      title: hit.Title || query,
      mood: '',
    }))

    const results = (await enrichMovies(candidates))
      .filter(Boolean)
      .map((movie) => ({ ...movie, mood: moodForGenres(movie.genres) }))

    return response.json({
      ok: true,
      query,
      total: Number(raw.totalResults) || results.length,
      results,
    })
  } catch (error) {
    console.error('SERVER ERROR [GET /api/search]:', error)
    return response.status(502).json({ ok: false, error: error.message })
  }
})

// GET /api/omdb/:imdbId
// Detalle real de una película por su ID de IMDb (con cache).
server.get('/api/omdb/:imdbId', async (request, response) => {
  try {
    const { imdbId } = request.params

    if (omdbCache.has(imdbId)) {
      return response.json({ ok: true, movie: omdbCache.get(imdbId) })
    }

    const raw = await omdb({ i: imdbId, plot: 'short' })
    const movie = omdbToMovie({ imdbId, title: '' }, raw)
    if (!movie) {
      return response.status(404).json({ ok: false, error: 'Película no encontrada en OMDB.' })
    }
    omdbCache.set(imdbId, movie)

    return response.json({ ok: true, movie })
  } catch (error) {
    console.error('SERVER ERROR [GET /api/omdb/:imdbId]:', error)
    const noKey = !OMDB_KEY
    return response.status(noKey ? 503 : 502).json({
      ok: false,
      error: noKey
        ? 'OMDB_API_KEY no configurada en el .env del backend.'
        : error.message,
    })
  }
})

// GET /api/library?username=X
// Lista la biblioteca (watchlist + vistas) de un usuario.
server.get('/api/library', async (request, response) => {
  try {
    const { username } = request.query
    if (!username) {
      return response.status(400).json({ ok: false, error: 'username es requerido.' })
    }

    await ensureConnection()

    const userResult = await client.query(
      `SELECT id FROM ${DATABASE_SCHEMA}.users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
      [username],
    )
    if (userResult.rows.length === 0) {
      return response.json({ ok: true, items: [] })
    }

    const result = await client.query(
      `SELECT movie_id, source, title, poster, year, trailer_key, status, created_at
       FROM ${DATABASE_SCHEMA}.library_items
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userResult.rows[0].id],
    )

    return response.json({ ok: true, items: result.rows })
  } catch (error) {
    console.error('SERVER ERROR [GET /api/library]:', error)
    return response.status(500).json({ ok: false, error: 'Error en el servidor.' })
  }
})

// POST /api/library
// Agrega o actualiza un ítem de la biblioteca (upsert).
// Cuerpo: { username, movieId, source, title, poster, year, trailerKey, status }
server.post('/api/library', async (request, response) => {
  try {
    const { username, movieId, source, title, poster, year, trailerKey, status } =
      request.body ?? {}

    if (!username || !movieId) {
      return response.status(400).json({ ok: false, error: 'username y movieId son requeridos.' })
    }

    await ensureConnection()

    const userResult = await client.query(
      `SELECT id FROM ${DATABASE_SCHEMA}.users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
      [username],
    )
    if (userResult.rows.length === 0) {
      return response.status(404).json({ ok: false, error: 'Usuario no encontrado.' })
    }

    await client.query(
      `INSERT INTO ${DATABASE_SCHEMA}.library_items
         (user_id, movie_id, source, title, poster, year, trailer_key, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, movie_id) DO UPDATE SET
         source = EXCLUDED.source,
         title = EXCLUDED.title,
         poster = EXCLUDED.poster,
         year = EXCLUDED.year,
         trailer_key = EXCLUDED.trailer_key,
         status = EXCLUDED.status`,
      [
        userResult.rows[0].id,
        movieId,
        source || 'catalog',
        title || '',
        poster || '',
        year || '',
        trailerKey || '',
        status || 'watchlist',
      ],
    )

    return response.status(201).json({ ok: true })
  } catch (error) {
    console.error('SERVER ERROR [POST /api/library]:', error)
    return response.status(500).json({ ok: false, error: 'Error en el servidor.' })
  }
})

// DELETE /api/library?username=X&movieId=Y
// Quita un ítem de la biblioteca.
server.delete('/api/library', async (request, response) => {
  try {
    const { username, movieId } = request.query
    if (!username || !movieId) {
      return response.status(400).json({ ok: false, error: 'username y movieId son requeridos.' })
    }

    await ensureConnection()

    const userResult = await client.query(
      `SELECT id FROM ${DATABASE_SCHEMA}.users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
      [username],
    )
    if (userResult.rows.length === 0) {
      return response.json({ ok: true })
    }

    await client.query(
      `DELETE FROM ${DATABASE_SCHEMA}.library_items WHERE user_id = $1 AND movie_id = $2`,
      [userResult.rows[0].id, movieId],
    )

    return response.json({ ok: true })
  } catch (error) {
    console.error('SERVER ERROR [DELETE /api/library]:', error)
    return response.status(500).json({ ok: false, error: 'Error en el servidor.' })
  }
})

// GET /api/profile/:username
// Histórico emocional del usuario (agregado de moods + selecciones recientes).
server.get('/api/profile/:username', async (request, response) => {
  try {
    const { username } = request.params
    if (!username) {
      return response.status(400).json({ ok: false, error: 'username es requerido.' })
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

    const [histogramResult, recentResult, libraryResult] = await Promise.all([
      client.query(
        `SELECT mood, count(*)::int AS count
         FROM ${DATABASE_SCHEMA}.mood_selections
         WHERE user_id = $1
         GROUP BY mood
         ORDER BY count DESC`,
        [userId],
      ),
      client.query(
        `SELECT mood, created_at
         FROM ${DATABASE_SCHEMA}.mood_selections
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [userId],
      ),
      client.query(
        `SELECT status, count(*)::int AS count
         FROM ${DATABASE_SCHEMA}.library_items
         WHERE user_id = $1
         GROUP BY status`,
        [userId],
      ),
    ])

    const histogram = histogramResult.rows.map((row) => ({ mood: row.mood, count: row.count }))
    const total = histogram.reduce((acc, row) => acc + row.count, 0)

    const libraryCounts = { watchlist: 0, watched: 0 }
    for (const row of libraryResult.rows) libraryCounts[row.status] = row.count

    return response.json({
      ok: true,
      profile: {
        total,
        histogram,
        recent: recentResult.rows,
        library: libraryCounts,
      },
    })
  } catch (error) {
    console.error('SERVER ERROR [GET /api/profile]:', error)
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
  if (!OMDB_KEY) {
    console.warn('OMDB_API_KEY no configurada: la cartelera usará el catálogo local.')
  }
})

module.exports = server