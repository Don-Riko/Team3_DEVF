# Midnight Cinema & Mood

> *Del ánimo al play en tres clics.*

**Midnight Cinema & Mood** es una aplicación web de recomendación de películas basada en el estado de ánimo del usuario. En lugar de elegir por catálogo, el usuario expresa cómo se siente (melancólico, enérgico, nostálgico, suspenso, feliz, romántico, aventurero o reflexivo) —o lo describe en lenguaje natural— y la app le sugiere películas que sintonizan con ese ánimo usando datos reales de **OMDB**.

---

## Fundamentos del Proyecto

### ¿Qué problema intentamos resolver?

La selección de una película suele convertirse en una tarea frustrante: demasiado catálogo, demasiada información y poca conexión con lo que el usuario *realmente* necesita en ese momento. La mayoría de plataformas organizan el contenido por género, popularidad o algoritmo de "gustos históricos", pero ignoran el contexto emocional inmediato.

**Midnight Cinema & Mood propone una experiencia inversa**: partir del estado de ánimo actual del usuario para recomendar narrativas que hagan eco de ese ánimo, en solo tres clics (¿cómo te sientes? → elige tu estado de ánimo → reproduce). Es más cercano a cómo pensamos cuando hablamos de cine entre amigos ("hoy quiero algo tranquilo", "necesito reírme", "dame algo que me haga pensar") que a un buscador tradicional.

### ¿Qué resuelve para el público?

- Reduce la **parálisis de decisión** frente a catálogos infinitos.
- Propone una experiencia **emotiva y personal**, entendiendo al usuario desde lo que siente, no solo desde datos demográficos.
- Plantea un MVP minimalista pero con identidad editorial fuerte (películas curadas, estética nocturna, sin spoilers).

### ¿Cómo aplicamos lo aprendido en el curso?

El proyecto integra de forma puntual los conceptos del curso de Frontend y Backend:

| Concepto | Aplicación en el proyecto |
|---|---|
| **Componentes en React** | Piedra angular del proyecto: `Login`, `Register`, `MoodPicker`, `MovieCard`, `MovieModal`, `ProfileModal`, `TypingAnimation`. |
| **Estado y Context API** | `AuthContext` gestiona la sesión global; se combina con `localStorage` para persistir la autenticación entre recargas. |
| **Routing con React Router** | Rutas públicas y protegidas (`/login`, `/register`, `/welcome`) con guardas (`ProtectedRoute`, `LoginRoute`, `RegisterRoute`, `WelcomeRoute`). |
| **Manejo de formularios y validación** | Formularios validados con **Zod** (patrón de solo-alfanuméricos sin repeticiones consecutivas). |
| **Consumo de APIs / peticiones HTTP** | Cliente `api.js` + `auth.js` consumen la API REST del backend Express. Catálogo real vía **OMDB**, **búsqueda conversacional** vía LLM (OpenRouter/Nemotron 3 Ultra), autenticación y biblioteca. |
| **Estilos y diseño responsive** | Sistema de diseño propio en `index.css` con variables CSS, `oklch()`, `color-mix()` y breakpoints; animaciones con Motion (Framer Motion). |
| **Backend modular (Express 5)** | Arquitectura por capas: `controllers/`, `services/`, `repositories/`, `middleware/`, `routes/` — conectada a **PostgreSQL (Supabase)** mediante `pg`. |
| **Autenticación** | Registro de usuarios + login contra la tabla `users` en Supabase, con sesión persistente en `localStorage`. |
| **Herramientas de desarrollo** | Vite (dev server + HMR + proxy), ESLint, npm scripts (`dev`, `build`, `preview`, `lint`). |

---

## Stack Tecnológico

### Frontend

| Tecnología | Versión | Uso |
|---|---|---|
| React | ^19 | UI Library |
| Vite | ^8 | Build tool / dev server |
| React Router DOM | ^7 | Enrutamiento client-side |
| Tailwind CSS | ^4 | Utilidades CSS |
| Zod | ^4 | Validación de formularios |
| Motion (Framer Motion) | ^13 | Animaciones |

