import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  Camera,
  CheckCircle2,
  Clock3,
  History,
  LayoutDashboard,
  LogOut,
  Map,
  Monitor,
  RefreshCw,
  Search,
  ShieldCheck,
  Video,
  XCircle,
  Zap,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import logoUsina from '../assets/logo-usina-dourada.png'
import CameraAoVivo from '../components/CameraAoVivo'
import CameraMap from '../components/CameraMap'

import '../App.css'
import '../styles/operator-dashboard.css'

const API_URL = 'http://localhost:8000'
const INTERVALO_ATUALIZACAO = 5000

const STATUS_LABELS = {
  CONFIRMED: {
    texto: 'Não resolvido',
    classe: 'status-alerta',
  },
  FALSO_POSITIVO: {
    texto: 'Monitorando',
    classe: 'status-medio',
  },
  RESOLVIDO: {
    texto: 'Resolvido',
    classe: 'status-ok',
  },
}

function formatarHora(data) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(data)
}

function formatarDataExtensa(data) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(data)
}

function formatarDataHora(valor) {
  if (!valor) return '—'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(valor))
}

function formatarHoraSomente(valor) {
  if (!valor) return '—'

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(valor))
}

function formatarConfianca(valor) {
  const numero = Number(valor)

  if (Number.isNaN(numero)) return '—'

  return `${Math.round(numero * 100)}%`
}

function barraConfianca(valor) {
  const numero = Number(valor)

  if (Number.isNaN(numero)) return 0

  return Math.max(0, Math.min(100, Math.round(numero * 100)))
}

async function getJson(url) {
  const resposta = await fetch(url)

  if (!resposta.ok) {
    throw new Error(`Falha em ${url}`)
  }

  return resposta.json()
}

