// forgotPasswordSchema.js
// Esquema de validación Zod para el formulario de recuperación de contraseña.
// Solo requiere un correo electrónico válido.
import { z } from 'zod'

export const forgotPasswordSchema = z.object({
  email: z
    .string({ error: 'El correo es obligatorio.' })
    .trim()
    .min(1, { error: 'El correo es obligatorio.' })
    .email({ error: 'Ingresa un correo electrónico válido.' }),
})

export function validateForgotPassword(values) {
  const result = forgotPasswordSchema.safeParse(values)
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
