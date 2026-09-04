import { useEffect } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'

import Logs from './pages/Logs'

import Login from './pages/Login'
import Operador from './pages/Operador'
import Tecnico from './pages/Tecnico'
import Usuarios from './pages/Usuarios'
import Cameras from './pages/Cameras'
import Notificacoes from './pages/Notificacoes'


function TituloDaPagina() {
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === '/login') {
      document.title = 'Login'
    } else if (location.pathname.startsWith('/operador')) {
      document.title = 'Operador'
    } else if (location.pathname.startsWith('/tecnico')) {
      document.title = 'Técnico'
    } else {
      document.title = 'Sistema de Monitoramento'
    }
  }, [location.pathname])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <TituloDaPagina />
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/operador"
          element={<Operador />}
        />

        <Route
          path="/tecnico"
          element={<Tecnico />}
        />

        <Route
          path="/tecnico/usuarios"
          element={<Usuarios />}
        />

        <Route
          path="/tecnico/cameras"
          element={<Cameras />}
        />

        <Route
          path="/tecnico/notificacoes"
          element={<Notificacoes />}
        />

        <Route
          path="/tecnico/logs"
          element={<Logs />}
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
