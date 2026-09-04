import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './AuthContext.jsx'
import { LoginRoute, WelcomeRoute } from './routes.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/welcome" element={<WelcomeRoute />} />
          {/* La raíz redirige a la página principal protegida. */}
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          {/* Cualquier otra ruta -> /welcome (y de ahí a /login si no hay sesión). */}
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
