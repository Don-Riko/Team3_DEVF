// Register.jsx
// Pantalla de registro (/register): formulario clásico completo validado con Zod
// (nombre, apellidos, celular MX, correo, contraseña + confirmación/repetidor).
//
// UX:
//   - Feedback en vivo por campo: mensaje de error o de éxito, o ninguno si está vacío.
//   - Botón con efecto de click (CSS) y spinner mientras procesa.
//   - Pantalla post-registro que muestra el USERNAME asignado (para saber cómo
//     iniciar sesión a futuro) y el nombre del usuario.
//
// El backend persiste el perfil completo vía POST /api/register. El username se
// deriva de la parte local del correo (se conserva ese criterio).
import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import {
  validateRegister,
  validateRegisterField,
  allRegisterFieldsComplete,
} from './registerSchema'
import { SparklesIcon } from './icons'

const EMPTY = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
}

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
  // Estado de presentación por campo: { status: 'empty'|'valid'|'error', message }.
  const [hints, setHints] = useState({})
  const [touched, setTouched] = useState({})
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  // Datos del registro exitoso para la pantalla post-registro.
  const [registered, setRegistered] = useState(null)

  const from = location.state?.from ?? '/welcome'

  const canSubmit = useMemo(() => allRegisterFieldsComplete(values), [values])

  // Recalcula el hint de un campo (y del campo dependiente confirmPassword).
  function refreshHint(name, nextValues) {
    setHints((prev) => {
      const updated = { ...prev, [name]: validateRegisterField(name, nextValues) }
      // Si cambia password y confirm ya fue tocado, re-evalúa la coincidencia.
      if (name === 'password' && touched.confirmPassword) {
        updated.confirmPassword = validateRegisterField('confirmPassword', nextValues)
      }
      return updated
    })
  }

  function handleChange(event) {
    const { name, value } = event.target
    const next = { ...values, [name]: value }
    setValues(next)
    setAuthError('')
    // Feedback en vivo: solo tras el primer blur del campo, para no marcar error
    // mientras el usuario aún escribe el primer carácter.
    if (touched[name]) refreshHint(name, next)
  }

  function handleBlur(event) {
    const { name } = event.target
    setTouched((t) => ({ ...t, [name]: true }))
    refreshHint(name, values)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setTouched(FIELDS.reduce((acc, f) => ({ ...acc, [f.name]: true }), {}))

    const result = validateRegister(values)
    if (!result.success) {
      // Refresca todos los hints para mostrar los errores restantes.
      const allHints = {}
      for (const f of FIELDS) allHints[f.name] = validateRegisterField(f.name, values)
      setHints(allHints)
      return
    }
    setLoading(true)

    const username = result.data.email.split('@')[0]
    const displayName = `${result.data.firstName} ${result.data.lastName}`.trim()
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

      // Muestra la pantalla post-registro con el username asignado.
      setRegistered({
        username: data.user?.username || username,
        displayName,
        password: result.data.password,
      })
      setLoading(false)
    } catch {
      setAuthError('Error de conexión')
      setLoading(false)
    }
  }

  // Inicia sesión con las credenciales recién creadas y entra a la app.
  async function handleContinue() {
    setLoading(true)
    const outcome = await login(registered.username, registered.password)
    if (outcome.ok) {
      navigate(from, { replace: true })
    } else {
      setAuthError('No se pudo iniciar sesión automáticamente. Usa tu usuario y contraseña en el login.')
      setLoading(false)
    }
  }

  // ---------- Pantalla post-registro ----------
  if (registered) {
    return (
      <main className="auth-screen grain">
        <div aria-hidden="true" className="auth-bg--fade" />
        <section className="auth-card" aria-labelledby="welcome-title">
          <div className="auth-brand">
            <span aria-hidden="true" className="brand-mark">
              <SparklesIcon size={16} />
            </span>
            <span className="brand-text">
              Midnight<span className="brand-dim"> Cinema &amp; Mood</span>
            </span>
          </div>

          <h1 id="welcome-title" className="auth-title">
            ¡Bienvenido, {registered.displayName}!
          </h1>
          <p className="auth-sub">
            Tu cuenta se creó correctamente. Guarda tu usuario: lo necesitarás
            para iniciar sesión a futuro.
          </p>

          <div className="register-summary">
            <span className="register-summary__label">Tu usuario</span>
            <strong className="register-summary__value">{registered.username}</strong>
          </div>

          {authError ? (
            <p className="auth-error" role="alert">{authError}</p>
          ) : null}

          <button
            type="button"
            className="btn btn-primary auth-submit"
            onClick={handleContinue}
            disabled={loading}
          >
            {loading ? <span className="btn-spinner" aria-hidden="true" /> : null}
            {loading ? 'Entrando...' : 'Entrar a la app'}
          </button>
        </section>
      </main>
    )
  }

  // ---------- Formulario de registro ----------
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
          {FIELDS.map((field) => {
            const hint = hints[field.name] || { status: 'empty', message: '' }
            const inputClass =
              `field-input${hint.status === 'error' ? ' field-input--error' : ''}` +
              `${hint.status === 'valid' ? ' field-input--valid' : ''}`
            return (
              <div className="field" key={field.name}>
                <label htmlFor={field.name} className="field-label">
                  {field.label}
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  className={inputClass}
                  value={values[field.name]}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={hint.status === 'error'}
                  aria-describedby={hint.message ? `${field.name}-hint` : undefined}
                  placeholder={field.placeholder}
                  disabled={loading}
                />
                {hint.status === 'error' ? (
                  <p id={`${field.name}-hint`} className="field-error" role="alert">
                    {hint.message}
                  </p>
                ) : hint.status === 'valid' ? (
                  <p id={`${field.name}-hint`} className="field-hint field-hint--valid">
                    {hint.message}
                  </p>
                ) : null}
              </div>
            )
          })}

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
            {loading ? <span className="btn-spinner" aria-hidden="true" /> : null}
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
