import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// El archivo de credenciales (mongo_usr.sql) vive en la raíz del repo,
// fuera de `frontend/`. Habilitamos el acceso del dev server a ese
// directorio y exponemos un alias `@db` para importarlo con ?raw.
const dbDir = fileURLToPath(new URL('../db', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@db': dbDir,
    },
  },
  server: {
    fs: {
      // Permite servir archivos desde el directorio db del repo root.
      allow: ['..'],
    },
  },
})
