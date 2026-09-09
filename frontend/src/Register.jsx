// Register.jsx
// Pantalla de registro (/register), para crear nueva cuenta.
import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { validateLogin, allFieldsComplete } from './loginSchema'
import { SparklesIcon } from './icons'

const EMPTY = { username: '', password: '' }

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

  const canSubmit = useMemo(() => allFieldsComplete(values), [values])

  function handleChange(event) {
    const { name, value } = event.target
    const next = { ...values, [name]: value }
    setValues(next)
    setAuthError('')

    if (touched[name]) {
      const result = validateLogin(next)
      setErrors(result.success ? {} : result.errors)
    }
  }

  function handleBlur(event) {
    const { name } = event.target
    setTouched((t) => ({ ...t, [name]: true }))
    const result = validateLogin(values)
    setErrors(result.success ? {} : result.errors)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setTouched({ username: true, password: true })

    const result = validateLogin(values)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      })
      const data = await res.json()

      if (!data.ok) {
        setAuthError(data.error || 'Error al registrar')
        setLoading(false)
        return
      }

      // Auto-login después de registrar
      const loginOutcome = await login(result.data.username, result.data.password)
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
            Midnight<span className="brand-dim"> Cinema & Mood</span>
          </span>
        </div>

        <h1 id="auth-title" className="auth-title">
          Crear cuenta
        </h1>
        <p className="auth-sub">
          Regístrate para descubrir cine curado según tu estado de ánimo.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="username" className="field-label">
              Usuario
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              className={`field-input${errors.username ? ' field-input--error' : ''}`}
              value={values.username}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? 'username-error' : undefined}
              placeholder="mín. 3 caracteres"
              disabled={loading}
            />
            {errors.username ? (
              <p id="username-error" className="field-error" role="alert">
                {errors.username}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="password" className="field-label">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              className={`field-input${errors.password ? ' field-input--error' : ''}`}
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              placeholder="mín. 6 caracteres"
              disabled={loading}
            />
            {errors.password ? (
              <p id="password-error" className="field-error" role="alert">
                {errors.password}
              </p>
            ) : null}
          </div>

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