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
const crypto = require('crypto')
const dotenv = require('dotenv')
dotenv.config()

const PORT = process.env.PORT || 3000
const server = express()

// Cliente compartido de Postgres (Supabase). La conexión es lazy:
// se abre en el primer request para no fallar al arrancar sin red/credenciales.
// Se usa un Pool (no un Client único): en entornos serverless (Vercel) cada
// invocacion puede reutilizar o abrir conexiones cortas sin quedar atada a un
// unico socket, evitando errores de "connection terminated". pool.query() toma
// y libera una conexion del pool automaticamente.
const pool = new pg.Pool({
  connectionString: process.env.PG_CONNECTION_STRING,
  connectionTimeoutMillis: 10000,
  max: Number(process.env.PG_POOL_MAX) || 5,
  idleTimeoutMillis: 30000,
  ssl: {
    rejectUnauthorized: false
  }
})
let clientConnectionPromise

const DATABASE_SCHEMA = process.env.SUPABASE_SCHEMA || 'public'

// ---------- OMDB (catálogo dinámico enriquecido) ----------
const OMDB_KEY = process.env.OMDB_API_KEY
const OMDB_BASE = 'https://www.omdbapi.com'
const TMDB_KEY = process.env.TMDB_API_KEY
const TMDB_BASE = 'https://api.themoviedb.org/3'

// ---------- OpenRouter (LLM para búsqueda conversacional) ----------
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

