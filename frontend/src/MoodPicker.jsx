import { useState } from 'react'
import { moods } from './data'

export default function MoodPicker({ value, onChange, themed = false }) {
  const [hovered, setHovered] = useState(null)

  return (
    <div
      role="radiogroup"
      aria-label="¿Cómo te sientes hoy?"
      className="mood-grid"
    >
      {moods.map((mood) => {
        const selected = value === mood.id
        const isHovered = hovered === mood.id
        // El glyph se muestra si el card está en hover o seleccionado.
        const showGlyph = isHovered || selected

        const handlePointer = (event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const mx = (event.clientX - rect.left) / rect.width
          event.currentTarget.style.setProperty('--mx', String(mx))
        }
        const handleEnter = () => setHovered(mood.id)
        const handleLeave = (event) => {
          event.currentTarget.style.removeProperty('--mx')
          setHovered((current) => (current === mood.id ? null : current))
        }

        return (
          <button
            key={mood.id}
            type="button"
            role="radio"
            aria-checked={selected}
            data-glyph={showGlyph ? 'in' : 'out'}
            data-hint={selected ? 'in' : 'out'}
            onClick={() => onChange(mood.id)}
            onMouseEnter={handleEnter}
            onMouseMove={handlePointer}
            onMouseLeave={handleLeave}
            style={{ '--mood': mood.accent }}
            className={`mood-card${themed ? ' mood-card--themed' : ''}`}
          >
            <span
              aria-hidden="true"
              className="mood-glow"
              style={selected ? { opacity: 1 } : undefined}
            />
            <span
              aria-hidden="true"
              className="mood-shine"
            />
            <span className="mood-row">
              <span
                aria-hidden="true"
                className="mood-glyph"
              >
                {mood.glyph}
              </span>
              <span className="min-w-0">
                <span className="mood-label">{mood.label}</span>
                <span className="mood-hint">{mood.hint}</span>
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
