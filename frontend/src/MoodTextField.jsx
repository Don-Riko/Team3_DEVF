// MoodTextField.jsx
// Campo conversacional de estado de ánimo con estados de UX progresivos:
//
//   0. Inicial: label + SparkleIcon apagado (sin foco/hover, sin texto).
//   1. Hover sin texto: placeholder animado con <TypingAnimation/> y leyenda
//      inferior "Escribe con tus palabras" con fade (blanco semitransparente).
//   2. Con texto: borde con efecto sparkles y SparkleIcon blanco/dorado pulsante.
//   3. Al ejecutar (Enter/click): SparkleIcon pulsante como loader; el ícono es
//      un botón seleccionable que responde a click/Enter.
//   4. Durante la ejecución: la leyenda inferior se vuelve un "logger mágico"
//      con mensajes centrados en la experiencia (loading/success/error/empty).
import { useState } from 'react'
import { SparklesIcon } from './icons'
import { TypingAnimation } from './components/TypingAnimation'

// Sugerencias que se escriben/borran en bucle como placeholder animado.
const TYPING_WORDS = [
  'Quiero ver algo tranquilo...',
  'Necesito reírme un rato...',
  'Dame algo de suspenso...',
  'Hoy me siento nostálgico...',
  'Algo que me haga pensar...',
]

// Mensajes del "logger mágico" según el estado de la búsqueda.
const LOGGER_MESSAGES = {
  loading: 'Estamos recopilando lo mejor para ti...',
  success: 'Tenemos justo lo que buscas...',
  error: 'Algo no salió bien, pero eso no significa que te quedarás con las manos vacías...',
  empty: 'Quizá no entendí bien lo que buscas, intentemos otra vez.',
}

export default function MoodTextField({ value, onChange, onSubmit, loading, status }) {
  const [hover, setHover] = useState(false)
  const [focused, setFocused] = useState(false)

  const hasText = Boolean(value?.trim())
  const isBusy = loading || status === 'loading'
  // El SparkleIcon se "activa" (dorado/pulsante) con texto o durante la búsqueda.
  const iconActive = hasText || isBusy
  // Placeholder animado solo en hover/foco cuando aún no hay texto.
  const showTypingPlaceholder = (hover || focused) && !hasText

  function triggerSearch() {
    if (!hasText || isBusy) return
    onSubmit(value)
  }

  return (
    <div className="mood-text-input">
      <label htmlFor="mood-text" className="visually-hidden">
        Describe cómo te sientes
      </label>

      <div
        className={
          'mood-text-shell' +
          (iconActive ? ' mood-text-shell--active' : '') +
          (isBusy ? ' mood-text-shell--busy' : '')
        }
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* Ícono/botón sparkle a la izquierda. Es botón solo cuando hay texto. */}
        <button
          type="button"
          className={
            'mood-text-spark' +
            (iconActive ? ' mood-text-spark--active' : '') +
            (isBusy ? ' mood-text-spark--busy' : '')
          }
          onClick={triggerSearch}
          disabled={!hasText || isBusy}
          aria-label="Iniciar búsqueda por estado de ánimo"
          tabIndex={hasText ? 0 : -1}
        >
          <SparklesIcon size={16} />
        </button>

        <input
          id="mood-text"
          type="text"
          className="mood-text-field"
          // Placeholder estático vacío cuando mostramos el animado encima.
          placeholder={showTypingPlaceholder ? '' : 'Quiero ver algo tranquilo, necesito reirme, dame suspenso...'}
          aria-label="Describe tu estado de ánimo con tus palabras"
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              triggerSearch()
            }
          }}
        />

        {/* Placeholder animado (solo en hover/foco sin texto). */}
        {showTypingPlaceholder ? (
          <span className="mood-text-typing" aria-hidden="true">
            <TypingAnimation
              words={TYPING_WORDS}
              loop
              typeSpeed={55}
              deleteSpeed={30}
              pauseDelay={1400}
              startOnView={false}
              showCursor
              cursorStyle="line"
            />
          </span>
        ) : null}
      </div>

      {/* Leyenda inferior / logger mágico. */}
      <div className="mood-text-legend" aria-live="polite">
        {status && status !== 'idle' ? (
          <span
            className={
              'mood-text-logger' +
              ` mood-text-logger--${status}` +
              (status === 'loading' ? ' mood-text-logger--pulse' : '')
            }
          >
            {LOGGER_MESSAGES[status]}
          </span>
        ) : showTypingPlaceholder ? (
          <span className="mood-text-hint-legend">Escribe con tus palabras</span>
        ) : null}
      </div>
    </div>
  )
}