// Catálogo de respaldo local (cuando OMDB falla o llega a rate limit)
const FALLBACK_MOVIES = [
  {
    id: 'fallback-lluvia-tardia',
    imdbId: 'tt-local-1',
    source: 'catalog',
    title: 'Lluvia Tardía',
    year: 2023,
    duration: '1h 54m',
    rating: '16+',
    match: 97,
    vote: 8.2,
    imdbVotes: '1,234',
    metascore: 78,
    ratings: [{ source: 'Internet Movie Database', value: '8.2/10' }],
    genres: ['Drama', 'Neo-noir'],
    mood: 'melancolico',
    tagline: 'Nadie vuelve a casa igual.',
    synopsis: 'Una traductora nocturna recorre una ciudad que no deja de llover, reconstruyendo la última conversación con su hermano a partir de cintas que él nunca quiso que escuchara.',
    poster: '/poster-1-Za7ksjur.jpg',
    badge: 'Exclusiva Midnight',
    director: ['Director Local'],
    writer: ['Escritor Local'],
    actors: ['Actor 1', 'Actor 2'],
    awards: '',
    language: ['Español'],
    country: ['México'],
    boxOffice: '',
    production: '',
    website: '',
    type: 'movie',
    dvd: '',
    trailerKey: 'lOYaMF_8OmI',
    trailerSearchUrl: 'https://www.youtube.com/results?search_query=Lluvia+Tard%C3%ADa+2023+official+trailer',
  },
  {
    id: 'fallback-sin-frenos',
    imdbId: 'tt-local-2',
    source: 'catalog',
    title: 'Sin Frenos',
    year: 2025,
    duration: '2h 06m',
    rating: '18+',
    match: 94,
    vote: 7.8,
    imdbVotes: '2,567',
    metascore: 72,
    ratings: [{ source: 'Internet Movie Database', value: '7.8/10' }],
    genres: ['Acción', 'Thriller'],
    mood: 'energico',
    tagline: 'Acelera o desaparece.',
    synopsis: 'Una mensajera de contrabando digital tiene noventa minutos para cruzar la ciudad entera antes de que el túnel se cierre y su nombre deje de existir.',
    poster: '/poster-2-DSuB6aWQ.jpg',
    badge: 'Estreno',
    director: ['Director Local'],
    writer: ['Escritor Local'],
    actors: ['Actor 1', 'Actor 2'],
    awards: '',
    language: ['Español'],
    country: ['México'],
    boxOffice: '',
    production: '',
    website: '',
    type: 'movie',
    dvd: '',
    trailerKey: 'DBHofAezYaU',
    trailerSearchUrl: 'https://www.youtube.com/results?search_query=Sin+Frenos+2025+official+trailer',
  },
  {
    id: 'fallback-verano-77',
    imdbId: 'tt-local-3',
    source: 'catalog',
    title: 'Verano del 77',
    year: 2021,
    duration: '1h 41m',
    rating: '13+',
    match: 92,
    vote: 7.5,
    imdbVotes: '3,421',
    metascore: 68,
    ratings: [{ source: 'Internet Movie Database', value: '7.5/10' }],
    genres: ['Coming of age', 'Road movie'],
    mood: 'nostalgico',
    tagline: 'El último viaje antes de crecer.',
    synopsis: 'Tres amigos roban el auto del padre de uno para llegar al mar antes del amanecer. Lo que encuentran en el camino los separa para siempre.',
    poster: '/poster-3-CER_oLq2.jpg',
    badge: '',
    director: ['Director Local'],
    writer: ['Escritor Local'],
    actors: ['Actor 1', 'Actor 2'],
    awards: '',
    language: ['Español'],
    country: ['México'],
    boxOffice: '',
    production: '',
    website: '',
    type: 'movie',
    dvd: '',
    trailerKey: 'DBHofAezYaU',
    trailerSearchUrl: 'https://www.youtube.com/results?search_query=Verano+del+77+2021+official+trailer',
  },
  {
    id: 'fallback-el-pasillo',
    imdbId: 'tt-local-4',
    source: 'catalog',
    title: 'El Pasillo',
    year: 2024,
    duration: '1h 37m',
    rating: '18+',
    match: 95,
    vote: 7.9,
    imdbVotes: '1,876',
    metascore: 75,
    ratings: [{ source: 'Internet Movie Database', value: '7.9/10' }],
    genres: ['Suspenso', 'Misterio'],
    mood: 'suspenso',
    tagline: 'La luz falla cada once segundos.',
    synopsis: 'Un vigilante nocturno descubre que el piso catorce del edificio aparece en los planos pero no en el elevador. Cada noche, el pasillo es un poco más largo.',
    poster: '/poster-4-DFI_JCsJ.jpg',
    badge: 'Top 10 hoy',
    director: ['Director Local'],
    writer: ['Escritor Local'],
    actors: ['Actor 1', 'Actor 2'],
    awards: '',
    language: ['Español'],
    country: ['México'],
    boxOffice: '',
    production: '',
    website: '',
    type: 'movie',
    dvd: '',
    trailerKey: 'HmhVYO_UGm4',
    trailerSearchUrl: 'https://www.youtube.com/results?search_query=El+Pasillo+2024+official+trailer',
  },
  {
    id: 'fallback-confeti',
    imdbId: 'tt-local-5',
    source: 'catalog',
    title: 'Confeti',
    year: 2022,
    duration: '1h 48m',
    rating: '7+',
    match: 90,
    vote: 7.3,
    imdbVotes: '4,321',
    metascore: 65,
    ratings: [{ source: 'Internet Movie Database', value: '7.3/10' }],
    genres: ['Comedia', 'Feel good'],
    mood: 'feliz',
    tagline: 'Un desfile que nadie autorizó.',
    synopsis: 'Cinco vecinos deciden salvar su calle organizando la fiesta más ruidosa e ilegal del barrio. Solo tienen un permiso vencido y demasiadas ganas.',
    poster: '/poster-8-C4kah2_z.jpg',
    badge: '',
    director: ['Director Local'],
    writer: ['Escritor Local'],
    actors: ['Actor 1', 'Actor 2'],
    awards: '',
    language: ['Español'],
    country: ['México'],
    boxOffice: '',
    production: '',
    website: '',
    type: 'movie',
    dvd: '',
    trailerKey: 'sVCJA0U6MyE',
    trailerSearchUrl: 'https://www.youtube.com/results?search_query=Confeti+2022+official+trailer',
  },
  {
    id: 'fallback-azotea-once',
    imdbId: 'tt-local-6',
    source: 'catalog',
    title: 'Azotea Once',
    year: 2024,
    duration: '1h 52m',
    rating: '13+',
    match: 96,
    vote: 8.1,
    imdbVotes: '2,134',
    metascore: 80,
    ratings: [{ source: 'Internet Movie Database', value: '8.1/10' }],
    genres: ['Romance', 'Drama'],
    mood: 'romantico',
    tagline: 'Se conocieron por un apagón.',
    synopsis: 'Dos desconocidos quedan atrapados en la azotea de un edificio durante un corte de luz que dura toda la noche. Al amanecer tendrán que decidir si se vuelven a ver.',
    poster: '/poster-5-BJGCGQmv.jpg',
    badge: 'Favorita del público',
    director: ['Director Local'],
    writer: ['Escritor Local'],
    actors: ['Actor 1', 'Actor 2'],
    awards: '',
    language: ['Español'],
    country: ['México'],
    boxOffice: '',
    production: '',
    website: '',
    type: 'movie',
    dvd: '',
    trailerKey: 'At0u6ZjtTw8',
    trailerSearchUrl: 'https://www.youtube.com/results?search_query=Azotea+Once+2024+official+trailer',
  },
  {
    id: 'fallback-linea-cresta',
    imdbId: 'tt-local-7',
    source: 'catalog',
    title: 'Línea de Cresta',
    year: 2023,
    duration: '2h 12m',
    rating: '13+',
    match: 93,
    vote: 7.7,
    imdbVotes: '1,567',
    metascore: 70,
    ratings: [{ source: 'Internet Movie Database', value: '7.7/10' }],
    genres: ['Aventura', 'Documental'],
    mood: 'aventurero',
    tagline: 'Arriba nadie te espera.',
    synopsis: 'Una expedición sin patrocinio intenta trazar la primera ruta por la cara este de una cordillera que los mapas locales evitan nombrar.',
    poster: '/poster-6-geXDuGI-.jpg',
    badge: '',
    director: ['Director Local'],
    writer: ['Escritor Local'],
    actors: ['Actor 1', 'Actor 2'],
    awards: '',
    language: ['Español'],
    country: ['México'],
    boxOffice: '',
    production: '',
    website: '',
    type: 'movie',
    dvd: '',
    trailerKey: 'QVMKFeLtCkE',
    trailerSearchUrl: 'https://www.youtube.com/results?search_query=L%C3%ADnea+de+Cresta+2023+official+trailer',
  },
  {
    id: 'fallback-orbita-tenue',
    imdbId: 'tt-local-8',
    source: 'catalog',
    title: 'Órbita Tenue',
    year: 2025,
    duration: '2h 01m',
    rating: '13+',
    match: 91,
    vote: 7.6,
    imdbVotes: '987',
    metascore: 73,
    ratings: [{ source: 'Internet Movie Database', value: '7.6/10' }],
    genres: ['Ciencia ficción', 'Contemplativa'],
    mood: 'reflexivo',
    tagline: 'Silencio, con vista al planeta.',
    synopsis: 'El último tripulante de una estación en desmantelamiento recibe un mensaje suyo, grabado siete años antes, con una instrucción que no recuerda haber dado.',
    poster: '/poster-7-Bqra6GzS.jpg',
    badge: 'Exclusiva Midnight',
    director: ['Director Local'],
    writer: ['Escritor Local'],
    actors: ['Actor 1', 'Actor 2'],
    awards: '',
    language: ['Español'],
    country: ['México'],
    boxOffice: '',
    production: '',
    website: '',
    type: 'movie',
    dvd: '',
    trailerKey: 'kSZddHca0ME',
    trailerSearchUrl: 'https://www.youtube.com/results?search_query=%C3%93rbita+Tenue+2025+official+trailer',
  },
  {
    id: 'fallback-cintas-invierno',
    imdbId: 'tt-local-9',
    source: 'catalog',
    title: 'Cintas de Invierno',
    year: 2020,
    duration: '1h 33m',
    rating: '16+',
    match: 88,
    vote: 7.4,
    imdbVotes: '1,234',
    metascore: 69,
    ratings: [{ source: 'Internet Movie Database', value: '7.4/10' }],
    genres: ['Drama', 'Íntima'],
    mood: 'melancolico',
    tagline: 'Grabó su despedida en casete.',
    synopsis: 'Un archivista clasifica las grabaciones caseras de una familia desaparecida y empieza a reconocer su propia voz de niño entre las cintas.',
    poster: '/poster-4-DFI_JCsJ.jpg',
    badge: '',
    director: ['Director Local'],
    writer: ['Escritor Local'],
    actors: ['Actor 1', 'Actor 2'],
    awards: '',
    language: ['Español'],
    country: ['México'],
    boxOffice: '',
    production: '',
    website: '',
    type: 'movie',
    dvd: '',
    trailerKey: 'owXCx1ebfA0',
    trailerSearchUrl: 'https://www.youtube.com/results?search_query=Cintas+de+Invierno+2020+official+trailer',
  },
  {
    id: 'fallback-neon-abierto',
    imdbId: 'tt-local-10',
    source: 'catalog',
    title: 'Neón Abierto',
    year: 2024,
    duration: '1h 44m',
    rating: '16+',
    match: 89,
    vote: 7.2,
    imdbVotes: '2,345',
    metascore: 66,
    ratings: [{ source: 'Internet Movie Database', value: '7.2/10' }],
    genres: ['Acción', 'Cyberpunk'],
    mood: 'energico',
    tagline: 'La ciudad no duerme, tú tampoco.',
    synopsis: 'Una carrera clandestina se convierte en cacería cuando el premio deja de ser dinero y empieza a ser el mapa de la red eléctrica de la ciudad.',
    poster: '/poster-2-DSuB6aWQ.jpg',
    badge: '',
    director: ['Director Local'],
    writer: ['Escritor Local'],
    actors: ['Actor 1', 'Actor 2'],
    awards: '',
    language: ['Español'],
    country: ['México'],
    boxOffice: '',
    production: '',
    website: '',
    type: 'movie',
    dvd: '',
    trailerKey: 'z6aMAPndP8Q',
    trailerSearchUrl: 'https://www.youtube.com/results?search_query=Ne%C3%B3n+Abierto+2024+official+trailer',
  },
  {
    id: 'fallback-postal-agosto',
    imdbId: 'tt-local-11',
    source: 'catalog',
    title: 'Postal de Agosto',
    year: 2019,
    duration: '1h 29m',
    rating: '7+',
    match: 86,
    vote: 7.1,
    imdbVotes: '1,876',
    metascore: 64,
    ratings: [{ source: 'Internet Movie Database', value: '7.1/10' }],
    genres: ['Nostalgia', 'Familiar'],
    mood: 'nostalgico',
    tagline: 'Volver al pueblo, veinte años después.',
    synopsis: 'Una fotógrafa regresa al pueblo donde pasó todos sus veranos para vender la casa familiar y termina reconstruyendo un álbum que nunca se terminó.',
    poster: '/poster-3-CER_oLq2.jpg',
    badge: '',
    director: ['Director Local'],
    writer: ['Escritor Local'],
    actors: ['Actor 1', 'Actor 2'],
    awards: '',
    language: ['Español'],
    country: ['México'],
    boxOffice: '',
    production: '',
    website: '',
    type: 'movie',
    dvd: '',
    trailerKey: '6ntUefWpN40',
    trailerSearchUrl: 'https://www.youtube.com/results?search_query=Postal+de+Agosto+2019+official+trailer',
  },
  {
    id: 'fallback-faro-mudo',
    imdbId: 'tt-local-12',
    source: 'catalog',
    title: 'Faro Mudo',
    year: 2022,
    duration: '1h 58m',
    rating: '16+',
    match: 87,
    vote: 7.5,
    imdbVotes: '1,432',
    metascore: 71,
    ratings: [{ source: 'Internet Movie Database', value: '7.5/10' }],
    genres: ['Contemplativa', 'Misterio'],
    mood: 'reflexivo',
    tagline: 'Dos meses, una sola voz.',
    synopsis: 'Un guardafaro acepta un turno de dos meses en total aislamiento y comienza a escribir cartas a alguien que quizá nunca existió.',
    poster: '/poster-7-Bqra6GzS.jpg',
    badge: '',
    director: ['Director Local'],
    writer: ['Escritor Local'],
    actors: ['Actor 1', 'Actor 2'],
    awards: '',
    language: ['Español'],
    country: ['México'],
    boxOffice: '',
    production: '',
    website: '',
    type: 'movie',
    dvd: '',
    trailerKey: 'gHcmaoysGMI',
    trailerSearchUrl: 'https://www.youtube.com/results?search_query=Faro+Mudo+2022+official+trailer',
  },
]

