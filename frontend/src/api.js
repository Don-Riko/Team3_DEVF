// api.js
// Cliente de la API de Midnight (backend Express).
// Agrupa las llamadas de red: catálogo OMDB, biblioteca y perfil emocional.

const ENDPOINT = import.meta.env.VITE_ENDPOINT || '/api'

async function request(path, options = {}) {
  const response = await fetch(`${ENDPOINT}${path}`, {
    method: options.method || 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await response.json().catch(() => null)
  return { response, data }
}

/**
 * Cartelera OMDB curada por mood (datos reales enriquecidos por el backend).
 * @param {string} mood id del mood de Midnight
 */
export async function fetchOmdbCatalog(mood) {
  const { response, data } = await request(`/catalog?mood=${encodeURIComponent(mood)}`)
  if (!response.ok || !data?.ok) {
    return { ok: false, error: data?.error || 'No se pudo consultar la cartelera.' }
  }
  return { ok: true, results: data.results || [], source: data.source || 'omdb' }
}

export async function fetchOmdbMovie(imdbId) {
  const { response, data } = await request(`/omdb/${encodeURIComponent(imdbId)}`)
  if (!response.ok || !data?.ok) return null
  return data.movie
}

/**
 * Búsqueda de películas reales en OMDB por nombre.
 * @param {string} query texto a buscar en los títulos
 */
export async function searchMovies(query, page = 1) {
  const params = new URLSearchParams({ q: query, page: String(page) })
  const { response, data } = await request(`/search?${params.toString()}`)
  if (!response.ok || !data?.ok) {
    return { ok: false, error: data?.error || 'No se encontraron resultados.' }
  }
  return {
    ok: true,
    results: data.results || [],
    total: data.total || 0,
    page: data.page || page,
    hasMore: Boolean(data.hasMore),
  }
}

export async function fetchLibrary(username) {
  const { response, data } = await request(`/library?username=${encodeURIComponent(username)}`)
  if (!response.ok || !data?.ok) return null
  return data.items
}

export async function saveLibraryItem(username, item) {
  const { response, data } = await request('/library', {
    method: 'POST',
    body: { username, ...item },
  })
  return response.ok && data?.ok
}

export async function removeLibraryItem(username, movieId) {
  const { response, data } = await request(
    `/library?username=${encodeURIComponent(username)}&movieId=${encodeURIComponent(movieId)}`,
    { method: 'DELETE' },
  )
  return response.ok && data?.ok
}

export async function fetchProfile(username) {
  const { response, data } = await request(`/profile/${encodeURIComponent(username)}`)
  if (!response.ok || !data?.ok) {
    return { ok: false, error: data?.error || 'No se pudo cargar tu perfil.' }
  }
  return { ok: true, profile: data.profile }
}

/**
 * Búsqueda conversacional: texto libre → LLM → mood + keywords → OMDB.
 * @param {string} query texto en lenguaje natural ("quiero algo tranquilo")
 */
export async function searchMood(query) {
  const params = new URLSearchParams({ q: query })
  const { response, data } = await request(`/mood-search?${params.toString()}`)
  if (!response.ok || !data?.ok) {
    return { ok: false, error: data?.error || 'No se pudo procesar la búsqueda.' }
  }
  return {
    ok: true,
    results: data.results || [],
    llm: data.llm || null,
  }
}