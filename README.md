# Midnight Cinema & Mood

> *Del ánimo al play en tres clics.*

**Midnight Cinema & Mood** es una aplicación web de recomendación de películas basada en el estado de ánimo del usuario. En lugar de elegir por catálogo, el usuario expresa cómo se siente (melancólico, enérgico, nostálgico, suspenso, feliz, romántico, aventurero o reflexivo) y la app le sugiere películas que sintonizan con ese ánimo.

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

El proyecto integra de forma puntual los conceptos del curso de Frontend:

| Concepto del curso | Aplicación en el proyecto |
|---|---|
| **Componentes en React** | Piedra angular del proyecto: `Login`, `MoodPicker`, `MovieCard`, `MovieModal`, `ProfileMenu`, `TypingAnimation`. |
| **Estado y Context API** | `AuthContext` gestiona la sesión global; se combina con `localStorage` para persistir la autenticación entre recargas. |
| **Routing con React Router** | Rutas públicas y protegidas (`/login`, `/welcome`) con guardas de redirección (`ProtectedRoute`, `LoginRoute`, `WelcomeRoute`). |
| **Manejo de formularios y validación** | Formulario de login validado con **Zod** (patrón de solo-alfanuméricos sin repeticiones consecutivas). |
| **Consumo de APIs / peticiones HTTP** | Cliente `auth.js` que consume `POST /api/login` y `POST /api/mood-selection` del backend Express. |
| **Estilos y diseño responsive** | Sistema de diseño propio en `index.css` con variables CSS, `oklch()`, `color-mix()` y breakpoints; animaciones con Framer Motion y CSS. |
| **Backend y bases de datos** | API REST con **Express 5** conectada a **PostgreSQL (Supabase)** mediante `pg`, con manejo de variables de entorno y `dotenv`. |
| **Autenticación** | Flujo real de login contra la tabla `users`, con sesión persistente en el cliente. |
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
| Express | ^5 | Framework HTTP (API REST) |
| pg (node-postgres) | ^8 | Cliente PostgreSQL |
| dotenv | ^17 | Variables de entorno |
| cors | ^2 | CORS |
| nodemon | ^3 | Auto-reload en desarrollo |

### Base de Datos

| Tecnología | Uso |
|---|---|
| Supabase (PostgreSQL) | Base de datos hosted (pooler con SSL) |

---

## Estructura del Proyecto

```
Team3_DEVF/
├── backend/
│   ├── .env              # Variables de entorno (credenciales de Supabase)
│   ├── index.js          # Servidor Express (API completa, archivo único)
│   └── package.json
├── db/
│   └── db.sql            # Schema SQL (tablas users, mood_selections + seed)
├── frontend/
│   ├── public/           # Assets estáticos (posters, hero, íconos)
│   ├── src/
│   │   ├── main.jsx      # Entry point (BrowserRouter + AuthProvider)
│   │   ├── App.jsx       # Componente principal (mood picker + recomendaciones)
│   │   ├── routes.jsx    # Guardas de ruta (ProtectedRoute, etc.)
│   │   ├── AuthContext.jsx
│   │   ├── auth.js       # Llamadas a la API (login, mood-selection)
│   │   ├── Login.jsx     # Página de login
│   │   ├── loginSchema.js
│   │   ├── MoodPicker.jsx
│   │   ├── MovieCard.jsx
│   │   ├── MovieModal.jsx
│   │   ├── data.js       # Catálogo estático: 8 moods + 12 películas
│   │   ├── icons.jsx
│   │   ├── index.css     # Sistema de diseño (variables CSS, responsive)
│   │   └── components/
│   │       └── TypingAnimation.jsx
│   ├── index.html
│   ├── vite.config.js    # Puerto 5173 + proxy /api -> 127.0.0.1:3000
│   └── package.json
└── README.md
```

---

## Requisitos Previos