function getFallbackMovies(mood) {
  return FALLBACK_MOVIES.filter(m => m.mood === mood)
}

// Modelos free recomendados (orden de preferencia)
const OPENROUTER_MODELS = [
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'z-ai/glm-5.2:free',
  'openai/gpt-oss-120b:free',
  'openrouter/free',
]

// Cache en memoria por imdbID para no gastar la cuota diaria de OMDB.
const omdbCache = new Map()
const trailerCache = new Map()

// OMDB no permite filtrar por género en su búsqueda `s=` (solo busca en
// títulos), así que el catálogo dinámico arma un pool de películas con estas
// palabras clave genéricas y luego filtra por el género real del detalle
// (`i=ImdbID`). Deja de ser un catálogo hardcodeado: todo se consume de la API.
// Reducido a 8 queries para ahorrar requests de OMDB (~8 requests por catálogo)
const SEED_QUERIES = [
  'love',
  'action',
  'comedy',
  'thriller',
  'drama',
  'adventure',
  'horror',
  'sci-fi',
]

// Páginas de resultados (10 por página) que se piden por cada seed query:
// más páginas = pool más grande = más variedad real de OMDB por ánimo.
const SEARCH_PAGES_PER_QUERY = 1

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

// Tamaño del pool de candidatos y mínimo de coincidencias directas antes de
// rellenar con el resto del catálogo. CATALOG_TARGET es un techo generoso:
// en la práctica se muestran TODAS las películas del pool que sintonizan con
// el ánimo (no se recorta a un puñado como antes).
const CATALOG_TARGET = 10
const CATALOG_MIN = 6
const CATALOG_POOL_MAX = 30

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
      const pages = Array.from({ length: SEARCH_PAGES_PER_QUERY }, (_, i) => i + 1)
      await Promise.all(
        SEED_QUERIES.flatMap((query) =>
          pages.map(async (page) => {
            try {
              const raw = await omdb({ s: query, type: 'movie', page })
              for (const hit of raw.Search || []) {
                if (!pool.has(hit.imdbID)) {
                  pool.set(hit.imdbID, { imdbId: hit.imdbID, title: hit.Title || query })
                }
              }
            } catch {
              // una búsqueda fallida no detiene al resto del pool
            }
          }),
        ),
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
        if (movie) {
          await attachTrailer(movie)
          omdbCache.set(entry.imdbId, movie)
        }
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

  // Se muestran TODAS las coincidencias reales del ánimo (hasta el techo
  // generoso de CATALOG_TARGET); solo se rellena con el resto del catálogo
  // si el ánimo tiene muy pocas coincidencias directas en el pool.
  const combined = tuned.length >= CATALOG_MIN ? tuned : [...tuned, ...rest]
  const results = combined.slice(0, CATALOG_TARGET).map((movie) => ({ ...movie, mood }))

  catalogCache.set(mood, results)
  return results
}

