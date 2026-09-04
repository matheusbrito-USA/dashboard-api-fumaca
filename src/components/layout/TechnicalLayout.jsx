import {
  Bell,
  Camera,
  Gauge,
  LogOut,
  ScrollText,
  Users,
  Video,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import logoUsina from '../../assets/logo-usina-dourada.png'
import '../../styles/technical-layout.css'

const menuItems = [
  {
    label: 'Visão geral',
    to: '/tecnico',
    icon: Gauge,
    end: true,
  },
  {
    label: 'Usuários',
    to: '/tecnico/usuarios',
    icon: Users,
  },
  {
    label: 'Câmeras',
    to: '/tecnico/cameras',
    icon: Camera,
  },
  {
    label: 'Notificações',
    to: '/tecnico/notificacoes',
    icon: Bell,
  },
  {
    label: 'Logs e auditoria',
    to: '/tecnico/logs',
    icon: ScrollText,
  },
]

export default function TechnicalLayout({
  title,
  description,
  children,
}) {
  const navigate = useNavigate()

  return (
    <div className="technical-shell">
      <aside className="technical-sidebar">
        <div className="technical-brand">
          <img
            src={logoUsina}
            alt="Logo do sistema"
            className="technical-logo"
          />

          <div>
            <div className="technical-brand-name">
              Monitoramento
            </div>

            <div className="technical-brand-area">
              Área técnica
            </div>
          </div>
        </div>

        <div className="technical-menu-label">
          Gerenciamento
        </div>

        <nav className="technical-nav">
          {menuItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `technical-nav-item ${
                    isActive ? 'is-active' : ''
                  }`
                }
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="technical-sidebar-footer">
          <button
            type="button"
            className="technical-operator-button"
            onClick={() => navigate('/operador')}
          >
            <Video size={18} strokeWidth={1.8} />
            <span>Abrir painel do operador</span>
          </button>

          <button
            type="button"
            className="technical-logout-button"
            onClick={() => navigate('/login')}
          >
            <LogOut size={18} strokeWidth={1.8} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className="technical-main">
        <header className="technical-topbar">
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>

          <div className="technical-user">
            <span className="technical-status-dot" />

            <div>
              <strong>Técnico</strong>
              <span>Sessão ativa</span>
            </div>
          </div>
        </header>

        <main className="technical-content">
          {children}
        </main>
      </div>
    </div>
  )
}