- [Node.js](https://nodejs.org/) v18 o superior
- npm
- Una cuenta en [Supabase](https://supabase.com/) (para crear el proyecto de base de datos)

---

## Configuración de la Base de Datos

1. Crea un proyecto en Supabase.
2. Ve al **SQL Editor** > **New Query**.
3. Copia el contenido de `db/db.sql` y ejecútalo.
4. Esto creará las tablas `users` y `mood_selections`, e insertará un usuario de demostración.

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

# 3. Crear el archivo .env manualmente
#    (o renombrar el existente) con estas variables:
#    PG_CONNECTION_STRING=postgresql://postgres.<tu-proyecto>:<tu-password>@aws-0-<region>.pooler.supabase.com:5432/postgres
#    SUPABASE_SCHEMA=public
#    PORT=3000

# 4. Iniciar en modo desarrollo (con auto-reload)
npm run dev

# O iniciar en produccion
npm start
```

> Obtén la connection string en Supabase: **Settings → Database → Connection string (URI)**. Asegúrate de incluir la contraseña de la base de datos.

El servidor estará disponible en `http://localhost:3000` y, si la configuración es correcta, mostrará el mensaje `Conectado a la base de datos (Supabase)`.

### Endpoints API

| Método | Ruta | Descripción | Body |
|---|---|---|---|
| `GET` | `/api/hello` | Health check | - |
| `POST` | `/api/login` | Autenticar usuario | `{ username, password }` |
| `POST` | `/api/mood-selection` | Registrar selección de mood | `{ username, mood }` |

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

> **Nota:** En modo desarrollo, Vite proxea automáticamente las requests a `/api` hacia `http://127.0.0.1:3000`, por lo que no hay problemas de CORS.

---

## Arquitectura

### Arquitectura implementada

```
[Browser (React SPA)]  <--proxy /api (Vite)-->  [Express Backend]  <--pg client-->  [Supabase PostgreSQL]
        |                                               |
   Puerto 5173                                     Puerto 3000
   (Vite dev server)                        (API REST + conexión lazy a la BD)
```

**Niveles de la solución:**

1. **Capa de presentación (Frontend / React SPA):** Interfaz single-page con enrutamiento client-side, autenticación vía Context API + `localStorage`, y catalogación local de películas.
2. **Capa de servicios (Backend / Express):** API REST minimalista en un solo archivo que expone autenticación y registro de interacciones; conexión a la base de datos *lazy* (se abre en el primer request).
3. **Capa de datos (Supabase/PostgreSQL):** Almacenamiento de usuarios y del historial de selecciones de ánimo por usuario.

**Flujo de datos:**

1. **Login:** El usuario ingresa credenciales → el frontend envía `POST /api/login` → el backend valida contra la tabla `users` → devuelve el objeto de usuario → se almacena en `AuthContext` + `localStorage`.
2. **Selección de mood:** El usuario hace clic en un mood card → se actualiza el estado local → se envía `POST /api/mood-selection` → el backend registra en `mood_selections`.
3. **Recomendaciones:** Lógica client-side — `data.js` contiene 12 películas, cada una etiquetada con un mood; `recommendationsFor(moodId)` filtra por mood y agrega 4 películas "similares".

### Arquitectura propuesta / a futuro

El MVP actual es de arquitectura simple y de archivo único. La evolución propuesta contempla desacoplar responsabilidades y escalar hacia un producto más robusto:

```
[Browser (React SPA)]
      │
      ├── AuthContext + tokens (JWT)
      │
[API Gateway / Express modular]        → estructura de capas:
      ├── controllers/                 → validación + respuestas HTTP
      ├── services/                    → lógica de negocio (recomendaciones)
      ├── repositories/                → consultas SQL (source de datos)
      └── middleware/                  → auth, rate-limit, logs, errores
      │
[PostgreSQL (Supabase)]  ← ORM opcional (Prisma) + migraciones
      │
[Servicios externos]     → TMDB API (catálogo real), OAuth (Google), CDN de posters
```

Principios de esta arquitectura propuesta:

- **Separación por capas** (controller / service / repository) para testear y mantener el código.
- **Autenticación real con tokens** (JWT) en lugar de sesión puramente client-side.
- **Catálogo dinámico** consumiendo una API de cine (TMDB) en lugar de datos hardcodeados.
- **Enriquecimiento de datos** para alimentar el modelo de recomendación.
- **Migraciones y versionado de esquema** (Prisma o SQL migratorio) para el ciclo de vida de la BD.
- **Observabilidad:** logs estructurados, monitoreo y manejo unificado de errores.

---

## Funcionalidades y Proyecciones a Futuro

### Estado actual (MVP)

El MVP demuestra el concepto de punta a punta. Está incompleto por diseño: priorizamos un circuito completo y funcional (login → mood → recomendación → registro) sobre amplitud de features.

- ✅ Sistema de login/registro de usuarios contra una base de datos real (Supabase).
- ✅ Selector de 8 estados de ánimo con identidad visual propia.
- ✅ Recomendaciones curadas por mood con ficha detallada (sinopsis, géneros, match).
- ✅ Sesión persistente y cierre de sesión.
- ✅ Registro de selecciones históricas en la base de datos.

### Proyecciones a futuro

Estas son las líneas de trabajo planteadas para llevar el MVP a un producto completo:

**Producto y contenido**
- 📽️ **Catálogo dinámico** conectado a TMDB (o API similar) con cartelera real y trailers.
- 🎚️ **Filtros combinados:** mood + género + duración + rating para afinar recomendaciones.
- 📚 **"Mi biblioteca":** guardar películas vistas y pendientes (`watchlist`/`watched`).
- 🗣️ **Modo "que película veo con..."** para grupos (mood grupal, votación).
- 🎨 **Perfil de gusto emocional:** histórico personal de moods para detectar patrones.

**Cuenta y seguridad**
- 🔐 **Registro de nuevos usuarios** (hoy solo existe el usuario demo `Admin`).
- 🛡️ **Hash de contraseñas** (bcrypt/argon2) y autenticación con **JWT** + refresh.
- 🔑 **OAuth con Google/Apple** para ingreso social.

**Experiencia de usuario**
- 📱 **App progresiva (PWA)** para instalarla en el celular.
- 🌙 **Modo "Midnight" mejorado:** temas, accesibilidad y soporte para daltonismo.
- ⏱️ **Persistencia de sesión corta vs. larga** ("recuérdame en este dispositivo").

**Backend y datos**
- 🧬 **Motor de recomendaciones** basado en historial real (`mood_selections`) en lugar de reglas fijas.
- 🔄 **Migraciones de esquema** y permisos de nivel fila (RLS) en Supabase.
- 🧪 **Suite de tests** unitarios y de integración (hoy el backend no tiene ninguno).
- 📊 **Dashboard básico** de métricas de uso (moods más elegidos, películas top).

---

## Rutas

| Ruta | Componente | Acceso |
|---|---|---|
| `/login` | Login | Pública (redirige a `/welcome` si ya está autenticado) |
| `/welcome` | App (MoodPicker + Recomendaciones) | Protegida (redirige a `/login` si no está autenticado) |
| `/` | Redirect a `/welcome` | - |

---

## Base de Datos

### Tablas

**`users`**

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | PK, auto-generado |
| `username` | text | Único, not null |
| `password` | text | Contraseña (seed en texto plano) |
| `initials` | text | Iniciales del usuario |
| `created_at` | timestamptz | Fecha de creación |

**`mood_selections`**

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | PK, auto-generado |
| `user_id` | uuid | FK → users(id), cascade on delete |
| `mood` | text | Mood seleccionado |
| `created_at` | timestamptz | Fecha de selección |