### Backend

| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | v22 | Runtime |
| Express | ^5 | Framework HTTP (API REST modular) |
| pg (node-postgres) | ^8 | Cliente PostgreSQL |
| dotenv | ^17 | Variables de entorno |
| cors | ^2 | CORS |
| express-rate-limit | ^7 | Rate limiting (30 req/min general, 10 req/min búsquedas) |
| nodemon | ^3 | Auto-reload en desarrollo |

### Servicios Externos

| Servicio | Uso |
|---|---|
| **OMDB API** | Catálogo dinámico real (pósters, ratings IMDb, sinopsis, géneros) — optimizado a ~18 requests por catálogo de mood |
| **OpenRouter (Nemotron 3 Ultra Free)** | LLM para búsqueda conversacional: texto libre → mood + keywords → búsqueda OMDB enriquecida |
| **TMDB API** (opcional) | Resolución de tráilers oficiales por IMDb ID |
| **YouTube (oembed)** | Tráilers oficiales verificados + footage libre de derechos como respaldo |

### Base de Datos

| Tecnología | Uso |
|---|---|
| Supabase (PostgreSQL) | Base de datos hosted (pooler con SSL + Connection Pool) |

---

## Estructura del Proyecto

```
Team3_DEVF/
├── backend/
│   ├── .env                  # Variables de entorno (Supabase + APIs)
│   ├── .env.example          # Plantilla de configuración
│   ├── package.json
│   ├── server.js             # Entry point (inicia Express + conexión BD)
│   └── src/
│       ├── config/
│       │   └── env.js        # Configuración centralizada (keys, strings, puertos)
│       ├── controllers/
│       │   ├── authController.js      # register, login
│       │   ├── catalogController.js   # catalog, search, mood-search, omdb/:id
│       │   ├── libraryController.js   # library CRUD, profile
│       │   └── moodController.js      # mood-selection
│       ├── services/
│       │   ├── authService.js         # Lógica de registro/login
│       │   ├── omdbService.js         # OMDB API, keywords bilingües, cache, fallback
│       │   └── libraryService.js      # Biblioteca y perfil de usuario
│       ├── repositories/
│       │   └── userRepository.js      # Queries SQL a Supabase (users, moods, library)
│       ├── middleware/
│       │   ├── rateLimit.js           # express-rate-limit (general + búsquedas)
│       │   └── errorHandler.js        # Manejo centralizado de errores
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── catalogRoutes.js
│       │   ├── libraryRoutes.js
│       │   └── moodRoutes.js
│       ├── utils/
│       │   └── [extensión futura]
│       ├── app.js           # Express configurado (middleware + routers)
│       └── index.js         # [OBSOLETO - reemplazado por app.js + server.js]
├── db/
│   └── db.sql              # Schema SQL (tablas users, moods, library + seed)
├── frontend/
│   ├── public/             # Assets estáticos (posters, hero, íconos)
│   ├── src/
│   │   ├── main.jsx       # Entry point (BrowserRouter + AuthProvider + Routes)
│   │   ├── App.jsx        # Componente principal (mood picker + recomendaciones)
│   │   ├── routes.jsx     # Guardas de ruta (ProtectedRoute, LoginRoute, RegisterRoute)
│   │   ├── AuthContext.jsx
│   │   ├── auth.js        # Llamadas a la API (login, register)
│   │   ├── api.js         # Llamadas al catálogo OMDB, biblioteca y perfil
│   │   ├── catalog.js     # Módulo de catálogo (punto de extensión)
│   │   ├── Login.jsx      # Página de login
│   │   ├── Register.jsx   # Página de registro (nueva)
│   │   ├── loginSchema.js
│   │   ├── MoodPicker.jsx
│   │   ├── MovieCard.jsx
│   │   ├── MovieModal.jsx # Modal de detalle + reproductor de tráiler
│   │   ├── ProfileModal.jsx # Perfil de gusto emocional
│   │   ├── data.js        # Catálogo local de respaldo: 8 moods + 12 películas
│   │   ├── icons.jsx
│   │   ├── index.css      # Sistema de diseño (variables CSS, responsive)
│   │   └── components/
│   │       └── TypingAnimation.jsx
│   ├── index.html
│   ├── vite.config.js     # Puerto 5173 + proxy /api -> 127.0.0.1:3000
│   └── package.json
└── README.md
```

