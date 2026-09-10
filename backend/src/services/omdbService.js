const config = require('../config/env')

const OMDB_KEY = config.omdb.apiKey
const OMDB_BASE = config.omdb.baseUrl
const TMDB_KEY = config.tmdb.apiKey
const TMDB_BASE = config.tmdb.baseUrl
const OPENROUTER_KEY = config.openrouter.apiKey
const OPENROUTER_BASE = config.openrouter.baseUrl

const OPENROUTER_MODELS = [
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'z-ai/glm-5.2:free',
  'openai/gpt-oss-120b:free',
  'openrouter/free',
]

const omdbCache = new Map()
const trailerCache = new Map()
const catalogCache = new Map()
let searchPoolPromise = null

// Keywords bilingües (inglés + español) para mejores resultados en OMDB
// OMDB busca en títulos, inglés da mejores resultados globales
const MOOD_SEED_QUERIES = {
  melancolico: ['drama', 'romance', 'melancholy', 'sad', 'rain', 'tears', 'loneliness', 'grief'],
  energico: ['action', 'thriller', 'adrenaline', 'fight', 'chase', 'explosion', 'battle', 'speed'],
  nostalgico: ['nostalgia', 'childhood', 'summer', 'memory', 'past', 'vintage', 'retro', 'coming of age'],
  suspenso: ['thriller', 'mystery', 'suspense', 'crime', 'horror', 'tension', 'intrigue', 'detective'],
  feliz: ['comedy', 'funny', 'happy', 'feel good', 'laugh', 'family', 'animation', 'musical'],
  romantico: ['romance', 'love', 'romantic', 'relationship', 'couple', 'wedding', 'date', 'passion'],
  aventurero: ['adventure', 'journey', 'exploration', 'travel', 'expedition', 'quest', 'survival', 'wild'],
  reflexivo: ['sci-fi', 'philosophy', 'existential', 'mind', 'consciousness', 'future', 'technology', 'space'],
}

// Géneros OMDB que mapean a cada mood
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

// Prioridad para asignar mood por género
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

const CATALOG_TARGET = 10
const CATALOG_MIN = 6
const CATALOG_POOL_MAX = 30
const SEARCH_PAGES_PER_QUERY = 1

function moodForGenres(genres) {
  for (const [genre, moodId] of MOOD_BY_GENRE) {
    if (genres.includes(genre)) return moodId
  }
  return 'feliz'
}

function moodGenreTuned(movie, mood) {
  const genreList = MOOD_GENRES[mood] || []
  return (movie.genres || []).some((g) => genreList.includes(g))
}

