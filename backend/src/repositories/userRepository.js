const { Pool } = require('pg')
const config = require('../config/env')

const pool = new Pool({
  connectionString: config.pg.connectionString,
  ssl: { rejectUnauthorized: false },
})

const SCHEMA = config.pg.schema

async function query(text, params) {
  const client = await pool.connect()
  try {
    return await client.query(text, params)
  } finally {
    client.release()
  }
}

async function findUserByUsername(username) {
  const result = await query(
    `SELECT id, username, password, initials FROM ${SCHEMA}.users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
    [username]
  )
  return result.rows[0] || null
}

async function createUser({ username, password, initials }) {
  const result = await query(
    `INSERT INTO ${SCHEMA}.users (username, password, initials) VALUES ($1, $2, $3) RETURNING id, username, initials, created_at`,
    [username, password, initials]
  )
  return result.rows[0]
}

async function recordMoodSelection(userId, mood) {
  const result = await query(
    `INSERT INTO ${SCHEMA}.mood_selections (user_id, mood) VALUES ($1, $2) RETURNING id, user_id, mood, created_at`,
    [userId, mood]
  )
  return result.rows[0]
}

async function getMoodHistory(userId) {
  const result = await query(
    `SELECT mood, count(*)::int AS count FROM ${SCHEMA}.mood_selections WHERE user_id = $1 GROUP BY mood ORDER BY count DESC`,
    [userId]
  )
  return result.rows
}

async function getRecentMoodSelections(userId, limit = 20) {
  const result = await query(
    `SELECT mood, created_at FROM ${SCHEMA}.mood_selections WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  )
  return result.rows
}

async function getLibraryItems(userId) {
  const result = await query(
    `SELECT movie_id, source, title, poster, year, trailer_key, status, created_at FROM ${SCHEMA}.library_items WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  )
  return result.rows
}

async function getLibraryCounts(userId) {
  const result = await query(
    `SELECT status, count(*)::int AS count FROM ${SCHEMA}.library_items WHERE user_id = $1 GROUP BY status`,
    [userId]
  )
  return result.rows
}

async function upsertLibraryItem(userId, item) {
  const result = await query(
    `INSERT INTO ${SCHEMA}.library_items (user_id, movie_id, source, title, poster, year, trailer_key, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (user_id, movie_id) DO UPDATE SET
       source = EXCLUDED.source,
       title = EXCLUDED.title,
       poster = EXCLUDED.poster,
       year = EXCLUDED.year,
       trailer_key = EXCLUDED.trailer_key,
       status = EXCLUDED.status
     RETURNING *`,
    [userId, item.movieId, item.source || 'catalog', item.title || '', item.poster || '', item.year || '', item.trailerKey || '', item.status || 'watchlist']
  )
  return result.rows[0]
}

async function deleteLibraryItem(userId, movieId) {
  await query(
    `DELETE FROM ${SCHEMA}.library_items WHERE user_id = $1 AND movie_id = $2`,
    [userId, movieId]
  )
}

module.exports = {
  query,
  findUserByUsername,
  createUser,
  recordMoodSelection,
  getMoodHistory,
  getRecentMoodSelections,
  getLibraryItems,
  getLibraryCounts,
  upsertLibraryItem,
  deleteLibraryItem,
}