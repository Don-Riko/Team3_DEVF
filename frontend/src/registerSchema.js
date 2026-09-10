// registerSchema.js
// Esquema de validación Zod para el formulario clásico de registro.
//
// Campos:
//   - firstName / lastName: solo letras (incluye acentos y ñ) y espacios.
//   - phone: celular mexicano de 10 dígitos (opcionalmente +52 / 52 al inicio).
//   - email: correo válido.
//   - password: alfanumérico, mín. 6, sin 3+ repetidos consecutivos.
//   - confirmPassword: debe coincidir con password (repetidor).
import { z } from 'zod'

// 3+ caracteres iguales consecutivos (p. ej. "aaa", "111").
const THREE_CONSECUTIVE = /(.)\1\1/
// Solo alfanumérico (password).
const ALPHANUMERIC = /^[a-zA-Z0-9]+$/
// Nombre/apellidos: letras (con acentos y ñ) y espacios.
const NAME_PATTERN = /^[a-zA-ZÀ-ÿñÑ\s]+$/
// Celular MX: 10 dígitos, con prefijo opcional +52 o 52.
const MX_MOBILE = /^(?:\+?52)?\d{10}$/

function nameField(label) {
  return z
    .string({ error: `El ${label} es obligatorio.` })
    .trim()
    .min(2, { error: `El ${label} debe tener al menos 2 caracteres.` })
    .max(50, { error: `El ${label} no puede exceder 50 caracteres.` })
    .regex(NAME_PATTERN, {
      error: `El ${label} solo admite letras y espacios.`,
    })
}

export const registerSchema = z
  .object({
    firstName: nameField('nombre'),
    lastName: nameField('apellido'),
    phone: z
      .string({ error: 'El teléfono es obligatorio.' })
      .trim()
      .refine((val) => MX_MOBILE.test(val.replace(/[\s-]/g, '')), {
        error: 'Ingresa un celular mexicano válido de 10 dígitos.',
      }),
    email: z
      .string({ error: 'El correo es obligatorio.' })
      .trim()
      .min(1, { error: 'El correo es obligatorio.' })
      .email({ error: 'Ingresa un correo electrónico válido.' }),
    password: z
      .string({ error: 'La contraseña es obligatoria.' })
      .min(6, { error: 'La contraseña debe tener al menos 6 caracteres.' })
      .regex(ALPHANUMERIC, {
        error: 'La contraseña solo admite caracteres alfanuméricos (sin espacios ni símbolos).',
      })
      .refine((val) => !THREE_CONSECUTIVE.test(val), {
        error: 'La contraseña no puede tener 3 o más caracteres repetidos consecutivos.',
      }),
    confirmPassword: z
      .string({ error: 'Confirma tu contraseña.' })
      .min(1, { error: 'Confirma tu contraseña.' }),
  })
  // Repetidor: la confirmación debe coincidir con la contraseña.
  .refine((data) => data.password === data.confirmPassword, {
    error: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

/**
 * Valida los datos del formulario de registro.
 * @returns {{success: true, data: object} |
 *           {success: false, errors: Record<string,string>}}
 */
export function validateRegister(values) {
  const result = registerSchema.safeParse(values)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const errors = {}
  for (const issue of result.error.issues) {
    const key = issue.path[0]
    if (key && !errors[key]) errors[key] = issue.message
  }
  return { success: false, errors }
}

/**
 * Regla global "todos los campos completos" para habilitar el botón.
 */
export function allRegisterFieldsComplete(values) {
  return (
    Boolean(values.firstName?.trim()) &&
    Boolean(values.lastName?.trim()) &&
    Boolean(values.phone?.trim()) &&
    Boolean(values.email?.trim()) &&
    Boolean(values.password?.trim()) &&
    Boolean(values.confirmPassword?.trim())
  )
}