// Tráiler oficial VERIFICADO de títulos conocidos por IMDb ID (video ID de
// YouTube, confirmado contra el oembed de YouTube). OMDB no provee
// tráileres; cualquier título que no esté mapeado aquí NO recibe un video
// (para no mostrar el tráiler equivocado): en su lugar se ofrece un link de
// búsqueda real en YouTube (ver trailerSearchUrl).
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

// Construye una URL de búsqueda real de YouTube para el título + año, usada
// como respaldo honesto cuando no hay un tráiler verificado en MOVIE_TRAILERS
// (evita mostrar el video de otra película como si fuera su tráiler).
function trailerSearchUrl(title, year) {
  const q = `${title} ${year || ''} official trailer`.trim()
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
}

async function resolveTmdbTrailer(imdbId) {
  if (!TMDB_KEY) return null
  if (trailerCache.has(imdbId)) return trailerCache.get(imdbId)

  try {
    const findUrl = new URL(`${TMDB_BASE}/find/${encodeURIComponent(imdbId)}`)
    findUrl.searchParams.set('api_key', TMDB_KEY)
    findUrl.searchParams.set('external_source', 'imdb_id')
    const findResponse = await fetch(findUrl)
    if (!findResponse.ok) return null
    const found = await findResponse.json()
    const media = found.movie_results?.[0]
    if (!media?.id) return null

    const videoUrl = new URL(`${TMDB_BASE}/movie/${media.id}/videos`)
    videoUrl.searchParams.set('api_key', TMDB_KEY)
    videoUrl.searchParams.set('language', 'en-US')
    const videoResponse = await fetch(videoUrl)
    if (!videoResponse.ok) return null
    const data = await videoResponse.json()
    const video = (data.results || []).find(
      (item) => item.site === 'YouTube' && item.type === 'Trailer' && item.official,
    ) || (data.results || []).find(
      (item) => item.site === 'YouTube' && ['Trailer', 'Teaser'].includes(item.type),
    )
    if (!video?.key) return null

    const result = {
      provider: 'tmdb',
      key: video.key,
      url: `https://www.youtube.com/watch?v=${video.key}`,
      verified: true,
    }
    trailerCache.set(imdbId, result)
    return result
  } catch {
    return null
  }
}

async function attachTrailer(movie) {
  if (movie.trailerKey) {
    movie.video = {
      provider: 'youtube',
      key: movie.trailerKey,
      url: `https://www.youtube.com/watch?v=${movie.trailerKey}`,
      verified: true,
    }
    return movie
  }

  const trailer = await resolveTmdbTrailer(movie.imdbId)
  if (trailer) {
    movie.trailerKey = trailer.key
    movie.video = trailer
  }
  return movie
}

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
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(`OMDB respondió ${response.status}`)
    error.response = data
    throw error
  }
  return data
}

