import { useEffect, useState } from 'react'
import { Camera, History, LayoutDashboard, LogOut, Map as MapIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import logoUsina from '../assets/logo-usina-dourada.png'
import CameraOperador from '../components/CameraOperador'
import CameraMap from '../components/CameraMap'
import EventosOperador from '../components/EventosOperador'
import ClimaOperador from '../components/ClimaOperador'
import '../styles/operator-dashboard.css'

// Navegação: cada opção controla apenas a apresentação dos painéis.
const PAGINAS = [
  { id: 'visao-geral', nome: 'Visão geral', icone: LayoutDashboard },
  { id: 'camera', nome: 'Câmera', icone: Camera },
  { id: 'mapa', nome: 'Mapa', icone: MapIcon },
  { id: 'historico', nome: 'Histórico de alertas', icone: History },
]
const FORMATO_DATA = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short', timeStyle: 'medium',
})

/** Recupera o nome exibido na sessão; a autorização permanece na API. */
function lerUsuario() {
  try {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')
    return usuario?.name || usuario?.username || 'Operador'
  } catch {
    return 'Operador'
  }
}

/** Relógio isolado para não renderizar o mapa a cada segundo. */
function RelogioOperador() {
  const [agora, setAgora] = useState(() => new Date())

  useEffect(() => {
    const intervalo = window.setInterval(() => setAgora(new Date()), 1000)
    return () => window.clearInterval(intervalo)
  }, [])

  return <time dateTime={agora.toISOString()}>{FORMATO_DATA.format(agora)}</time>
}

/** Operação: câmera, ações de alertas e mapa; histórico em uma aba própria. */
export default function Operador() {
  const navegar = useNavigate()
  const [pagina, setPagina] = useState('visao-geral')
  const [usuario] = useState(lerUsuario)

  // Exibe o retorno à administração apenas para o administrador do sistema.
  const [administradorSistema] = useState(() => {
    try {
      const sessao = JSON.parse(localStorage.getItem('usuario') || 'null')
      return sessao?.is_system_admin === true
    } catch {
      return false
    }
  })


  function encerrarSessao() {
    localStorage.removeItem('usuario')
    navegar('/login', { replace: true })
  }

  return (
    <div className="operador">
      <aside className="operador__sidebar">
        <div className="operador__marca">
          <img src={logoUsina} alt="" />
          <strong>Usina Santo Ângelo</strong>
        </div>

        <nav className="operador__menu" aria-label="Navegação do operador">
          {PAGINAS.map(({ id, nome, icone: Icone }) => (
            <button
              key={id}
              type="button"
              aria-pressed={pagina === id}
              onClick={() => setPagina(id)}
            >
              <Icone size={18} strokeWidth={1.5} aria-hidden="true" />
              {nome}
            </button>
          ))}
        </nav>

        {administradorSistema && (
          <button
            className="operador__voltar-tecnico"
            type="button"
            onClick={() => navegar('/tecnico')}
          >
            Voltar ao técnico
          </button>
        )}

        <button className="operador__sair" type="button" onClick={encerrarSessao}>
          <LogOut size={18} aria-hidden="true" /> Sair
        </button>
      </aside>

      <main className="operador__principal">
        <header className="operador__cabecalho">
          <div>
            <h1>Sistema de Detecção de Incêndio</h1>
            <p>Monitoramento da reserva</p>
          </div>
          <div className="operador__sessao">
            <ClimaOperador />
            <RelogioOperador />
            <strong>{usuario}</strong>
          </div>
        </header>

        <div className="operador__paineis" data-pagina={pagina}>
          <section className="operador__painel operador__painel-camera" hidden={!['visao-geral', 'camera'].includes(pagina)} aria-label="Câmera">
            <CameraOperador ativa={['visao-geral', 'camera'].includes(pagina)} />
          </section>
          <section className="operador__painel operador__painel-eventos" hidden={!['visao-geral', 'historico'].includes(pagina)} aria-label={pagina === 'historico' ? 'Histórico de alertas' : 'Alertas ativos'}>
            <EventosOperador
              ativo={['visao-geral', 'historico'].includes(pagina)}
              historico={pagina === 'historico'}
              abrirHistorico={() => setPagina('historico')}
            />
          </section>
          <section className="operador__painel operador__painel-mapa" hidden={!['visao-geral', 'mapa'].includes(pagina)} aria-label="Mapa da reserva">
            <CameraMap ativa={['visao-geral', 'mapa'].includes(pagina)} />
          </section>
        </div>
      </main>
    </div>
  )
}
