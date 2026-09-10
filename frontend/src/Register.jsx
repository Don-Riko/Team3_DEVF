// Register.jsx
// Pantalla de registro (/register): formulario clásico completo validado con Zod
// (nombre, apellidos, celular MX, correo, contraseña + confirmación/repetidor).
//
// El backend persiste el perfil completo vía POST /api/register. El username se
// deriva de la parte local del correo.
import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { validateRegister, allRegisterFieldsComplete } from './registerSchema'
import { SparklesIcon } from './icons'

const EMPTY = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
}

// Campos a renderizar en orden, con su metadata de presentación.
const FIELDS = [
  { name: 'firstName', label: 'Nombre', type: 'text', autoComplete: 'given-name', placeholder: 'p. ej. Ana' },
  { name: 'lastName', label: 'Apellidos', type: 'text', autoComplete: 'family-name', placeholder: 'p. ej. Pérez López' },
  { name: 'phone', label: 'Celular', type: 'tel', autoComplete: 'tel', placeholder: 'p. ej. 5512345678' },
  { name: 'email', label: 'Correo', type: 'email', autoComplete: 'email', placeholder: 'p. ej. ana@correo.com' },
  { name: 'password', label: 'Contraseña', type: 'password', autoComplete: 'new-password', placeholder: 'mín. 6 caracteres' },
  { name: 'confirmPassword', label: 'Confirmar contraseña', type: 'password', autoComplete: 'new-password', placeholder: 'repite tu contraseña' },
]

export default function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = location.state?.from ?? '/welcome'

  const canSubmit = useMemo(() => allRegisterFieldsComplete(values), [values])

  function handleChange(event) {
    const { name, value } = event.target
    const next = { ...values, [name]: value }
    setValues(next)
    setAuthError('')

    if (touched[name]) {
      const result = validateRegister(next)
      setErrors(result.success ? {} : result.errors)
    }
  }

  function handleBlur(event) {
    const { name } = event.target
    setTouched((t) => ({ ...t, [name]: true }))
    const result = validateRegister(values)
    setErrors(result.success ? {} : result.errors)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setTouched(
      FIELDS.reduce((acc, f) => ({ ...acc, [f.name]: true }), {}),
    )

    const result = validateRegister(values)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    setLoading(true)

    // El backend ahora persiste el perfil completo. El username se deriva de la
    // parte local del correo (el backend valida unicidad de username y email).
    const username = result.data.email.split('@')[0]
    const payload = {
      username,
      password: result.data.password,
      firstName: result.data.firstName,
      lastName: result.data.lastName,
      phone: result.data.phone,
      email: result.data.email,
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!data.ok) {
        setAuthError(data.error || 'Error al registrar')
        setLoading(false)
        return
      }

      const loginOutcome = await login(username, result.data.password)
      if (loginOutcome.ok) {
        navigate(from, { replace: true })
      } else {
        setAuthError('Registro OK, pero error al iniciar sesión automáticamente')
        setLoading(false)
      }
    } catch {
      setAuthError('Error de conexión')
      setLoading(false)
    }
  }

  return (
    <main className="auth-screen grain">
      <div aria-hidden="true" className="auth-bg--fade" />
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand">
          <span aria-hidden="true" className="brand-mark">
            <SparklesIcon size={16} />
          </span>
          <span className="brand-text">
            Midnight<span className="brand-dim"> Cinema &amp; Mood</span>
          </span>
        </div>

        <h1 id="auth-title" className="auth-title">
          Crear cuenta
        </h1>
        <p className="auth-sub">
          Regístrate para descubrir cine curado según tu estado de ánimo.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {FIELDS.map((field) => (
            <div className="field" key={field.name}>
              <label htmlFor={field.name} className="field-label">
                {field.label}
              </label>
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                autoComplete={field.autoComplete}
                className={`field-input${errors[field.name] ? ' field-input--error' : ''}`}
                value={values[field.name]}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(errors[field.name])}
                aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                placeholder={field.placeholder}
                disabled={loading}
              />
              {errors[field.name] ? (
                <p id={`${field.name}-error`} className="field-error" role="alert">
                  {errors[field.name]}
                </p>
              ) : null}
            </div>
          ))}

          {authError ? (
            <p className="auth-error" role="alert">
              {authError}
            </p>
          ) : null}

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={!canSubmit || loading}
          >
            {loading ? 'Creando...' : 'Registrarse'}
          </button>
        </form>

        <p className="auth-switch">
          ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
        </p>
      </section>
    </main>
  )
}