// ---------- OpenRouter LLM: parseo de mood desde texto libre ----------
async function parseMoodWithLLM(text) {
  if (!OPENROUTER_KEY) return null

  const systemPrompt = `Eres un clasificador de estado de animo para una app de cine.
El usuario escribe con sus palabras como se siente y que quiere ver.
Devuelve SOLO JSON valido con este esquema:
{
  "mood": "melancolico|energico|nostalgico|suspenso|feliz|romantico|aventurero|reflexivo|null",
  "confidence": 0-1,
  "keywords": ["palabra1", "palabra2"],  // palabras clave extraidas para busqueda OMDB
  "referenceTitle": "titulo de referencia si menciona uno", // ej: "algo como Inception"
  "reasoning": "explicacion breve en espanol"
}
Moods validos: melancolico, energico, nostalgico, suspenso, feliz, romantico, aventurero, reflexivo.

GUIA DE MAPEO DE EMOCIONES COMUNES:
- enojado, furioso, frustrado, estresado, tenso -> energico (accion, thrillers para descargar adrenalina)
- triste, deprimido, melancolico, solitario, nostalgico_triste -> melancolico
- feliz, alegre, contento, euforico, emocionado -> feliz
- ansioso, nervioso, intranquilo -> suspenso (thrillers, misterio)
- aburrido, rutinario -> aventurero (peliculas de aventura, viajes)
- enamorado, romantico, carinoso -> romantico
- pensativo, filosofico, existencial, profundo -> reflexivo
- nostalgico, recuerdos, infancia, pasado -> nostalgico

Si no detectas un mood claro, pon mood: null.`

  for (const model of OPENROUTER_MODELS) {
    try {
      const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'HTTP-Referer': 'https://github.com/Don-Riko/Team3_DEVF',
          'X-Title': 'Midnight Cinema & Mood',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 300,
          temperature: 0.3,
        }),
      })

      if (!response.ok) {
        const err = await response.text()
        console.warn(`OpenRouter ${model} error: ${response.status} ${err}`)
        continue // try next model
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      if (!content) continue

      const parsed = JSON.parse(content)
      if (parsed && typeof parsed === 'object') {
        return {
          mood: parsed.mood || null,
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
          keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
          referenceTitle: parsed.referenceTitle || '',
          reasoning: parsed.reasoning || '',
          model,
        }
      }
    } catch (error) {
      console.warn(`OpenRouter ${model} failed:`, error.message)
      continue
    }
  }
  return null
}

function runtimeLabel(minutes) {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

// Convierte "Nombre1, Nombre2, ..." en un arreglo limpio de strings.
function splitList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item && item !== 'N/A')
}

// Normaliza una película de OMDB a la forma que usa la app.
// Incluye todos los campos relevantes que expone la API (más allá del
// mínimo de póster/rating/duración): reparto, dirección, premios, taquilla,
// idioma, país, Metascore, votos IMDb y el desglose de Ratings por fuente
// (IMDb / Rotten Tomatoes / Metacritic).
function omdbToMovie(entry, raw) {
  if (!raw || raw.Response !== 'True') return null
  const vote = Number(raw.imdbRating) || 0
  const minutesMatch = /(\d+)\s*min/.exec(raw.Runtime || '')
  const minutes = minutesMatch ? Number(minutesMatch[1]) : null
  const genres = String(raw.Genre || '')
    .split(',')
    .map((genre) => genre.trim())
    .filter(Boolean)
  const clean = (value) => (value && value !== 'N/A' ? value : '')
  return {
    id: `omdb-${raw.imdbID}`,
    imdbId: raw.imdbID,
    source: 'omdb',
    title: raw.Title || entry.title,
    year: Number(raw.Year) || '',
    duration: runtimeLabel(minutes),
    rating: clean(raw.Rated),
    match: Math.min(98, Math.max(74, Math.round(44 + vote * 6))),
    vote,
    imdbVotes: clean(raw.imdbVotes),
    metascore: raw.Metascore && raw.Metascore !== 'N/A' ? Number(raw.Metascore) : null,
    ratings: Array.isArray(raw.Ratings)
      ? raw.Ratings.map((r) => ({ source: r.Source, value: r.Value }))
      : [],
    genres,
    mood: entry.mood,
    tagline: '',
    synopsis:
      raw.Plot && raw.Plot !== 'N/A'
        ? raw.Plot
        : 'Sinopsis no disponible para este título.',
    poster: raw.Poster && raw.Poster !== 'N/A' ? raw.Poster : '',
    badge: '',
    director: splitList(raw.Director),
    writer: splitList(raw.Writer),
    actors: splitList(raw.Actors),
    awards: clean(raw.Awards),
    language: splitList(raw.Language),
    country: splitList(raw.Country),
    boxOffice: clean(raw.BoxOffice),
    production: clean(raw.Production),
    website: clean(raw.Website),
    type: clean(raw.Type),
    dvd: clean(raw.DVD),
    // Solo se asigna un trailerKey si está verificado en MOVIE_TRAILERS; si no
    // existe, se manda null + un link de búsqueda real en vez de un video
    // genérico no relacionado (sería un tráiler falso para ese título).
    trailerKey: MOVIE_TRAILERS[raw.imdbID] || MOVIE_TRAILERS[entry.imdbId] || null,
    trailerSearchUrl: trailerSearchUrl(raw.Title || entry.title, raw.Year),
  }
}

// ---------- middlewares ----------
server.use(cors())
server.use(express.json())

// Abre la conexión a Supabase una sola vez y la reutiliza.
async function ensureConnection() {
  // Con Pool no se mantiene una conexion abierta; se valida que el pool pueda
  // obtener una (y se libera de inmediato). Se cachea la promesa para no
  // repetir el chequeo en cada request.
  if (!clientConnectionPromise) {
    clientConnectionPromise = pool.query('SELECT 1').catch((error) => {
      clientConnectionPromise = null
      throw error
    })
  }
  await clientConnectionPromise
}

server.get('/api/hello', (request, response) => {
  response.json({ message: 'Hello from the Midnight backend!' })
})

// POST /api/register
// Crea una cuenta con los datos del formulario clásico.
// Cuerpo esperado: { username, password, firstName, lastName, phone, email }
// Solo username y password son estrictamente obligatorios en el backend; los
// demás se persisten si vienen. El correo, si se envía, debe ser único.
server.post('/api/register', async (request, response) => {
  try {
    const {
      username,
      password,
      firstName = '',
      lastName = '',
      phone = '',
      email = null,
    } = request.body ?? {}

    if (!username || !password) {
      return response.status(400).json({ ok: false, error: 'Usuario y contraseña son requeridos.' })
    }

    await ensureConnection()

    // Iniciales a partir de nombre/apellido, o del username como respaldo.
    const initialsSource = `${firstName} ${lastName}`.trim() || username
    const initials = initialsSource
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')

    try {
      const result = await pool.query(
        `INSERT INTO ${DATABASE_SCHEMA}.users
           (username, password, initials, first_name, last_name, phone, email)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, username, initials`,
        [username, password, initials, firstName, lastName, phone, email || null],
      )
      const user = result.rows[0]
      return response.status(201).json({ ok: true, user })
    } catch (dbError) {
      // 23505 = unique_violation (username o email duplicado).
      if (dbError.code === '23505') {
        const field = /email/i.test(dbError.detail || '') ? 'correo' : 'usuario'
        return response.status(409).json({ ok: false, error: `Ese ${field} ya está registrado.` })
      }
      throw dbError
    }
  } catch (error) {
    console.error('SERVER ERROR [POST /api/register]:', error)
    return response.status(500).json({ ok: false, error: 'Error en el servidor.' })
  }
})

