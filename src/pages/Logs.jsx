import { useEffect, useMemo, useState } from 'react'

import {
  Activity,
  Camera,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import TechnicalLayout from '../components/layout/TechnicalLayout'

const API_URL = 'http://localhost:8000'

function formatarData(data) {
  if (!data) return '—'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(data))
}

function nomeAcao(action) {
  const nomes = {
    USER_LOGIN: 'Login',
    USER_CREATED: 'Usuário criado',
    USER_UPDATED: 'Usuário atualizado',
    USER_DELETED: 'Usuário removido',
    USER_PASSWORD_CHANGED: 'Senha alterada',

    CAMERA_CREATED: 'Câmera criada',
    CAMERA_UPDATED: 'Câmera atualizada',
    CAMERA_DELETED: 'Câmera removida',
    CAMERA_TESTED: 'Câmera testada',

    NOTIFICATION_CREATED: 'Notificação criada',
    NOTIFICATION_UPDATED: 'Notificação atualizada',
    NOTIFICATION_DELETED: 'Notificação removida',
  }

  return nomes[action] || action
}

function nomeRecurso(tipo) {
  const nomes = {
    USER: 'Usuário',
    CAMERA: 'Câmera',
    notification_recipient: 'Notificação',
  }

  return nomes[tipo] || tipo || '—'
}

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [filtroAcao, setFiltroAcao] = useState('TODAS')

  async function carregarLogs() {
    try {
      setCarregando(true)
      setErro('')

      const resposta = await fetch(
        `${API_URL}/audit-logs?limit=500`
      )

      if (!resposta.ok) {
        throw new Error(
          'Não foi possível carregar os logs.'
        )
      }

      const dados = await resposta.json()

      setLogs(
        Array.isArray(dados)
          ? dados
          : []
      )
    } catch (error) {
      setErro(
        error.message ||
          'Não foi possível carregar os logs.'
      )
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    let ativo = true

    fetch(`${API_URL}/audit-logs?limit=500`)
      .then((resposta) => {
        if (!resposta.ok) {
          throw new Error('Não foi possível carregar os logs.')
        }

        return resposta.json()
      })
      .then((dados) => {
        if (ativo) {
          setLogs(Array.isArray(dados) ? dados : [])
        }
      })
      .catch((error) => {
        if (ativo) {
          setErro(
            error.message ||
              'Não foi possível carregar os logs.'
          )
        }
      })
      .finally(() => {
        if (ativo) {
          setCarregando(false)
        }
      })

    return () => {
      ativo = false
    }
  }, [])

  const resumo = useMemo(() => {
    return {
      total: logs.length,

      logins: logs.filter(
        (log) => log.action === 'USER_LOGIN'
      ).length,

      usuarios: logs.filter(
        (log) =>
          log.action?.startsWith('USER_')
      ).length,

      cameras: logs.filter(
        (log) =>
          log.action?.startsWith('CAMERA_')
      ).length,
    }
  }, [logs])

  const acoes = useMemo(() => {
    return [
      ...new Set(
        logs
          .map((log) => log.action)
          .filter(Boolean)
      ),
    ].sort()
  }, [logs])

  const logsFiltrados = useMemo(() => {
    const texto = busca
      .trim()
      .toLowerCase()

    return logs.filter((log) => {
      const acaoOk =
        filtroAcao === 'TODAS' ||
        log.action === filtroAcao

      const conteudo = [
        log.user_name,
        log.username,
        log.action,
        log.resource_type,
        log.resource_id,
        log.details,
        log.ip_address,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return (
        acaoOk &&
        (!texto ||
          conteudo.includes(texto))
      )
    })
  }, [logs, busca, filtroAcao])

  return (
    <TechnicalLayout>
      <div style={styles.page}>
        <div style={styles.topo}>
          <div>
            <div style={styles.eyebrow}>
              SEGURANÇA DO SISTEMA
            </div>

            <h1 style={styles.titulo}>
              Logs e Auditoria
            </h1>

            <p style={styles.subtitulo}>
              Histórico de ações executadas no sistema.
            </p>
          </div>

          <button
            type="button"
            onClick={carregarLogs}
            disabled={carregando}
            style={styles.botaoAtualizar}
          >
            <RefreshCw
              size={17}
              style={{
                animation: carregando
                  ? 'spin 1s linear infinite'
                  : 'none',
              }}
            />

            Atualizar
          </button>
        </div>

        <div style={styles.cards}>
          <ResumoCard
            titulo="Total de registros"
            valor={resumo.total}
            icon={<Activity size={22} />}
          />

          <ResumoCard
            titulo="Logins"
            valor={resumo.logins}
            icon={<ShieldCheck size={22} />}
          />

          <ResumoCard
            titulo="Ações de usuários"
            valor={resumo.usuarios}
            icon={<UserRound size={22} />}
          />

          <ResumoCard
            titulo="Ações de câmeras"
            valor={resumo.cameras}
            icon={<Camera size={22} />}
          />
        </div>

        <div style={styles.filtrosCard}>
          <div style={styles.filtros}>
            <div style={styles.buscaWrapper}>
              <Search
                size={18}
                style={styles.buscaIcon}
              />

              <input
                type="text"
                value={busca}
                onChange={(e) =>
                  setBusca(e.target.value)
                }
                placeholder="Pesquisar usuário, ação, recurso ou detalhe..."
                style={styles.input}
              />
            </div>

            <select
              value={filtroAcao}
              onChange={(e) =>
                setFiltroAcao(e.target.value)
              }
              style={styles.select}
            >
              <option value="TODAS">
                Todas as ações
              </option>

              {acoes.map((acao) => (
                <option
                  key={acao}
                  value={acao}
                >
                  {nomeAcao(acao)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {erro && (
          <div style={styles.erro}>
            {erro}
          </div>
        )}

        <div style={styles.tabelaCard}>
          <div style={styles.tabelaTopo}>
            <div>
              <h2 style={styles.tabelaTitulo}>
                Histórico de atividades
              </h2>

              <p style={styles.tabelaSubtitulo}>
                {logsFiltrados.length} registro(s) exibido(s)
              </p>
            </div>
          </div>

          <div style={styles.tabelaScroll}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>
                    Data / Hora
                  </th>

                  <th style={styles.th}>
                    Usuário
                  </th>

                  <th style={styles.th}>
                    Ação
                  </th>

                  <th style={styles.th}>
                    Recurso
                  </th>

                  <th style={styles.th}>
                    Detalhes
                  </th>

                  <th style={styles.th}>
                    IP
                  </th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={styles.estadoTabela}
                    >
                      Carregando logs...
                    </td>
                  </tr>
                ) : logsFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={styles.estadoTabela}
                    >
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                ) : (
                  logsFiltrados.map(
                    (log) => (
                      <tr
                        key={log.id}
                        style={styles.tr}
                      >
                        <td style={styles.tdData}>
                          {formatarData(
                            log.created_at
                          )}
                        </td>

                        <td style={styles.td}>
                          <div style={styles.usuarioNome}>
                            {log.user_name ||
                              'Sistema'}
                          </div>

                          <div style={styles.usuarioMeta}>
                            {log.username
                              ? `@${log.username}`
                              : log.user_id
                                ? `ID ${log.user_id}`
                                : 'Não identificado'}
                          </div>
                        </td>

                        <td style={styles.td}>
                          <span style={styles.badge}>
                            {nomeAcao(
                              log.action
                            )}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <div>
                            {nomeRecurso(
                              log.resource_type
                            )}
                          </div>

                          {log.resource_id && (
                            <div
                              style={
                                styles.recursoMeta
                              }
                            >
                              ID {log.resource_id}
                            </div>
                          )}
                        </td>

                        <td style={styles.tdDetalhes}>
                          {log.details || '—'}
                        </td>

                        <td style={styles.tdIp}>
                          {log.ip_address ||
                            '—'}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </TechnicalLayout>
  )
}

function ResumoCard({
  titulo,
  valor,
  icon,
}) {
  return (
    <div style={styles.card}>
      <div>
        <div style={styles.cardTitulo}>
          {titulo}
        </div>

        <div style={styles.cardValor}>
          {valor}
        </div>
      </div>

      <div style={styles.cardIcon}>
        {icon}
      </div>
    </div>
  )
}

const styles = {
  page: {
    width: '100%',
    maxWidth: 1500,
    margin: '0 auto',
    padding: '10px 4px 40px',
  },

  topo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 24,
    marginBottom: 28,
    flexWrap: 'wrap',
  },

  eyebrow: {
    color: 'var(--accent)',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.12em',
    marginBottom: 8,
  },

  titulo: {
    margin: 0,
    color: 'var(--text-primary)',
    fontSize: 30,
    fontWeight: 800,
    lineHeight: 1.15,
  },

  subtitulo: {
    margin: '8px 0 0',
    color: 'var(--text-secondary)',
    fontSize: 14,
  },

  botaoAtualizar: {
    height: 42,
    padding: '0 16px',
    borderRadius: 9,
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },

  cards: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 16,
    marginBottom: 20,
  },

  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    minHeight: 118,
    padding: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },

  cardTitulo: {
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 10,
  },

  cardValor: {
    color: 'var(--text-primary)',
    fontSize: 31,
    lineHeight: 1,
    fontWeight: 800,
  },

  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    display: 'grid',
    placeItems: 'center',
    background: 'rgba(203, 171, 83, 0.12)',
    border: '1px solid rgba(203, 171, 83, 0.25)',
    color: 'var(--accent)',
    flexShrink: 0,
  },

  filtrosCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },

  filtros: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(250px, 1fr) minmax(200px, 280px)',
    gap: 12,
  },

  buscaWrapper: {
    position: 'relative',
  },

  buscaIcon: {
    position: 'absolute',
    left: 13,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-secondary)',
    pointerEvents: 'none',
  },

  input: {
    width: '100%',
    height: 42,
    boxSizing: 'border-box',
    padding: '0 14px 0 42px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-main)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontSize: 14,
  },

  select: {
    width: '100%',
    height: 42,
    padding: '0 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-main)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontSize: 14,
  },

  erro: {
    marginBottom: 20,
    padding: '13px 15px',
    borderRadius: 8,
    background: 'rgba(220, 38, 38, 0.08)',
    border: '1px solid rgba(220, 38, 38, 0.28)',
    color: '#fca5a5',
    fontSize: 14,
  },

  tabelaCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    overflow: 'hidden',
  },

  tabelaTopo: {
    padding: '18px 20px',
    borderBottom: '1px solid var(--border)',
  },

  tabelaTitulo: {
    margin: 0,
    color: 'var(--text-primary)',
    fontSize: 17,
    fontWeight: 750,
  },

  tabelaSubtitulo: {
    margin: '5px 0 0',
    color: 'var(--text-secondary)',
    fontSize: 12,
  },

  tabelaScroll: {
    overflowX: 'auto',
  },

  table: {
    width: '100%',
    minWidth: 1050,
    borderCollapse: 'collapse',
  },

  th: {
    textAlign: 'left',
    padding: '13px 16px',
    color: 'var(--text-secondary)',
    background: 'rgba(255,255,255,0.018)',
    borderBottom: '1px solid var(--border)',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },

  tr: {
    borderBottom: '1px solid var(--border)',
  },

  td: {
    padding: '15px 16px',
    color: 'var(--text-primary)',
    fontSize: 13,
    verticalAlign: 'middle',
  },

  tdData: {
    padding: '15px 16px',
    color: 'var(--text-secondary)',
    fontSize: 12,
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
  },

  tdDetalhes: {
    padding: '15px 16px',
    color: 'var(--text-secondary)',
    fontSize: 13,
    verticalAlign: 'middle',
    minWidth: 280,
  },

  tdIp: {
    padding: '15px 16px',
    color: 'var(--text-secondary)',
    fontSize: 12,
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
  },

  usuarioNome: {
    color: 'var(--text-primary)',
    fontSize: 13,
    fontWeight: 700,
  },

  usuarioMeta: {
    color: 'var(--text-secondary)',
    fontSize: 11,
    marginTop: 3,
  },

  recursoMeta: {
    color: 'var(--text-secondary)',
    fontSize: 11,
    marginTop: 3,
  },

  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 24,
    padding: '0 9px',
    borderRadius: 999,
    background: 'rgba(203, 171, 83, 0.10)',
    border: '1px solid rgba(203, 171, 83, 0.22)',
    color: 'var(--accent)',
    fontSize: 11,
    fontWeight: 750,
    whiteSpace: 'nowrap',
  },

  estadoTabela: {
    padding: 40,
    textAlign: 'center',
    color: 'var(--text-secondary)',
    fontSize: 14,
  },
}
