// loginSchema.js
// Esquema de validación Zod para el formulario de login.
//
// Reglas por campo (usuario y contraseña):
//   - Alfanumérico: solo letras y dígitos (sin espacios ni especiales).
//   - Sin 3 o más caracteres repetidos consecutivos (p. ej. "aaa", "111").
// Regla global:
//   - Todos los campos deben estar completos para poder avanzar.
import { z } from 'zod'

// Detecta 3+ caracteres iguales consecutivos.
const THREE_CONSECUTIVE = /(.)\1\1/
// Solo alfanumérico (sin espacios ni caracteres especiales).
const ALPHANUMERIC = /^[a-zA-Z0-9]+$/

/**
 * Genera un validador de campo reutilizable con las reglas compartidas.
 * @param {string} label Etiqueta legible del campo (para los mensajes).
 */
function credentialField(label) {
  return z
    .string({ error: `El ${label} es obligatorio.` })
    // Campo completo (regla global aplicada por campo): no vacío.
    .min(1, { error: `El ${label} no puede estar vacío.` })
    // Sin espacios ni caracteres especiales -> alfanumérico.
    .regex(ALPHANUMERIC, {
      error: `El ${label} solo admite caracteres alfanuméricos (sin espacios ni símbolos).`,
    })
    // Sin 3+ caracteres repetidos consecutivos.
    .refine((val) => !THREE_CONSECUTIVE.test(val), {
      error: `El ${label} no puede tener 3 o más caracteres repetidos consecutivos.`,
    })
}

export const loginSchema = z.object({
  username: credentialField('usuario'),
  password: credentialField('contraseña'),
})

/**
 * Valida los datos del formulario.
 * @returns {{success: true, data: {username, password}} |
 *           {success: false, errors: Record<string,string>}}
 */
export function validateLogin(values) {
  const result = loginSchema.safeParse(values)
  if (result.success) {
    return { success: true, data: result.data }
  }
  // Aplana los issues a un mapa campo -> primer mensaje.
  const errors = {}
  for (const issue of result.error.issues) {
    const key = issue.path[0]
    if (key && !errors[key]) errors[key] = issue.message
  }
  return { success: false, errors }
}

/**
 * Regla global de "todos los campos completos": indica si el formulario
 * puede avanzar (habilitar el botón). No revela mensajes concretos, solo
 * si es posible enviar.
 */
export function allFieldsComplete(values) {
  return Boolean(values.username?.trim()) && Boolean(values.password?.trim())
}