// POST /api/forgot-password
// Genera un token de recuperación para el correo dado. Por seguridad responde
// siempre ok (no revela si el correo existe). Para MVP devuelve el token en la
// respuesta (en producción se enviaría por email).
server.post('/api/forgot-password', async (request, response) => {
  try {
    const { email } = request.body ?? {}
    if (!email) {
      return response.status(400).json({ ok: false, error: 'El correo es requerido.' })
    }

    await ensureConnection()

    const userResult = await pool.query(
      `SELECT id FROM ${DATABASE_SCHEMA}.users WHERE lower(email) = lower($1) LIMIT 1`,
      [email],
    )

    // Respuesta uniforme aunque el correo no exista (evita enumeración).
    if (userResult.rows.length === 0) {
      return response.json({ ok: true, message: 'Si el correo existe, se enviaron instrucciones.' })
    }

    const userId = userResult.rows[0].id
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30) // 30 minutos

    await pool.query(
      `INSERT INTO ${DATABASE_SCHEMA}.password_resets (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt.toISOString()],
    )

    // MVP: sin servicio de correo, devolvemos el token para poder probar el flujo.
    return response.json({
      ok: true,
      message: 'Si el correo existe, se enviaron instrucciones.',
      resetToken: token,
    })
  } catch (error) {
    console.error('SERVER ERROR [POST /api/forgot-password]:', error)
    return response.status(500).json({ ok: false, error: 'Error en el servidor.' })
  }
})

// POST /api/reset-password
// Aplica una nueva contraseña usando un token válido y no expirado.
// Cuerpo esperado: { token, password }
server.post('/api/reset-password', async (request, response) => {
  try {
    const { token, password } = request.body ?? {}
    if (!token || !password) {
      return response.status(400).json({ ok: false, error: 'Token y nueva contraseña son requeridos.' })
    }

    await ensureConnection()

    const resetResult = await pool.query(
      `SELECT id, user_id FROM ${DATABASE_SCHEMA}.password_resets
       WHERE token = $1 AND used = false AND expires_at > now()
       LIMIT 1`,
      [token],
    )

    if (resetResult.rows.length === 0) {
      return response.status(400).json({ ok: false, error: 'Token inválido o expirado.' })
    }

    const { id: resetId, user_id: userId } = resetResult.rows[0]

    await pool.query(
      `UPDATE ${DATABASE_SCHEMA}.users SET password = $1 WHERE id = $2`,
      [password, userId],
    )
    await pool.query(
      `UPDATE ${DATABASE_SCHEMA}.password_resets SET used = true WHERE id = $1`,
      [resetId],
    )

    return response.json({ ok: true, message: 'Contraseña actualizada correctamente.' })
  } catch (error) {
    console.error('SERVER ERROR [POST /api/reset-password]:', error)
    return response.status(500).json({ ok: false, error: 'Error en el servidor.' })
  }
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

    const result = await pool.query(`SELECT id, username, initials FROM ${DATABASE_SCHEMA}.users
     WHERE LOWER(username) = LOWER($1) AND password = $2
     LIMIT 1`,
    [username, password],)

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

    const userResult = await pool.query(`SELECT id FROM ${DATABASE_SCHEMA}.users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
    [username],)
    if (userResult.rows.length === 0) {
      return response.status(404).json({ ok: false, error: 'Usuario no encontrado.' })
    }

    const userId = userResult.rows[0].id
    const insertResult = await pool.query(`INSERT INTO ${DATABASE_SCHEMA}.mood_selections (user_id, mood) VALUES ($1, $2) RETURNING id, user_id, mood, created_at`,
    [userId, mood],)

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
      console.warn('OMDB_API_KEY no configurada, usando catálogo local de respaldo')
      const fallback = getFallbackMovies(mood)
      return response.json({ ok: true, mood, source: 'catalog', results: fallback })
    }

    try {
      const results = await buildMoodCatalog(mood)
      
      // Si OMDB devuelve resultados vacíos (rate limit), usar fallback
      if (!results || results.length === 0) {
        console.warn('OMDB devolvió catálogo vacío para mood:', mood, '- usando fallback local')
        const fallback = getFallbackMovies(mood)
        return response.json({ ok: true, mood, source: 'catalog', results: fallback })
      }

      return response.json({ ok: true, mood, source: 'omdb', results })
    } catch (omdbError) {
      console.error('Error al obtener catálogo OMDB:', omdbError.message)
      console.warn('Usando catálogo local de respaldo')
      const fallback = getFallbackMovies(mood)
      return response.json({ ok: true, mood, source: 'catalog', results: fallback })
    }
  } catch (error) {
    console.error('SERVER ERROR [GET /api/catalog]:', error)
    // Último recurso: fallback local
    const fallback = getFallbackMovies(request.query.mood)
    return response.json({ ok: true, mood: request.query.mood, source: 'catalog', results: fallback })
  }
})

