// Importa el SVG como texto crudo (característica nativa de Vite).
import rawSvg from './assets/palomitas.svg?raw'

// viewBox original del archivo (no traía uno propio).
const VIEW_W = 1535
const VIEW_H = 1538

// Factor de compresión vertical para que el dibujo no se vea "estirado".
// 1 = sin cambios, <1 comprime en el eje Y.
const SCALE_Y = 0.92

// Degradado alusivo a la medianoche (azul profundo -> violeta -> índigo).
const GRADIENT_ID = 'palomitas-midnight'
const gradientDefs = `
  <defs>
    <linearGradient id="${GRADIENT_ID}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#c7d2fe" />
      <stop offset="45%" stop-color="#818cf8" />
      <stop offset="100%" stop-color="#312e81" />
    </linearGradient>
  </defs>
`

// Normaliza el markup una sola vez (a nivel de módulo):
// 1. Quita la declaración XML y los comentarios del generador.
// 2. Garantiza que exista un viewBox para que el SVG escale correctamente.
// 3. Inyecta el degradado y envuelve el contenido en un <g> comprimido en Y.
// 4. Reemplaza el color plano (currentColor) por el degradado.
const normalizedSvg = (() => {
  let svg = rawSvg
    .replace(/<\?xml[^>]*\?>/i, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim()

  // Asegura viewBox.
  svg = svg.replace(/<svg([^>]*?)>/i, (match, attrs) =>
    /viewBox=/i.test(attrs)
      ? `<svg${attrs}>`
      : `<svg${attrs} viewBox="0 0 ${VIEW_W} ${VIEW_H}">`,
  )

  // Todos los rellenos usan el degradado.
  svg = svg.replace(/fill="currentColor"/g, `fill="url(#${GRADIENT_ID})"`)

  // Compresión vertical centrada: escala en Y y recentra el contenido.
  const translateY = ((1 - SCALE_Y) * VIEW_H) / 2
  const openTag = svg.match(/<svg[^>]*>/i)[0]
  const inner = svg
    .slice(openTag.length, svg.lastIndexOf('</svg>'))
    .trim()

  return (
    openTag +
    gradientDefs +
    `<g transform="translate(0 ${translateY}) scale(1 ${SCALE_Y})">` +
    inner +
    `</g>` +
    `</svg>`
  )
})()

/**
 * Icono de palomitas renderizado inline como SVG, con degradado "medianoche"
 * y ligera compresión vertical para evitar que se vea estirado.
 */
export default function PalomitasIcon({
  className,
  title = 'Palomitas de cine',
  ...rest
}) {
  return (
    <span
      className={className}
      role="img"
      aria-label={title}
      dangerouslySetInnerHTML={{ __html: normalizedSvg }}
      {...rest}
    />
  )
}
