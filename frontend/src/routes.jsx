// routes.jsx
// Guardas de ruta para el ruteo de la app.
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Login from './Login.jsx'
import Register from './Register.jsx'
import ForgotPassword from './ForgotPassword.jsx'
import App from './App.jsx'

// Protege rutas: si no hay sesión, redirige a /login recordando el origen.
export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}

// Si ya hay sesión, /login y /register redirigen a /welcome.
export function LoginRoute() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/welcome" replace />
  return <Login />
}

export function RegisterRoute() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/welcome" replace />
  return <Register />
}

// Si ya hay sesión, /forgot-password redirige a /welcome.
export function ForgotPasswordRoute() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/welcome" replace />
  return <ForgotPassword />
}

// La página principal protegida.
export function WelcomeRoute() {
  return (
    <ProtectedRoute>
      <App />
    </ProtectedRoute>
  )
}