---

## Requisitos Previos

- [Node.js](https://nodejs.org/) v18 o superior
- npm
- Una cuenta en [Supabase](https://supabase.com/) (para la base de datos)
- API keys: OMDB, OpenRouter, (opcional) TMDB

---

## Configuración de la Base de Datos

1. Crea un proyecto en Supabase.
2. Ve al **SQL Editor** > **New Query**.
3. Copia el contenido de `db/db.sql` y ejecútalo.
4. Esto creará las tablas `users`, `mood_selections` y `library_items`, e insertará un usuario de demostración.

### Usuario de demostración

| Campo | Valor |
|---|---|
| Username | `Admin` |
| Password | `Admin123` |

---

## Cómo Levantar el Backend

```bash
# 1. Navegar al directorio del backend
cd backend

# 2. Instalar dependencias
npm install

# 3. Crear el archivo .env con las variables:
#    PG_CONNECTION_STRING=postgresql://postgres.<tu-proyecto>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
#    SUPABASE_SCHEMA=public
#    OMDB_API_KEY=<tu-key-de-omdbapi.com>
#    OPENROUTER_API_KEY=<tu-key-de-openrouter.ai>  # Para búsqueda conversacional
#    TMDB_API_KEY=<tu-key-de-themoviedb.org>       # Opcional: tráilers oficiales
#    PORT=3000

# 4. Iniciar en modo desarrollo (con auto-reload)
npm run dev

# O iniciar en producción
npm start
```

> Obtén la connection string en Supabase: **Settings → Database → Connection string (URI)**.

El servidor estará disponible en `http://localhost:3000`.

### Endpoints API

| Método | Ruta | Descripción | Body / Query |
|---|---|---|---|
| `GET` | `/api/hello` | Health check | - |
| `POST` | `/api/register` | **Registrar nuevo usuario** (sin email verification) | `{ username, password }` |
| `POST` | `/api/login` | Autenticar usuario (login o usuario recién registrado) | `{ username, password }` |
| `POST` | `/api/mood-selection` | Registrar selección de mood | `{ username, mood }` |
| `GET` | `/api/catalog?mood=X` | Cartelera OMDB dinámica por mood (10 películas, cache, fallback local). **Optimizado: 8 seed queries, ~18 requests/mood** | `mood` |
| `GET` | `/api/search?q=X` | Busca películas en OMDB (máx 10), enriquece con detalle + tráiler + mood | `q` |
| `GET` | `/api/mood-search?q=X` | **Búsqueda conversacional:** LLM interpreta texto libre → mood + keywords → OMDB. Mapea emociones: enojado→energico, triste→melancolico, ansioso→suspenso, aburrido→aventurero, etc. | `q` |
| `GET` | `/api/omdb/:imdbId` | Detalle real de una película por IMDb ID | - |
| `GET` | `/api/library?username=X` | Lista la biblioteca del usuario (watchlist/vistas) | `username` |
| `POST` | `/api/library` | Agrega/actualiza un ítem de la biblioteca | `{ username, movieId, ... }` |
| `DELETE` | `/api/library` | Quita un ítem de la biblioteca | `username, movieId` |
| `GET` | `/api/profile/:username` | Histórico emocional + resumen de biblioteca | - |

### Rate Limiting

| Endpoint | Límite | Ventana |
|---|---|---|
| General (`/api/*`) | 30 req | 60 segundos |
| Búsquedas (`/api/search`, `/api/mood-search`) | 10 req | 60 segundos |

---

## Cómo Levantar el Frontend

```bash
# 1. Navegar al directorio del frontend
cd frontend

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:5173`.

### Scripts Disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Previsualizar build de producción |
| `npm run lint` | Ejecutar ESLint |

### Variables de Entorno del Frontend

| Variable | Por defecto | Descripción |
|---|---|---|
| `VITE_ENDPOINT` | `/api` | URL base del backend API |

> **Nota:** En modo desarrollo, Vite proxea automáticamente las requests a `/api` hacia `http://127.0.0.1:3000`, evitando problemas de CORS.

---

## Variables de Entorno (referencia completa)

Esta sección consolida **todas** las variables que consume el proyecto, el entorno donde viven, si son obligatorias y su función. Los valores/keys **no** se documentan aquí: cada quien los coloca en su propio `.env` (nunca se versionan).

### Backend (`backend/.env`)

| Variable | Entorno | Obligatoria | Función |
|---|---|---|---|
| `PG_CONNECTION_STRING` | Backend | ✅ Sí | Cadena de conexión Postgres de Supabase. Para serverless (Vercel) usar el **pooler** (`:6543`, modo transaction); para local vale la directa. |
| `SUPABASE_SCHEMA` | Backend | ⚪ Opcional | Esquema de la BD. Por defecto `public` si se omite. |
| `PG_POOL_MAX` | Backend | ⚪ Opcional | Máx. de conexiones del `pg.Pool`. Por defecto `5`. Útil para afinar en serverless. |
| `PORT` | Backend | ⚪ Opcional | Puerto del servidor Express en local. Por defecto `3000`. **No aplica en Vercel** (serverless ignora `listen`). |
| `OMDB_API_KEY` | Backend | ✅ Sí | Key de [omdbapi.com](https://www.omdbapi.com). Catálogo real (pósters, ratings, sinopsis). Sin ella, se usa el catálogo local de respaldo. |
| `OPENROUTER_API_KEY` | Backend | ⚪ Opcional | Key de [openrouter.ai](https://openrouter.ai). Habilita la búsqueda conversacional (LLM Nemotron). Sin ella, ese endpoint degrada a keywords locales. |
| `TMDB_API_KEY` | Backend | ⚪ Opcional | API key (v3) de [themoviedb.org](https://www.themoviedb.org). Respaldo de tráilers oficiales y pósters. |
| `TMDB_READ_ACCESS_TOKEN` | Backend | ⚪ Opcional | Read Access Token (Bearer v4) de TMDB. **Se prefiere** sobre `TMDB_API_KEY` si ambos están presentes. |
| `VERCEL` | Backend | 🤖 Automática | La inyecta Vercel en runtime. Si está presente, el backend **no** llama a `listen()` (modo serverless). No la definas manualmente en local. |

### Frontend (`frontend/.env`)

| Variable | Entorno | Obligatoria | Función |
|---|---|---|---|
| `VITE_ENDPOINT` | Frontend (build) | ⚪ Opcional | URL base del backend. Por defecto `/api`. **Vite la hornea en tiempo de build**, así que debe existir antes de compilar/desplegar. En producción apunta al dominio del backend (p. ej. `https://<backend>.vercel.app/api`); en local, el proxy de Vite cubre `/api`. |

> **Degradación elegante:** las variables opcionales de servicios externos (OMDB/TMDB/OpenRouter) pueden faltar sin romper el arranque; el backend cae a respaldos (catálogo local, sin tráiler oficial, o búsqueda por keywords). Las obligatorias marcadas ✅ sí se requieren para la funcionalidad principal.

> **TMDB (v3 vs v4):** el backend acepta tanto `TMDB_API_KEY` (query `api_key`, v3) como `TMDB_READ_ACCESS_TOKEN` (header `Authorization: Bearer`, v4). Si defines ambas, se usa el token v4 por ser el método recomendado por TMDB.

---

## Arquitectura

### Arquitectura implementada

```
[Browser (React SPA)]
         │
         │ (proxy /api → http://localhost:3000)
         ▼
[Express Backend v5]  ←→  [Supabase PostgreSQL (pooler SSL)]
   Puerto 5173                 Puerto 3000
   (Vite dev server)      (API REST modular)

         │
  ┌──────┴──────┐
  │  External APIs  │
  ├─▶ OMDB API (catálogo real)
  ├─▶ OpenRouter (Nemotron 3 Ultra Free LLM)
  ├─▶ TMDB API (tráilers oficiales)
  └─▶ YouTube (embed + oembed para tráilers)
```

### Arquitectura backend (modular - 5 capas)

```
[HTTP Request]
      │
      ▼
┌─────────────┐  ┌──────────────┐
│  Middleware  │→ rate-limit, CORS, error handler
└─────────────┘
      │
      ▼
┌─────────────┐  ┌──────────────┐
│   Routes    │→ Definición de endpoints (express.Router)
└─────────────┘
      │
      ▼
┌─────────────┐  ┌──────────────┐
│ Controllers │→ Validación + respuesta HTTP (thin layer)
└─────────────┘
      │
      ▼
┌─────────────┐  ┌──────────────┐
│  Services   │→ Lógica de negocio (OMDB caching, LLM parsing, auth)
└─────────────┘
      │
      ▼
┌─────────────┐  ┌──────────────┐
│Repositories │→ Queries SQL a Supabase (pg Pool)
└─────────────┘
      │
      ▼
[Supabase PostgreSQL]
```

**Principios aplicados:**

1. **Separación por capas**: Cada capa (controller/service/repository) tiene una responsabilidad única y clara.
2. **Cache en memoria**: `omdbCache`, `catalogCache`, `trailerCache` evitan requests redundantes a OMDB.
3. **Rate limit estratégico**: 30 req/min general, 10 req/min en búsquedas para proteger los límites de OMDB (1,000 req/día).
4. **Fallback robusto**: Si OMDB rate-limita o falla, todos los endpoints caen al catálogo local (`data.js`).
5. **Keywords bilingües**: El LLM recibe instrucciones en español pero devuelve keywords en inglés para mejorar resultados de búsqueda en OMDB.

### Flujo de datos

1. **Registro/Login:** Usuario → `POST /api/register` → backend valida/crea en Supabase → frontend persiste sesión en `localStorage` + `AuthContext`.

2. **Selección de mood:** Click en mood card → `POST /api/mood-selection` → registrado en `mood_selections`.

3. **Recomendaciones (mood):** Click en mood → `GET /api/catalog?mood=X` → backend arma pool con 8 seed queries (inglés/español) → enriquece con detalle OMDB → filtra por género → cachea resultado (10 películas máx). ~18 requests totales.

4. **Búsqueda por nombre:** Escribe título → `GET /api/search?q=X` → OMDB `s=` → enriquece top 10 → asigna mood.

5. **Búsqueda conversacional:** Escribe "quiero algo de acción" → `GET /api/mood-search?q=X` → LLM (Nemotron) interpreta → keywords en inglés → OMDB `s=` → enriquece → filtra por mood detectado.

---

## Funcionalidades

### Estado actual (MVP)

- ✅ **Registro y login de usuarios** (sin email verification) contra Supabase
- ✅ **Selector de 8 estados de ánimo** con identidad visual propia
- ✅ **Catálogo dinámico real vía OMDB** (pósters, ratings IMDb, duración, género, sinopsis) — optimizado para rate limit
- ✅ **Búsqueda por nombre** en OMDB (máx 10 resultados, keywords en inglés)
- ✅ **Búsqueda conversacional** con LLM (texto libre → mood + películas)
- ✅ **"Mi biblioteca"**: películas guardadas para ver (`watchlist`) y marcadas como vistas (`watched`)
- ✅ **Perfil de gusto emocional**: histórico de moods + estadísticas
- ✅ **Tráilers garantizados**: YouTube embed con fallback a footage libre de derechos
- ✅ **Sesión persistente** en `localStorage` + cierre de sesión
- ✅ **Rate limiting** y manejo de errores centralizado

### Tráilers de video (garantizados)

Todas las películas reproducen un tráiler, por sistema, en tres capas:

1. **Catálogo local (`data.js`)**: 12 películas ficticias con `trailerKey` de YouTube (footage libre de derechos curado por mood).
2. **Catálogo OMDB (`omdbService.js`)**: Títulos reales → `MOVIE_TRAILERS` map → tráiler oficial. Si no está mapeado, se usa `trailerSearchUrl` (link real a YouTube).
3. **Fallback (`MovieModal.jsx`)**: Si un ítem de biblioteca no tiene `trailerKey`, se muestra link de búsqueda en YouTube.

### Mejoras implementadas (vs MVP original)

| Mejora | Descripción |
|---|---|
| **Backend modular** | Separado `index.js` monolítico en `controllers/`, `services/`, `repositories/`, `middleware/`, `routes/` |
| **Registro de usuarios** | Endpoint `POST /api/register` + página `Register.jsx` |
| **Rate limiting** | `express-rate-limit`: 30 req/min general, 10 req/min búsquedas |
| **Búsqueda conversacional** | LLM (Nemotron 3 Ultra Free) interpreta "enojado", "quiero algo triste", etc. |
| **Keywords bilingües** | Prompt de LLM devuelve keywords en inglés para mejorar búsquedas OMDB |
| **Cache en memoria** | `omdbCache`, `catalogCache`, `trailerCache` para evitar requests redundantes |
| **Rate limit OMDB** | Fallback automático al catálogo local si se agota la cuota (1,000 req/día) |

### Por implementar (futuro)

- 🔐 **Hash de contraseñas** (bcrypt/argon2) + JWT
- 🔑 **OAuth** con Google/Apple
- 📱 **PWA** (instalar en móvil)
- 🌙 **Modo oscuro mejorado** (temas, daltonismo)
- 🧬 **Motor de recomendaciones** basado en historial real
- 🔄 **Migraciones de esquema** con RLS en Supabase
- 🧪 **Tests** unitarios y de integración
- 📊 **Dashboard** de métricas de uso

---

## Database

### Tablas

**`users`**

| Column | Type | Description |
|---|---|---|
| `id` | uuid | PK, auto-generated |
| `username` | text | Unique, not null |
| `password` | text | Password (stored in plain text for MVP — see future improvements) |
| `initials` | text | User initials |
| `created_at` | timestamptz | Creation date |

**`mood_selections`**

| Column | Type | Description |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → users(id) |
| `mood` | text | Selected mood |
| `created_at` | timestamptz | Selection date |

**`library_items`**

| Column | Type | Description |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → users(id) |
| `movie_id` | text | Movie ID (`omdb-tt1234567` or local) |
| `source` | text | Origin (`omdb` / `catalog`) |
| `title` | text | Saved title |
| `poster` | text | Poster URL |
| `year` | text | Year |
| `trailer_key` | text | YouTube trailer ID |
| `status` | text | `watchlist` or `watched` |
| `created_at` | timestamptz | Creation date |

---

## Optimización de OMDB (Rate Limit 1,000 req/día)

Para no agotar la cuota diaria de OMDB, el backend implementa estrategias de ahorro:

| Configuración | Valor | Descripción |
|---|---|---|
| `MOOD_SEED_QUERIES` | 8 moods × 8 keywords | Keywords bilingües para cada mood |
| `SEARCH_PAGES_PER_QUERY` | 1 | Páginas por búsqueda |
| `CATALOG_TARGET` | 10 | Películas máximas por catálogo |
| `CATALOG_POOL_MAX` | 30 | Tamaño máximo del pool |
| Límite `/api/search` | 10 | Results máximos (`slice(0, 10)`) |
| Límite `/api/mood-search` | 10 | Candidates máximos (`slice(0, 10)`) |

**Consumo estimado por catálogo de mood:**
- 8 queries × 1 página = **8 requests** de búsqueda
- 10 películas para enriquecer = **10 requests** de detalle
- **Total: ~18 requests/mood**

**Cache en memoria:** `omdbCache`, `catalogCache`, `trailerCache`

**Fallback:** Si OMDB responde `401 Request limit reached`, el backend sirve el catálogo local (`FALLBACK_MOVIES`) automáticamente.