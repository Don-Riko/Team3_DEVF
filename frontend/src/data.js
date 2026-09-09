const POSTER_1 = '/poster-1-Za7ksjur.jpg'
const POSTER_2 = '/poster-2-DSuB6aWQ.jpg'
const POSTER_3 = '/poster-3-CER_oLq2.jpg'
const POSTER_4 = '/poster-4-DFI_JCsJ.jpg'
const POSTER_5 = '/poster-5-BJGCGQmv.jpg'
const POSTER_6 = '/poster-6-geXDuGI-.jpg'
const POSTER_7 = '/poster-7-Bqra6GzS.jpg'
const POSTER_8 = '/poster-8-C4kah2_z.jpg'

export const HERO_IMAGE = '/hero-cinema-DxvYQ-Vx.jpg'

export const moods = [
  {
    id: 'melancolico',
    label: 'Melancólico',
    hint: 'Lluvia, silencios largos',
    accent: 'var(--mood-melancholic)',
    glyph: '◍',
  },
  {
    id: 'energico',
    label: 'Enérgico',
    hint: 'Pulso alto, sin frenos',
    accent: 'var(--mood-energetic)',
    glyph: '⚡',
  },
  {
    id: 'nostalgico',
    label: 'Nostálgico',
    hint: 'Grano de película, verano',
    accent: 'var(--mood-nostalgic)',
    glyph: '✦',
  },
  {
    id: 'suspenso',
    label: 'Suspenso',
    hint: 'Respira despacio',
    accent: 'var(--mood-suspense)',
    glyph: '◑',
  },
  {
    id: 'feliz',
    label: 'Feliz',
    hint: 'Luz, risas, confeti',
    accent: 'var(--mood-happy)',
    glyph: '☀',
  },
  {
    id: 'romantico',
    label: 'Romántico',
    hint: 'Dos personas, una azotea',
    accent: 'var(--mood-romantic)',
    glyph: '♥',
  },
  {
    id: 'aventurero',
    label: 'Aventurero',
    hint: 'Mapas sin bordes',
    accent: 'var(--mood-adventurous)',
    glyph: '▲',
  },
  {
    id: 'reflexivo',
    label: 'Reflexivo',
    hint: 'Preguntas sin prisa',
    accent: 'var(--mood-reflective)',
    glyph: '◇',
  },
]

