// ForgotPassword.jsx
// Pantalla de recuperación de contraseña (/forgot-password).
//
// Flujo (MVP, Opción 2 sin servicio de correo):
//   1) El usuario ingresa su correo -> POST /api/forgot-password.
//      El backend responde ok siempre (no revela si el correo existe) y, para
//      poder probar el flujo, devuelve resetToken cuando el correo sí existe.
//   2) Si hay token, se muestra el paso para definir la nueva contraseña ->
//      POST /api/reset-password { token, password }.
import { useMemo, useState } from 'react'
import { validateForgotPassword } from './forgotPasswordSchema'
import { SparklesIcon } from './icons'

const ALPHANUMERIC = /^[a-zA-Z0-9]+$/
const THREE_CONSECUTIVE = /(.)\1\1/

function validateNewPassword(password, confirm) {
  if (!password) return 'La contraseña es obligatoria.'
  if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
  if (!ALPHANUMERIC.test(password)) return 'La contraseña solo admite caracteres alfanuméricos.'
  if (THREE_CONSECUTIVE.test(password)) return 'No puede tener 3 o más caracteres repetidos consecutivos.'
  if (password !== confirm) return 'Las contraseñas no coinciden.'
  return ''
}

export default function ForgotPassword() {
  // Paso 1: solicitud por correo.
  const [values, setValues] = useState({ email: '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [requesting, setRequesting] = useState(false)
  const [requestError, setRequestError] = useState('')

  // Paso 2: reseteo con token.
  const [resetToken, setResetToken] = useState('')
  const [pw, setPw] = useState({ password: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [resetting, setResetting] = useState(false)
  const [done, setDone] = useState(false)

  const canSubmitEmail = useMemo(() => Boolean(values.email?.trim()), [values])
  const canSubmitPw = useMemo(() => Boolean(pw.password) && Boolean(pw.confirm), [pw])

  function handleChange(event) {
    const { name, value } = event.target
    const next = { ...values, [name]: value }
    setValues(next)
    setRequestError('')
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

  async function handleRequest(event) {
    event.preventDefault()
    setTouched({ email: true })
    const result = validateForgotPassword(values)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    setRequesting(true)
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: result.data.email }),
      })
      const data = await res.json()
      if (!data.ok) {
        setRequestError(data.error || 'No se pudo procesar la solicitud.')
        setRequesting(false)
        return
      }
      // MVP: si el backend devuelve el token, pasamos al paso de reseteo.
      if (data.resetToken) {
        setResetToken(data.resetToken)
      } else {
        // Correo no registrado: mismo mensaje neutro, sin avanzar.
        setRequestError('Si el correo existe, se enviaron instrucciones para recuperarlo.')
      }
      setRequesting(false)
    } catch {
      setRequestError('Error de conexión.')
      setRequesting(false)
    }
  }

  async function handleReset(event) {
    event.preventDefault()
    const msg = validateNewPassword(pw.password, pw.confirm)
    if (msg) {
      setPwError(msg)
      return
    }
    setPwError('')
    setResetting(true)
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: pw.password }),
      })
      const data = await res.json()
      if (!data.ok) {
        setPwError(data.error || 'No se pudo actualizar la contraseña.')
        setResetting(false)
        return
      }
      setDone(true)
    } catch {
      setPwError('Error de conexión.')
      setResetting(false)
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
          Recuperar contraseña
        </h1>

        {done ? (
          <>
            <p className="auth-sub">
              Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión
              con tu nueva contraseña.
            </p>
            <p className="auth-switch">
              <a href="/login">Ir a iniciar sesión</a>
            </p>
          </>
        ) : resetToken ? (
          <>
            <p className="auth-sub">Define tu nueva contraseña.</p>
            <form className="auth-form" onSubmit={handleReset} noValidate>
              <div className="field">
                <label htmlFor="new-password" className="field-label">
                  Nueva contraseña
                </label>
                <input
                  id="new-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  className={`field-input${pwError ? ' field-input--error' : ''}`}
                  value={pw.password}
                  onChange={(e) => { setPw((p) => ({ ...p, password: e.target.value })); setPwError('') }}
                  placeholder="mín. 6 caracteres"
                  disabled={resetting}
                />
              </div>
              <div className="field">
                <label htmlFor="confirm-password" className="field-label">
                  Confirmar contraseña
                </label>
                <input
                  id="confirm-password"
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  className={`field-input${pwError ? ' field-input--error' : ''}`}
                  value={pw.confirm}
                  onChange={(e) => { setPw((p) => ({ ...p, confirm: e.target.value })); setPwError('') }}
                  placeholder="repite tu contraseña"
                  disabled={resetting}
                />
                {pwError ? (
                  <p className="field-error" role="alert">{pwError}</p>
                ) : null}
              </div>
              <button
                type="submit"
                className="btn btn-primary auth-submit"
                disabled={!canSubmitPw || resetting}
              >
                {resetting ? 'Actualizando...' : 'Cambiar contraseña'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="auth-sub">
              Ingresa el correo de tu cuenta y te enviaremos instrucciones para
              recuperar el acceso.
            </p>
            <form className="auth-form" onSubmit={handleRequest} noValidate>
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
                  disabled={requesting}
                />
                {errors.email ? (
                  <p id="email-error" className="field-error" role="alert">
                    {errors.email}
                  </p>
                ) : null}
              </div>

              {requestError ? (
                <p className="auth-error" role="alert">{requestError}</p>
              ) : null}

              <button
                type="submit"
                className="btn btn-primary auth-submit"
                disabled={!canSubmitEmail || requesting}
              >
                {requesting ? 'Enviando...' : 'Enviar instrucciones'}
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