export default function Operador() {
  const navigate = useNavigate()

  const [agora, setAgora] = useState(new Date())

  const [eventos, setEventos] = useState([])
  const [cameras, setCameras] = useState([])

  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [abaAtiva, setAbaAtiva] = useState('dashboard')

  const [statusSistema, setStatusSistema] = useState('Operacional')
  const [subStatusSistema, setSubStatusSistema] = useState('Todos os serviços normais')

  const [atualizandoId, setAtualizandoId] = useState(null)

  const usuarioLogado = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('usuario') || 'null')
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setAgora(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const carregarPainel = useCallback(async () => {
    try {
      const [resultadoEventos, resultadoCameras, resultadoHealth] =
        await Promise.allSettled([
          getJson(`${API_URL}/events`),
          getJson(`${API_URL}/cameras`),
          getJson(`${API_URL}/health`),
        ])

      if (resultadoEventos.status === 'fulfilled') {
        setEventos(Array.isArray(resultadoEventos.value) ? resultadoEventos.value : [])
      }

      if (resultadoCameras.status === 'fulfilled') {
        setCameras(Array.isArray(resultadoCameras.value) ? resultadoCameras.value : [])
      }

      if (resultadoHealth.status === 'fulfilled') {
        if (resultadoHealth.value?.status === 'ok') {
          setStatusSistema('Operacional')
          setSubStatusSistema('Todos os serviços normais')
        } else {
          setStatusSistema('Atenção')
          setSubStatusSistema('Verifique os serviços')
        }
      } else {
        setStatusSistema('Atenção')
        setSubStatusSistema('API indisponível')
      }

      if (
        resultadoEventos.status === 'rejected' &&
        resultadoCameras.status === 'rejected'
      ) {
        setErro('Não foi possível carregar os dados do painel.')
      } else {
        setErro('')
      }
    } catch (error) {
      console.error(error)
      setErro('Não foi possível carregar os dados do painel.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    let ativo = true

    async function inicializar() {
      if (!ativo) return
      await carregarPainel()
    }

    inicializar()

    const intervalo = setInterval(() => {
      carregarPainel()
    }, INTERVALO_ATUALIZACAO)

    return () => {
      ativo = false
      clearInterval(intervalo)
    }
  }, [carregarPainel])

  async function atualizarStatus(eventoId, novoStatus) {
    try {
      setAtualizandoId(eventoId)

      const resposta = await fetch(`${API_URL}/events/${eventoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: novoStatus,
        }),
      })

      if (!resposta.ok) {
        throw new Error('Falha ao atualizar evento')
      }

      await carregarPainel()
    } catch (error) {
      console.error(error)
      window.alert('Não foi possível atualizar o evento.')
    } finally {
      setAtualizandoId(null)
    }
  }

  function sair() {
    localStorage.removeItem('usuario')
    navigate('/login')
  }

  const eventosOrdenados = useMemo(() => {
    return [...eventos].sort((a, b) => {
      const dataA = new Date(a.detected_at || a.created_at || 0).getTime()
      const dataB = new Date(b.detected_at || b.created_at || 0).getTime()
      return dataB - dataA
    })
  }, [eventos])

  const eventosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    if (!termo) return eventosOrdenados

    return eventosOrdenados.filter((evento) => {
      const texto = [
        evento.id,
        evento.event_type,
        evento.status,
        evento.camera_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return texto.includes(termo)
    })
  }, [eventosOrdenados, busca])

  const alertasRecentes = useMemo(() => {
    return eventosOrdenados
      .filter((evento) => evento.status === 'CONFIRMED')
      .slice(0, 4)
  }, [eventosOrdenados])

  const resumo = useMemo(() => {
    const hoje = new Date()

    const eventosHoje = eventos.filter((evento) => {
      const data = new Date(evento.detected_at || evento.created_at || 0)

      return (
        data.getDate() === hoje.getDate() &&
        data.getMonth() === hoje.getMonth() &&
        data.getFullYear() === hoje.getFullYear()
      )
    }).length

    const alertasAtivos = eventos.filter(
      (evento) => evento.status === 'CONFIRMED'
    ).length

    const camerasOnline = cameras.filter(
      (camera) => camera.status === 'ONLINE'
    ).length

    const totalCameras = cameras.length || 0

    const percentualCameras =
      totalCameras > 0
        ? Math.round((camerasOnline / totalCameras) * 100)
        : 0

    return {
      camerasOnline,
      totalCameras,
      percentualCameras,
      alertasAtivos,
      eventosHoje,
    }
  }, [eventos, cameras])

  return (
    <div className="op-layout" data-view={abaAtiva}>

      <aside className="op-sidebar">
        <div className="op-brand">
          <img src={logoUsina} alt="Sistema" />
          <div>
            <strong>Sistema de</strong>
            <span>Detecção de Fumaça</span>
          </div>
        </div>

        <nav className="op-nav">
          <button
            type="button"
            className={abaAtiva === 'dashboard' ? 'active' : ''}
            onClick={() => setAbaAtiva('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={abaAtiva === 'monitoramento' ? 'active' : ''}
            onClick={() => setAbaAtiva('monitoramento')}
          >
            <Monitor size={18} />
            <span>Monitoramento</span>
          </button>

          <button
            type="button"
            className={abaAtiva === 'alertas' ? 'active' : ''}
            onClick={() => setAbaAtiva('alertas')}
          >
            <Bell size={18} />
            <span>Alertas</span>
            {resumo.alertasAtivos > 0 && (
              <small>{resumo.alertasAtivos}</small>
            )}
          </button>

          <button
            type="button"
            className={abaAtiva === 'historico' ? 'active' : ''}
            onClick={() => setAbaAtiva('historico')}
          >
            <History size={18} />
            <span>Histórico</span>
          </button>
        </nav>

        <div className="op-sidebar-status">
          <div className="dot" />
          <div>
            <strong>Sistema Online</strong>
            <span>Todos os serviços ativos</span>
          </div>
        </div>

        <button
          type="button"
          className="op-logout"
          onClick={sair}
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </aside>

      <main className="op-main">

        <header className="op-header">
          <h1>
            {abaAtiva === 'dashboard' && 'Dashboard'}
            {abaAtiva === 'monitoramento' && 'Monitoramento'}
            {abaAtiva === 'alertas' && 'Alertas'}
            {abaAtiva === 'historico' && 'Histórico de Eventos'}
          </h1>

          <div className="op-header-info">
            <span>Nublado</span>
            <i />
            <span>27°C</span>
            <i />
            <span>{formatarHora(agora)}</span>
            <i />
            <span className="op-date-text">
              {formatarDataExtensa(agora)}
            </span>
          </div>
        </header>

        <section className="op-summary-grid">

          <article className="op-summary-card">
            <div className="op-summary-icon green">
              <Camera size={24} />
            </div>

            <div>
              <p>Câmeras online</p>
              <strong>
                {resumo.camerasOnline} / {resumo.totalCameras}
              </strong>
              <span>{resumo.percentualCameras}% operacionais</span>
            </div>
          </article>

          <article className="op-summary-card">
            <div className="op-summary-icon red">
              <AlertTriangle size={24} />
            </div>

            <div>
              <p>Alertas ativos</p>
              <strong>{resumo.alertasAtivos}</strong>
              <span className="text-red">Requerem atenção</span>
            </div>
          </article>

          <article className="op-summary-card">
            <div className="op-summary-icon yellow">
              <Zap size={24} />
            </div>

            <div>
              <p>Eventos hoje</p>
              <strong>{resumo.eventosHoje}</strong>
              <span className="text-yellow">Atualização em tempo real</span>
            </div>
          </article>

          <article className="op-summary-card">
            <div className="op-summary-icon green">
              <ShieldCheck size={24} />
            </div>

            <div>
              <p>Status do sistema</p>
              <strong>{statusSistema}</strong>
              <span>{subStatusSistema}</span>
            </div>
          </article>

        </section>

        <section
          className={`op-content-grid ${
            abaAtiva === 'historico' ? 'op-hidden' : ''
          }`}
        >

          <article
            className={`op-panel op-camera-panel ${
              abaAtiva === 'dashboard' || abaAtiva === 'monitoramento'
                ? ''
                : 'op-hidden'
            }`}
          >
            <div className="op-panel-header">
              <div className="op-panel-title">
                <Video size={16} />
                <span>Câmera ao vivo</span>
              </div>

              <div className="op-live-badge">
                <span className="live-dot" />
                AO VIVO
              </div>
            </div>

            <div className="op-camera-content">
              <CameraAoVivo />
            </div>
          </article>

          <div
            className={`op-right-column ${
              abaAtiva === 'dashboard' || abaAtiva === 'alertas'
                ? ''
                : 'op-hidden'
            }`}
          >

            <article
              className={`op-panel op-map-panel ${
                abaAtiva === 'dashboard' ? '' : 'op-hidden'
              }`}
            >
              <div className="op-panel-header">
                <div className="op-panel-title">
                  <Map size={16} />
                  <span>Mapa da região</span>
                </div>

                <button
                  type="button"
                  className="op-link-btn"
                  onClick={carregarPainel}
                >
                  <RefreshCw size={14} />
                  Atualizar
                </button>
              </div>

              <div className="op-map-content">
                <CameraMap eventos={eventos} />
              </div>
            </article>

            <article
              className={`op-panel op-alert-panel ${
                abaAtiva === 'dashboard' || abaAtiva === 'alertas'
                  ? ''
                  : 'op-hidden'
              }`}
            >
              <div className="op-panel-header">
                <div className="op-panel-title">
                  <Bell size={16} />
                  <span>Alertas recentes</span>
                </div>

                <span className="op-link-text">
                  Ver todos
                </span>
              </div>

              <div className="op-alert-list">
                {carregando ? (
                  <div className="op-empty">
                    Carregando alertas...
                  </div>
                ) : alertasRecentes.length === 0 ? (
                  <div className="op-empty">
                    Nenhum alerta ativo.
                  </div>
                ) : (
                  alertasRecentes.map((evento) => (
                    <div
                      key={evento.id}
                      className="op-alert-item"
                    >
                      <div className="op-alert-left">
                        <AlertTriangle size={18} />
                        <div>
                          <strong>
                            {evento.event_type || 'Fumaça detectada'}
                          </strong>
                          <span>
                            {evento.camera_name || `Evento #${evento.id}`}
                          </span>
                        </div>
                      </div>

                      <div className="op-alert-right">
                        <small>
                          {formatarHoraSomente(
                            evento.detected_at
                          )}
                        </small>

                        <div className="op-mini-actions">
                          <button
                            type="button"
                            title="Falso positivo"
                            disabled={atualizandoId === evento.id}
                            onClick={() =>
                              atualizarStatus(
                                evento.id,
                                'FALSO_POSITIVO'
                              )
                            }
                          >
                            <XCircle size={14} />
                          </button>

                          <button
                            type="button"
                            title="Resolvido"
                            disabled={atualizandoId === evento.id}
                            onClick={() =>
                              atualizarStatus(
                                evento.id,
                                'RESOLVIDO'
                              )
                            }
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

          </div>

        </section>

        <section
          className={`op-panel op-history-panel ${
            abaAtiva === 'dashboard' || abaAtiva === 'historico'
              ? ''
              : 'op-hidden'
          }`}
        >
          <div className="op-panel-header history-header">
            <div className="op-panel-title">
              <Clock3 size={16} />
              <span>Histórico de eventos</span>
            </div>

            <div className="op-history-tools">
              <div className="op-search-box">
                <Search size={14} />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar evento, status ou câmera"
                />
              </div>

              <button
                type="button"
                className="op-link-btn"
                onClick={carregarPainel}
              >
                <RefreshCw size={14} />
                Atualizar
              </button>
            </div>
          </div>

          {erro && (
            <div className="op-error-bar">
              {erro}
            </div>
          )}

          <div className="op-history-table-wrap">
            <table className="op-history-table">
              <thead>
                <tr>
                  <th>Data / Hora</th>
                  <th>Tipo de evento</th>
                  <th>Local</th>
                  <th>Câmera</th>
                  <th>Confiança</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan="7" className="table-empty">
                      Carregando eventos...
                    </td>
                  </tr>
                ) : eventosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="table-empty">
                      Nenhum evento encontrado.
                    </td>
                  </tr>
                ) : (
                  eventosFiltrados.slice(0, 10).map((evento) => {
                    const status =
                      STATUS_LABELS[evento.status] || {
                        texto: evento.status || '—',
                        classe: '',
                      }

                    const porcentagem = barraConfianca(
                      evento.confidence
                    )

                    return (
                      <tr key={evento.id}>
                        <td>
                          {formatarDataHora(
                            evento.detected_at || evento.created_at
                          )}
                        </td>

                        <td>
                          <div className="event-type-cell">
                            <span className={`event-dot ${status.classe}`} />
                            <span>
                              {evento.event_type || 'Fumaça detectada'}
                            </span>
                          </div>
                        </td>

                        <td>{evento.location || 'Área monitorada'}</td>

                        <td>
                          {evento.camera_name || `Câmera ${evento.camera_id ?? '—'}`}
                        </td>

                        <td>
                          <div className="confidence-cell">
                            <span>{formatarConfianca(evento.confidence)}</span>
                            <div className="confidence-bar">
                              <div
                                className="confidence-fill"
                                style={{ width: `${porcentagem}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className={`status-pill ${status.classe}`}>
                            {status.texto}
                          </span>
                        </td>

                        <td>
                          {evento.status === 'CONFIRMED' ? (
                            <div className="op-mini-actions">
                              <button
                                type="button"
                                title="Falso positivo"
                                disabled={atualizandoId === evento.id}
                                onClick={() =>
                                  atualizarStatus(
                                    evento.id,
                                    'FALSO_POSITIVO'
                                  )
                                }
                              >
                                <XCircle size={14} />
                              </button>

                              <button
                                type="button"
                                title="Resolvido"
                                disabled={atualizandoId === evento.id}
                                onClick={() =>
                                  atualizarStatus(
                                    evento.id,
                                    'RESOLVIDO'
                                  )
                                }
                              >
                                <CheckCircle2 size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="dash">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {usuarioLogado && (
          <div className="op-footer-user">
            Usuário logado: <strong>{usuarioLogado.name || usuarioLogado.username}</strong>
          </div>
        )}

      </main>
    </div>
  )
}