async function omdb(params) {
  if (!OMDB_KEY) throw new Error('OMDB_API_KEY no configurada')
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

async function buildSearchPool(mood, limit = CATALOG_POOL_MAX) {
  const cacheKey = `pool:${mood}`
  if (searchPoolPromise && catalogCache.has(cacheKey)) {
    return catalogCache.get(cacheKey)
  }

  const queries = MOOD_SEED_QUERIES[mood] || MOOD_SEED_QUERIES.melancolico
  const pool = new Map()

  await Promise.all(
    queries.flatMap((query) =>
      Array.from({ length: SEARCH_PAGES_PER_QUERY }, (_, i) => i + 1).map(async (page) => {
        try {
          const raw = await omdb({ s: query, type: 'movie', page })
          for (const hit of raw.Search || []) {
            if (!pool.has(hit.imdbID)) {
              pool.set(hit.imdbID, { imdbId: hit.imdbID, title: hit.Title || query })
            }
          }
        } catch {
          // ignore individual query failures
        }
      })
    )
  )

  const results = [...pool.values()].slice(0, limit)
  catalogCache.set(cacheKey, results)
  return results
}

function splitList(value) {
  return String(value || '').split(',').map((s) => s.trim()).filter((s) => s && s !== 'N/A')
}

function runtimeLabel(minutes) {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

function trailerSearchUrl(title, year) {
  const q = `${title} ${year || ''} official trailer`.trim()
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
}

const MOVIE_TRAILERS = {
  tt0338013: '07-QBnEkgXU', // Eternal Sunshine
  tt1798709: 'ne6p6MfLBxc', // Her
  tt4034228: 'gsVoD0pTge0', // Manchester by the Sea
  tt3896198: 'wUn05hdkhjM', // Guardians 2
  tt1392190: 'hEJnMQG9ev8', // Mad Max Fury Road
  tt2911666: '2AUmvWm5ZDQ', // John Wick
  tt0109830: 'XHhAG-YLdk8', // Forrest Gump
  tt0092005: '9UUcTNZKrks', // Stand by Me
  tt0816692: 'zSWdZVtXT7E', // Interstellar
  tt2543164: 'tFMo3UJ4B4g', // Arrival
}

async function resolveTmdbTrailer(imdbId) {
  if (!TMDB_KEY) return null
  if (trailerCache.has(imdbId)) return trailerCache.get(imdbId)

  try {
    const findUrl = new URL(`${TMDB_BASE}/find/${encodeURIComponent(imdbId)}`)
    findUrl.searchParams.set('api_key', TMDB_KEY)
    findUrl.searchParams.set('external_source', 'imdb_id')
    const findRes = await fetch(findUrl)
    if (!findRes.ok) return null
    const found = await findRes.json()
    const media = found.movie_results?.[0]
    if (!media?.id) return null

    const videoUrl = new URL(`${TMDB_BASE}/movie/${media.id}/videos`)
    videoUrl.searchParams.set('api_key', TMDB_KEY)
    videoUrl.searchParams.set('language', 'en-US')
    const videoRes = await fetch(videoUrl)
    if (!videoRes.ok) return null
    const data = await videoRes.json()
    const video = (data.results || []).find(
      (v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official
    ) || (data.results || []).find(
      (v) => v.site === 'YouTube' && ['Trailer', 'Teaser'].includes(v.type)
    )
    if (!video?.key) return null

    const result = { provider: 'tmdb', key: video.key, url: `https://www.youtube.com/watch?v=${video.key}`, verified: true }
    trailerCache.set(imdbId, result)
    return result
  } catch {
    return null
  }
}

async function attachTrailer(movie) {
  if (movie.trailerKey) {
    movie.video = { provider: 'youtube', key: movie.trailerKey, url: `https://www.youtube.com/watch?v=${movie.trailerKey}`, verified: true }
    return movie
  }
  const trailer = await resolveTmdbTrailer(movie.imdbId)
  if (trailer) {
    movie.trailerKey = trailer.key
    movie.video = trailer
  }
  return movie
}

function omdbToMovie(entry, raw) {
  if (!raw || raw.Response !== 'True') return null
  const vote = Number(raw.imdbRating) || 0
  const minutesMatch = /(\d+)\s*min/.exec(raw.Runtime || '')
  const minutes = minutesMatch ? Number(minutesMatch[1]) : null
  const genres = String(raw.Genre || '').split(',').map((g) => g.trim()).filter(Boolean)
  const clean = (v) => (v && v !== 'N/A' ? v : '')

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
    ratings: Array.isArray(raw.Ratings) ? raw.Ratings.map((r) => ({ source: r.Source, value: r.Value })) : [],
    genres,
    mood: entry.mood,
    tagline: '',
    synopsis: raw.Plot && raw.Plot !== 'N/A' ? raw.Plot : 'Sinopsis no disponible.',
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
    trailerKey: MOVIE_TRAILERS[raw.imdbID] || MOVIE_TRAILERS[entry.imdbId] || null,
    trailerSearchUrl: trailerSearchUrl(raw.Title || entry.title, raw.Year),
  }
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
    })
  )
}

async function buildMoodCatalog(mood) {
  if (catalogCache.has(mood)) return catalogCache.get(mood)
  if (!MOOD_GENRES[mood]) {
    catalogCache.set(mood, [])
    return []
  }

  const pool = await buildSearchPool(mood)
  const movies = (await enrichMovies(pool)).filter(Boolean)

  const tuned = movies.filter((m) => moodGenreTuned(m, mood))
  const rest = movies.filter((m) => !moodGenreTuned(m, mood))
  const combined = tuned.length >= CATALOG_MIN ? tuned : [...tuned, ...rest]
  const results = combined.slice(0, CATALOG_TARGET).map((m) => ({ ...m, mood }))

  catalogCache.set(mood, results)
  return results
}

async function searchMoviesOMDB(query, page = 1) {
  try {
    const raw = await omdb({ s: query, type: 'movie', page })

    if (raw.Response === 'False' && raw.Error && raw.Error.includes('limit')) {
      return { ok: false, rateLimit: true, error: 'Rate limit OMDB' }
    }
    if (raw.Response !== 'True' || !Array.isArray(raw.Search)) {
      return { ok: true, results: [], total: 0, page, hasMore: false }
    }

    const candidates = raw.Search.slice(0, 10).map((hit) => ({
      imdbId: hit.imdbID,
      title: hit.Title || query,
      mood: '',
    }))

    const results = (await enrichMovies(candidates))
      .filter(Boolean)
      .map((m) => ({ ...m, mood: moodForGenres(m.genres) }))

    return {
      ok: true,
      results,
      page,
      total: Number(raw.totalResults) || results.length,
      hasMore: page * 10 < Number(raw.totalResults || 0),
    }
  } catch (err) {
    if (err.response?.Error?.includes('limit') || err.response?.Error?.includes('limit reached')) {
      return { ok: false, rateLimit: true, error: 'Rate limit OMDB' }
    }
    throw err
  }
}