// GET /api/search?q=X
// Busca películas reales en OMDB por nombre. Cada resultado se enriquece con
// el detalle completo y un tráiler (mapa por IMDb ID o video por defecto).
server.get('/api/search', async (request, response) => {
  try {
    const { q } = request.query
    const query = q ? String(q).trim() : ''
    const requestedPage = Number.parseInt(request.query.page, 10)
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1

    if (!query) {
      return response.status(400).json({ ok: false, error: 'El parámetro q es requerido.' })
    }

    if (!OMDB_KEY) {
      console.warn('OMDB_API_KEY no configurada, búsqueda local no disponible para búsqueda por nombre')
      return response.json({ ok: true, query, total: 0, results: [], source: 'catalog' })
    }

    try {
      const raw = await omdb({ s: query, type: 'movie', page })
      
      // Manejar rate limit de OMDB
      if (raw.Response === 'False' && raw.Error && raw.Error.includes('limit')) {
        console.warn('OMDB rate limit alcanzado para búsqueda:', query)
        return response.json({ ok: true, query, total: 0, results: [], source: 'catalog', error: 'Rate limit OMDB' })
      }
      
      if (raw.Response !== 'True' || !Array.isArray(raw.Search)) {
        return response.json({ ok: true, query, total: 0, results: [] })
      }

      const candidates = raw.Search.slice(0, 10).map((hit) => ({
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
        page,
        total: Number(raw.totalResults) || results.length,
        hasMore: page * 10 < Number(raw.totalResults || 0),
        results,
      })
    } catch (omdbError) {
      const isRateLimit = omdbError.response?.Error?.includes('limit') || omdbError.response?.Error?.includes('limit reached')
      if (isRateLimit) {
        console.warn('OMDB rate limit alcanzado para búsqueda:', query)
        return response.json({ ok: true, query, total: 0, results: [], source: 'catalog', error: 'Rate limit OMDB' })
      }
      console.error('Error en búsqueda OMDB:', omdbError.message)
      return response.json({ ok: true, query, total: 0, results: [], source: 'catalog', error: omdbError.message })
    }
  } catch (error) {
    console.error('SERVER ERROR [GET /api/search]:', error)
    return response.status(502).json({ ok: false, error: error.message })
  }
})

// GET /api/mood-search?q=X
// Búsqueda conversacional: usa LLM (OpenRouter) para interpretar el texto libre
// del usuario, extraer mood + palabras clave, y buscar en OMDB enriquecido.
server.get('/api/mood-search', async (request, response) => {
  try {
    const { q } = request.query
    const query = q ? String(q).trim() : ''

    if (!query) {
      return response.status(400).json({ ok: false, error: 'El parámetro q es requerido.' })
    }

    if (!OMDB_KEY) {
      console.warn('OMDB_API_KEY no configurada, usando búsqueda local de respaldo para mood-search')
      // Fallback: buscar en catálogo local por keywords simples
      const localResults = searchLocalCatalog(query)
      return response.json({
        ok: true,
        query,
        llm: null,
        results: localResults,
        source: 'catalog',
      })
    }

    // 1) LLM analiza el texto → mood + keywords + título de referencia
    let llmResult = null
    try {
      llmResult = await parseMoodWithLLM(query)
    } catch (llmError) {
      console.warn('LLM falló, continuando con búsqueda por keywords:', llmError.message)
    }

    // 2) Construir queries de búsqueda para OMDB
    const searchQueries = []
    if (llmResult?.keywords?.length) searchQueries.push(...llmResult.keywords)
    if (llmResult?.referenceTitle) searchQueries.push(llmResult.referenceTitle)
    // Fallback: usar el texto original si el LLM no dio keywords
    if (searchQueries.length === 0) searchQueries.push(query)

    // 3) Buscar en OMDB con cada query y combinar resultados (dedup por imdbID)
    const allResults = new Map()
    for (const sq of searchQueries.slice(0, 3)) { // máx 3 queries para no agotar cuota
      try {
        const raw = await omdb({ s: sq, type: 'movie', page: 1 })
        if (raw.Response === 'True' && Array.isArray(raw.Search)) {
          for (const hit of raw.Search) {
            if (!allResults.has(hit.imdbID)) {
              allResults.set(hit.imdbID, { imdbId: hit.imdbID, title: hit.Title || sq })
            }
          }
        }
      } catch (err) {
        const isRateLimit = err.response?.Error?.includes('limit') || err.response?.Error?.includes('limit reached')
        if (isRateLimit) {
          console.warn('OMDB rate limit en mood-search para:', sq)
          // Si hay rate limit, no tiene sentido seguir intentando
          break
        }
        // query individual fallida no rompe el resto
      }
    }

    // 4) Enriquecer candidatos (detalle + tráiler) y filtrar por mood si LLM detectó uno
    const candidates = [...allResults.values()].slice(0, 10)
    let results = (await enrichMovies(candidates)).filter(Boolean)

    if (llmResult?.mood && MOOD_GENRES[llmResult.mood]) {
      const genreList = MOOD_GENRES[llmResult.mood]
      const tuned = results.filter((m) => (m.genres || []).some((g) => genreList.includes(g)))
      const rest = results.filter((m) => !(m.genres || []).some((g) => genreList.includes(g)))
      results = [...tuned, ...rest]
    }

    // Si no hay resultados de OMDB, usar catálogo local
    if (results.length === 0) {
      console.warn('Sin resultados de OMDB en mood-search, usando catálogo local')
      const localResults = searchLocalCatalog(query)
      return response.json({
        ok: true,
        query,
        llm: llmResult
          ? {
              mood: llmResult.mood,
              confidence: llmResult.confidence,
              keywords: llmResult.keywords,
              referenceTitle: llmResult.referenceTitle,
              reasoning: llmResult.reasoning,
              model: llmResult.model,
            }
          : null,
        results: localResults,
        source: 'catalog',
      })
    }

    // Asignar mood detectado a cada película
    results = results.map((m) => ({ ...m, mood: m.mood || llmResult?.mood || moodForGenres(m.genres) }))

    return response.json({
      ok: true,
      query,
      llm: llmResult
        ? {
            mood: llmResult.mood,
            confidence: llmResult.confidence,
            keywords: llmResult.keywords,
            referenceTitle: llmResult.referenceTitle,
            reasoning: llmResult.reasoning,
            model: llmResult.model,
          }
        : null,
      results,
      source: 'omdb',
    })
  } catch (error) {
    console.error('SERVER ERROR [GET /api/mood-search]:', error)
    // Fallback final: catálogo local
    const localResults = searchLocalCatalog(request.query.q)
    return response.json({
      ok: true,
      query: request.query.q,
      llm: null,
      results: localResults,
      source: 'catalog',
      error: error.message,
    })
  }
})

// Búsqueda simple en catálogo local por palabras clave
function searchLocalCatalog(query) {
  const normalized = query.toLowerCase()
  const moodKeywords = {
    melancolico: ['melancolico', 'triste', 'llorar', 'lluvia', 'silencio', 'solitario', 'nostalgia', 'deprimido', 'bajon', 'down', 'sad'],
    energico: ['energico', 'accion', 'adrenalina', 'intenso', 'rapido', 'explosiones', 'peleas', 'lucha', 'correr', 'action', 'energy'],
    nostalgico: ['nostalgico', 'infancia', 'pasado', 'verano', 'recuerdos', 'niñez', 'antiguo', 'clasico', 'retro', 'vintage', 'nostalgic'],
    suspenso: ['suspenso', 'tension', 'misterio', 'intriga', 'thriller', 'sospecha', 'enigma', 'oscuro', 'suspense', 'mystery'],
    feliz: ['feliz', 'alegre', 'risas', 'comedia', 'divertido', 'buen rollo', 'positivo', 'animado', 'gracioso', 'happy', 'comedy', 'funny'],
    romantico: ['romantico', 'amor', 'pareja', 'enamorado', 'cita', 'boda', 'besos', 'corazon', 'romance', 'love', 'romantic'],
    aventurero: ['aventurero', 'aventura', 'viaje', 'explorar', 'descubrir', 'mapa', 'expedicion', 'selva', 'montaña', 'adventure', 'journey'],
    reflexivo: ['reflexivo', 'pensar', 'profundo', 'filosofico', 'existencia', 'sentido', 'vida', 'mente', 'cerebro', 'intelectual', 'thoughtful', 'deep'],
  }

  let detectedMood = null
  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    if (keywords.some(kw => normalized.includes(kw))) {
      detectedMood = mood
      break
    }
  }

  if (detectedMood) {
    return getFallbackMovies(detectedMood)
  }

  // Buscar por título en catálogo local
  return FALLBACK_MOVIES.filter(movie => 
    movie.title.toLowerCase().includes(normalized)
  )
}

