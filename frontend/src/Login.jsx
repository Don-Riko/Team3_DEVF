// Login.jsx
// Pantalla de login (/login), previa a la página principal (/welcome).
import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { validateLogin, allFieldsComplete } from './loginSchema'
import { SparklesIcon } from './icons'

const EMPTY = { username: '', password: '' }

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [authError, setAuthError] = useState('')

  // A dónde volver tras iniciar sesión (o /welcome por defecto).
  const from = location.state?.from ?? '/welcome'

  // Regla global: habilitar el botón solo con todos los campos completos.
  const canSubmit = useMemo(() => allFieldsComplete(values), [values])

  function handleChange(event) {
    const { name, value } = event.target
    const next = { ...values, [name]: value }
    setValues(next)
    setAuthError('')

    // Validación en vivo solo de campos ya tocados.
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

    const outcome = await login(result.data.username, result.data.password)
    if (!outcome.ok) {
      setAuthError(outcome.error || 'Usuario o contraseña incorrectos.')
      return
    }
    navigate(from, { replace: true })
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
          Inicia sesión
        </h1>
        <p className="auth-sub">
          Accede para descubrir cine curado según tu estado de ánimo.
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
              placeholder="p. ej. Admin"
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
              autoComplete="current-password"
              className={`field-input${errors.password ? ' field-input--error' : ''}`}
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              placeholder="••••••••"
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
            disabled={!canSubmit}
          >
            Entrar
          </button>
        </form>
      </section>
    </main>
  )
}
