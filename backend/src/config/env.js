require('dotenv').config()

module.exports = {
  port: process.env.PORT || 3000,
  pg: {
    connectionString: process.env.PG_CONNECTION_STRING,
    schema: process.env.SUPABASE_SCHEMA || 'public',
  },
  omdb: {
    apiKey: process.env.OMDB_API_KEY,
    baseUrl: 'https://www.omdbapi.com',
  },
  tmdb: {
    apiKey: process.env.TMDB_API_KEY,
    baseUrl: 'https://api.themoviedb.org/3',
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  rateLimit: {
    windowMs: 60 * 1000,
    max: 30,
  },
}