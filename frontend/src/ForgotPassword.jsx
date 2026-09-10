// ForgotPassword.jsx
// Pantalla de recuperación de contraseña (/forgot-password).
//
// NOTA DE ALCANCE (Opción 1 - solo frontend): no existe servicio de correo ni
// endpoint de recuperación en el backend. El envío se simula mostrando un
// mensaje de confirmación tras validar el correo con Zod.
import { useMemo, useState } from 'react'
import { validateForgotPassword } from './forgotPasswordSchema'
import { SparklesIcon } from './icons'

export default function ForgotPassword() {
  const [values, setValues] = useState({ email: '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [sent, setSent] = useState(false)

  const canSubmit = useMemo(() => Boolean(values.email?.trim()), [values])

  function handleChange(event) {
    const { name, value } = event.target
    const next = { ...values, [name]: value }
    setValues(next)
    if (touched[name]) {
      const result = validateForgotPassword(next)
      setErrors(result.success ? {} : result.errors)
    }
  }

  function handleBlur(event) {
    const { name } = event.target
    setTouched((t) => ({ ...t, [name]: true }))
    const result = validateForgotPassword(values)
    setErrors(result.success ? {} : result.errors)
  }

  function handleSubmit(event) {
    event.preventDefault()
    setTouched({ email: true })
    const result = validateForgotPassword(values)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    // Simulación de envío (sin backend de correo en Opción 1).
    setSent(true)
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
          Recuperar contraseña
        </h1>

        {sent ? (
          <>
            <p className="auth-sub">
              Si <strong>{values.email}</strong> está registrado, te enviamos
              instrucciones para restablecer tu contraseña. Revisa tu bandeja de
              entrada y la carpeta de spam.
            </p>
            <p className="auth-switch">
              <a href="/login">Volver a iniciar sesión</a>
            </p>
          </>
        ) : (
          <>
            <p className="auth-sub">
              Ingresa el correo de tu cuenta y te enviaremos instrucciones para
              recuperar el acceso.
            </p>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label htmlFor="email" className="field-label">
                  Correo
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`field-input${errors.email ? ' field-input--error' : ''}`}
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  placeholder="p. ej. ana@correo.com"
                />
                {errors.email ? (
                  <p id="email-error" className="field-error" role="alert">
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                className="btn btn-primary auth-submit"
                disabled={!canSubmit}
              >
                Enviar instrucciones
              </button>
            </form>

            <p className="auth-switch">
              ¿Recordaste tu contraseña? <a href="/login">Inicia sesión</a>
            </p>
          </>
        )}
      </section>
    </main>
  )
}
