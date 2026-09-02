import { moods } from './data'

export default function MoodPicker({ value, onChange }) {
  return (
    <div
      role="radiogroup"
      aria-label="¿Cómo te sientes hoy?"
      className="mood-grid"
    >
      {moods.map((mood) => {
        const selected = value === mood.id
        return (
          <button
            key={mood.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(mood.id)}
            style={{ '--mood': mood.accent }}
            className="mood-card"
          >
            <span
              aria-hidden="true"
              className="mood-glow"
              style={selected ? { opacity: 1 } : undefined}
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