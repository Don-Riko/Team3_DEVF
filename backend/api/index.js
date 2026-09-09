// Punto de entrada serverless para Vercel.
// Reexporta la app Express definida en ../index.js. En Vercel no se llama a
// listen(): la plataforma usa esta función para manejar cada request.
module.exports = require('../index.js')