export const movies = [
  {
    id: 'lluvia-tardia',
    title: 'Lluvia Tardía',
    year: 2023,
    duration: '1h 54m',
    rating: '16+',
    match: 97,
    genres: ['Drama', 'Neo-noir'],
    mood: 'melancolico',
    tagline: 'Nadie vuelve a casa igual.',
    synopsis:
      'Una traductora nocturna recorre una ciudad que no deja de llover, reconstruyendo la última conversación con su hermano a partir de cintas que él nunca quiso que escuchara.',
    poster: POSTER_1,
    trailerKey: 'lOYaMF_8OmI',
    badge: 'Exclusiva Midnight',
  },
  {
    id: 'sin-frenos',
    title: 'Sin Frenos',
    year: 2025,
    duration: '2h 06m',
    rating: '18+',
    match: 94,
    genres: ['Acción', 'Thriller'],
    mood: 'energico',
    tagline: 'Acelera o desaparece.',
    synopsis:
      'Una mensajera de contrabando digital tiene noventa minutos para cruzar la ciudad entera antes de que el túnel se cierre y su nombre deje de existir.',
    poster: POSTER_2,
    trailerKey: 'DBHofAezYaU',
    badge: 'Estreno',
  },
  {
    id: 'verano-del-77',
    title: 'Verano del 77',
    year: 2021,
    duration: '1h 41m',
    rating: '13+',
    match: 92,
    genres: ['Coming of age', 'Road movie'],
    mood: 'nostalgico',
    tagline: 'El último viaje antes de crecer.',
    synopsis:
      'Tres amigos roban el auto del padre de uno para llegar al mar antes del amanecer. Lo que encuentran en el camino los separa para siempre.',
    poster: POSTER_3,
    trailerKey: 'DBHofAezYaU',
    badge: '',
  },
  {
    id: 'el-pasillo',
    title: 'El Pasillo',
    year: 2024,
    duration: '1h 37m',
    rating: '18+',
    match: 95,
    genres: ['Suspenso', 'Misterio'],
    mood: 'suspenso',
    tagline: 'La luz falla cada once segundos.',
    synopsis:
      'Un vigilante nocturno descubre que el piso catorce del edificio aparece en los planos pero no en el elevador. Cada noche, el pasillo es un poco más largo.',
    poster: POSTER_4,
    trailerKey: 'HmhVYO_UGm4',
    badge: 'Top 10 hoy',
  },
  {
    id: 'confeti',
    title: 'Confeti',
    year: 2022,
    duration: '1h 48m',
    rating: '7+',
    match: 90,
    genres: ['Comedia', 'Feel good'],
    mood: 'feliz',
    tagline: 'Un desfile que nadie autorizó.',
    synopsis:
      'Cinco vecinos deciden salvar su calle organizando la fiesta más ruidosa e ilegal del barrio. Solo tienen un permiso vencido y demasiadas ganas.',
    poster: POSTER_8,
    trailerKey: 'sVCJA0U6MyE',
    badge: '',
  },
  {
    id: 'azotea-once',
    title: 'Azotea Once',
    year: 2024,
    duration: '1h 52m',
    rating: '13+',
    match: 96,
    genres: ['Romance', 'Drama'],
    mood: 'romantico',
    tagline: 'Se conocieron por un apagón.',
    synopsis:
      'Dos desconocidos quedan atrapados en la azotea de un edificio durante un corte de luz que dura toda la noche. Al amanecer tendrán que decidir si se vuelven a ver.',
    poster: POSTER_5,
    trailerKey: 'At0u6ZjtTw8',
    badge: 'Favorita del público',
  },
  {
    id: 'linea-de-cresta',
    title: 'Línea de Cresta',
    year: 2023,
    duration: '2h 12m',
    rating: '13+',
    match: 93,
    genres: ['Aventura', 'Documental'],
    mood: 'aventurero',
    tagline: 'Arriba nadie te espera.',
    synopsis:
      'Una expedición sin patrocinio intenta trazar la primera ruta por la cara este de una cordillera que los mapas locales evitan nombrar.',
    poster: POSTER_6,
    trailerKey: 'QVMKFeLtCkE',
    badge: '',
  },
  {
    id: 'orbita-tenue',
    title: 'Órbita Tenue',
    year: 2025,
    duration: '2h 01m',
    rating: '13+',
    match: 91,
    genres: ['Ciencia ficción', 'Contemplativa'],
    mood: 'reflexivo',
    tagline: 'Silencio, con vista al planeta.',
    synopsis:
      'El último tripulante de una estación en desmantelamiento recibe un mensaje suyo, grabado siete años antes, con una instrucción que no recuerda haber dado.',
    poster: POSTER_7,
    trailerKey: 'kSZddHca0ME',
    badge: 'Exclusiva Midnight',
  },
  {
    id: 'cintas-de-invierno',
    title: 'Cintas de Invierno',
    year: 2020,
    duration: '1h 33m',
    rating: '16+',
    match: 88,
    genres: ['Drama', 'Íntima'],
    mood: 'melancolico',
    tagline: 'Grabó su despedida en casete.',
    synopsis:
      'Un archivista clasifica las grabaciones caseras de una familia desaparecida y empieza a reconocer su propia voz de niño entre las cintas.',
    poster: POSTER_4,
    trailerKey: 'owXCx1ebfA0',
    badge: '',
  },
  {
    id: 'neon-abierto',
    title: 'Neón Abierto',
    year: 2024,
    duration: '1h 44m',
    rating: '16+',
    match: 89,
    genres: ['Acción', 'Cyberpunk'],
    mood: 'energico',
    tagline: 'La ciudad no duerme, tú tampoco.',
    synopsis:
      'Una carrera clandestina se convierte en cacería cuando el premio deja de ser dinero y empieza a ser el mapa de la red eléctrica de la ciudad.',
    poster: POSTER_2,
    trailerKey: 'z6aMAPndP8Q',
    badge: '',
  },
  {
    id: 'postal-de-agosto',
    title: 'Postal de Agosto',
    year: 2019,
    duration: '1h 29m',
    rating: '7+',
    match: 86,
    genres: ['Nostalgia', 'Familiar'],
    mood: 'nostalgico',
    tagline: 'Volver al pueblo, veinte años después.',
    synopsis:
      'Una fotógrafa regresa al pueblo donde pasó todos sus veranos para vender la casa familiar y termina reconstruyendo un álbum que nunca se terminó.',
    poster: POSTER_3,
    trailerKey: '6ntUefWpN40',
    badge: '',
  },
  {
    id: 'faro-mudo',
    title: 'Faro Mudo',
    year: 2022,
    duration: '1h 58m',
    rating: '16+',
    match: 87,
    genres: ['Contemplativa', 'Misterio'],
    mood: 'reflexivo',
    tagline: 'Dos meses, una sola voz.',
    synopsis:
      'Un guardafaro acepta un turno de dos meses en total aislamiento y comienza a escribir cartas a alguien que quizá nunca existió.',
    poster: POSTER_7,
    trailerKey: 'gHcmaoysGMI',
    badge: '',
  },
]

export function getMood(id) {
  return moods.find((m) => m.id === id)
}

export function recommendationsFor(moodId) {
  if (!moodId) return []
  const own = movies.filter((m) => m.mood === moodId)
  const others = movies.filter((m) => m.mood !== moodId).slice(0, 4)
  return [...own, ...others]
}