// GET /api/omdb/:imdbId
// Detalle real de una película por su ID de IMDb (con cache).
server.get('/api/omdb/:imdbId', async (request, response) => {
  const { imdbId } = request.params
  try {
    if (omdbCache.has(imdbId)) {
      return response.json({ ok: true, movie: omdbCache.get(imdbId) })
    }

    const raw = await omdb({ i: imdbId, plot: 'short' })
    const movie = omdbToMovie({ imdbId, title: '' }, raw)
    if (!movie) {
      return response.status(404).json({ ok: false, error: 'Película no encontrada en OMDB.' })
    }
    await attachTrailer(movie)
    omdbCache.set(imdbId, movie)

    return response.json({ ok: true, movie })
  } catch (error) {
    const isRateLimit = error.response?.Error?.includes('limit') || error.response?.Error?.includes('limit reached')
    if (isRateLimit) {
      console.warn('OMDB rate limit alcanzado para detalle:', imdbId)
      return response.status(429).json({ ok: false, error: 'Rate limit OMDB alcanzado. Intenta más tarde.' })
    }
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

    const userResult = await pool.query(`SELECT id FROM ${DATABASE_SCHEMA}.users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
    [username],)
    if (userResult.rows.length === 0) {
      return response.json({ ok: true, items: [] })
    }

    const result = await pool.query(`SELECT movie_id, source, title, poster, year, trailer_key, status, created_at
     FROM ${DATABASE_SCHEMA}.library_items
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userResult.rows[0].id],)

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

    const userResult = await pool.query(`SELECT id FROM ${DATABASE_SCHEMA}.users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
    [username],)
    if (userResult.rows.length === 0) {
      return response.status(404).json({ ok: false, error: 'Usuario no encontrado.' })
    }

    await pool.query(`INSERT INTO ${DATABASE_SCHEMA}.library_items
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
    ],)

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

    const userResult = await pool.query(`SELECT id FROM ${DATABASE_SCHEMA}.users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
    [username],)
    if (userResult.rows.length === 0) {
      return response.json({ ok: true })
    }

    await pool.query(`DELETE FROM ${DATABASE_SCHEMA}.library_items WHERE user_id = $1 AND movie_id = $2`,
    [userResult.rows[0].id, movieId],)

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

    const userResult = await pool.query(`SELECT id FROM ${DATABASE_SCHEMA}.users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
    [username],)
    if (userResult.rows.length === 0) {
      return response.status(404).json({ ok: false, error: 'Usuario no encontrado.' })
    }

    const userId = userResult.rows[0].id

    const [histogramResult, recentResult, libraryResult] = await Promise.all([
      pool.query(`SELECT mood, count(*)::int AS count
       FROM ${DATABASE_SCHEMA}.mood_selections
       WHERE user_id = $1
       GROUP BY mood
       ORDER BY count DESC`,
      [userId],),
      pool.query(`SELECT mood, created_at
       FROM ${DATABASE_SCHEMA}.mood_selections
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId],),
      pool.query(`SELECT status, count(*)::int AS count
       FROM ${DATABASE_SCHEMA}.library_items
       WHERE user_id = $1
       GROUP BY status`,
      [userId],),
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

// En Vercel (serverless) NO se debe llamar a listen(): la plataforma invoca
// la app exportada como función. Solo escuchamos en local / entornos propios.
if (!process.env.VERCEL) {
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
}

module.exports = server