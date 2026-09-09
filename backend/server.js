const app = require('./src/app')
const config = require('./src/config/env')

const server = app.listen(config.port, async () => {
  console.log(`Servidor corriendo en el puerto ${config.port}`)
  try {
    const { Pool } = require('pg')
    const pool = new Pool({
      connectionString: config.pg.connectionString,
      ssl: { rejectUnauthorized: false },
    })
    await pool.query('SELECT 1')
    console.log('Conectado a la base de datos (Supabase)')
    await pool.end()
  } catch (err) {
    console.warn('No se pudo conectar a Supabase:', err.message)
    console.warn('Verifica PG_CONNECTION_STRING en el archivo .env')
  }
  if (!config.omdb.apiKey) {
    console.warn('OMDB_API_KEY no configurada: la cartelera usará el catálogo local.')
  }
  if (!config.openrouter.apiKey) {
    console.warn('OPENROUTER_API_KEY no configurada: búsqueda conversacional no disponible.')
  }
})

module.exports = server