async function getMovieDetail(imdbId) {
  if (omdbCache.has(imdbId)) return omdbCache.get(imdbId)
  const raw = await omdb({ i: imdbId, plot: 'short' })
  const movie = omdbToMovie({ imdbId, title: '' }, raw)
  if (!movie) return null
  await attachTrailer(movie)
  omdbCache.set(imdbId, movie)
  return movie
}

async function parseMoodWithLLM(text) {
  if (!OPENROUTER_KEY) return null

  const systemPrompt = `Eres un clasificador de estado de animo para una app de cine.
El usuario escribe con sus palabras como se siente y que quiere ver.
Devuelve SOLO JSON valido con este esquema:
{
  "mood": "melancolico|energico|nostalgico|suspenso|feliz|romantico|aventurero|reflexivo|null",
  "confidence": 0-1,
  "keywords": ["palabra1", "palabra2"],  // palabras clave en INGLES para busqueda OMDB
  "referenceTitle": "titulo de referencia si menciona uno",
  "reasoning": "explicacion breve en espanol"
}
Moods validos: melancolico, energico, nostalgico, suspenso, feliz, romantico, aventurero, reflexivo.

GUIA DE MAPEO DE EMOCIONES:
- enojado, furioso, frustrado, estresado, tenso, enojada, furiosa -> energico (keywords: action, thriller, adrenaline)
- triste, deprimido, melancolico, solitario, melancolica -> melancolico (keywords: drama, melancholy, sad)
- ansioso, nervioso, intranquilo, ansiosa -> suspenso (keywords: thriller, mystery, suspense)
- aburrido, rutinario, aburrida -> aventurero (keywords: adventure, journey, exploration)
- enamorado, romantico, carinoso, enamorada, romantica -> romantico (keywords: romance, love, romantic)
- pensativo, filosofico, existencial, profundo, pensativa -> reflexivo (keywords: sci-fi, philosophy, existential)
- nostalgico, recuerdos, infancia, pasado, nostalgica -> nostalgico (keywords: nostalgia, childhood, memory)

Si no detectas mood claro, pon mood: null. Keywords siempre en INGLES.`

  for (const model of OPENROUTER_MODELS) {
    try {
      const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENROUTER_KEY}`,
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

      if (!res.ok) {
        const err = await res.text()
        console.warn(`OpenRouter ${model} error: ${res.status} ${err}`)
        continue
      }

      const data = await res.json()
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
    } catch (err) {
      console.warn(`OpenRouter ${model} failed:`, err.message)
    }
  }
  return null
}

async function moodSearch(query) {
  let llmResult = null
  try {
    llmResult = await parseMoodWithLLM(query)
  } catch {
    // ignore LLM errors
  }

  const searchQueries = []
  if (llmResult?.keywords?.length) searchQueries.push(...llmResult.keywords)
  if (llmResult?.referenceTitle) searchQueries.push(llmResult.referenceTitle)
  if (searchQueries.length === 0) searchQueries.push(query)

  const allResults = new Map()
  for (const sq of searchQueries.slice(0, 3)) {
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
      if (err.response?.Error?.includes('limit') || err.response?.Error?.includes('limit reached')) {
        break
      }
    }
  }

  const candidates = [...allResults.values()].slice(0, 10)
  let results = (await enrichMovies(candidates)).filter(Boolean)

  if (llmResult?.mood && MOOD_GENRES[llmResult.mood]) {
    const genreList = MOOD_GENRES[llmResult.mood]
    const tuned = results.filter((m) => (m.genres || []).some((g) => genreList.includes(g)))
    const rest = results.filter((m) => !(m.genres || []).some((g) => genreList.includes(g)))
    results = [...tuned, ...rest]
  }

  results = results.map((m) => ({ ...m, mood: m.mood || llmResult?.mood || moodForGenres(m.genres) }))

  return {
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
    source: results.length ? 'omdb' : 'catalog',
  }
}

module.exports = {
  omdb,
  buildMoodCatalog,
  searchMoviesOMDB,
  getMovieDetail,
  moodSearch,
  parseMoodWithLLM,
  omdbCache,
  catalogCache,
}