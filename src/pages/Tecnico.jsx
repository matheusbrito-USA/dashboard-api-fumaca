import { useEffect, useState } from 'react'
import {
  Activity,
  Camera,
  Cpu,
  Database,
  HardDrive,
  MemoryStick,
  Server,
} from 'lucide-react'

import TechnicalLayout from '../components/layout/TechnicalLayout'


const API_URL = 'http://localhost:8000'


export default function Tecnico() {
  const [status, setStatus] = useState(null)
const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [acaoDetector, setAcaoDetector] = useState(null)


  async function carregarStatus() {
    try {
      const resposta = await fetch(`${API_URL}/system/status`)

      if (!resposta.ok) {
        throw new Error('Falha ao consultar o servidor')
      }

      const dados = await resposta.json()

      setStatus(dados)

      setErro(null)
    } catch (error) {
      setErro(error.message)
    } finally {
      setCarregando(false)
    }
  }


  async function controlarDetector(action) {
    try {
      setAcaoDetector(action)

      const resposta = await fetch(
        `${API_URL}/system/services/detector/${action}`,
        {
          method: 'POST',
        }
      )

      const dados = await resposta.json()

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
          'Não foi possível controlar o detector.'
        )
      }

      await carregarStatus()
      setErro(null)
    } catch (error) {
      setErro(error.message)
    } finally {
      setAcaoDetector(null)
    }
  }


  useEffect(() => {
    const carregamentoInicial = setTimeout(() => {
      void carregarStatus()
    }, 0)

    const intervalo = setInterval(() => {
      void carregarStatus()
    }, 5000)

    return () => {
      clearTimeout(carregamentoInicial)
      clearInterval(intervalo)
    }
  }, [])


  return (
    <TechnicalLayout
      title="Visão geral"
      description="Acompanhe a saúde do sistema e dos principais serviços."
    >
      {erro && (
        <div style={styles.errorBox}>
          Não foi possível consultar o servidor.

          <button
            type="button"
            onClick={carregarStatus}
            style={styles.retryButton}
          >
            Tentar novamente
          </button>
        </div>
      )}


      <section className="tech-overview-hero">
        <div>
          <span style={styles.eyebrow}>
            Monitoramento
          </span>

          <h2 style={styles.heroTitle}>
            {status?.api?.status === 'online'
              ? 'Sistema disponível'
              : 'Verificando sistema'}
          </h2>

          <p style={styles.heroText}>
            Os indicadores abaixo são atualizados
            automaticamente a cada 5 segundos.
          </p>
        </div>

        <StatusBadge
          online={status?.api?.status === 'online'}
          loading={carregando}
        />
      </section>


      <section className="tech-overview-grid">
        <StatusCard
          icon={Server}
          title="Servidor"
          online={status?.api?.status === 'online'}
          value={
            status?.hostname ||
            'Verificando...'
          }
          description={
            status?.api?.response_ms !== undefined
              ? `Resposta da API: ${status.api.response_ms} ms`
              : 'Consultando servidor'
          }
        />

        <StatusCard
          icon={Cpu}
          title="Detecção de fumaça"
          online={status?.detector?.status === 'online'}
          value={
            status?.detector?.status === 'online'
              ? 'Funcionando'
              : 'Parada'
          }
          description={
            status?.detector?.status === 'online'
              ? 'Detector YOLO em execução'
              : 'Processo de detecção não está em execução'
          }
        >
          <div className="tech-overview-serviceActions">
            {status?.detector?.status === 'online' ? (
              <>
                <button
                  type="button"
                  onClick={() => controlarDetector('stop')}
                  disabled={acaoDetector !== null}
                  style={{
                    ...styles.serviceButton,
                    ...styles.stopButton,
                  }}
                >
                  {acaoDetector === 'stop'
                    ? 'Desativando...'
                    : 'Desativar'}
                </button>

                <button
                  type="button"
                  onClick={() => controlarDetector('restart')}
                  disabled={acaoDetector !== null}
                  style={{
                    ...styles.serviceButton,
                    ...styles.restartButton,
                  }}
                >
                  {acaoDetector === 'restart'
                    ? 'Reiniciando...'
                    : 'Reiniciar'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => controlarDetector('start')}
                disabled={acaoDetector !== null}
                style={{
                  ...styles.serviceButton,
                  ...styles.startButton,
                }}
              >
                {acaoDetector === 'start'
                  ? 'Ativando...'
                  : 'Ativar'}
              </button>
            )}
          </div>
        </StatusCard>

        <StatusCard
          icon={Database}
          title="Banco de dados"
          online={status?.database?.status === 'online'}
          value={
            status?.database?.status === 'online'
              ? 'Conectado'
              : 'Desconectado'
          }
          description="PostgreSQL"
        />

        <StatusCard
          icon={Camera}
          title="Stream da câmera"
          online={status?.stream?.status === 'online'}
          value={
            status?.stream?.status === 'online'
              ? 'Disponível'
              : 'Indisponível'
          }
          description="Imagem compartilhada pelo detector"
        />
      </section>


      <section className="tech-overview-resources">
        <h2 className="tech-overview-sectionTitle">
          Recursos do servidor
        </h2>

        <div className="tech-overview-resourceGrid">
          <ResourceCard
            icon={Cpu}
            title="Processador"
            value={`${status?.cpu?.percent}%`}
            percent={status?.cpu?.percent}
            description="Uso atual de CPU"
          />

          <ResourceCard
            icon={MemoryStick}
            title="Memória"
            value={`${status?.memory?.percent}%`}
            percent={status?.memory?.percent}
            description={
              status
                ? `${status?.memory?.used_gb ?? '—'} GB de ${status?.memory?.total_gb ?? '—'} GB`
                : 'Carregando...'
            }
          />

          <ResourceCard
            icon={HardDrive}
            title="Armazenamento"
            value={`${status?.disk?.percent}%`}
            percent={status?.disk?.percent}
            description={
              status
                ? `${status?.disk?.used_gb ?? '—'} GB de ${status?.disk?.total_gb ?? '—'} GB`
                : 'Carregando...'
            }
          />
        </div>
      </section>
    </TechnicalLayout>
  )
}


function StatusCard({
  icon: Icon,
  title,
  online,
  value,
  description,
  children,
}) {
  return (
    <article className="tech-overview-card">
      <div className="tech-overview-cardTop">
        <div
          style={{
            ...styles.iconBox,
            background: online
              ? 'var(--green-deep)'
              : 'rgba(196, 93, 93, 0.12)',
            color: online
              ? 'var(--green-primary)'
              : 'var(--danger)',
          }}
        >
          <Icon size={20} strokeWidth={1.8} />
        </div>

        <span
          style={{
            ...styles.statusText,
            color: online
              ? 'var(--green-primary)'
              : 'var(--danger)',
          }}
        >
          <span
            style={{
              ...styles.dot,
              background: online
                ? 'var(--green-primary)'
                : 'var(--danger)',
            }}
          />

          {online ? 'Online' : 'Offline'}
        </span>
      </div>

      <h3 style={styles.cardTitle}>
        {title}
      </h3>

      <strong style={styles.cardValue}>
        {value}
      </strong>

      <p style={styles.cardDescription}>
        {description}
      </p>

      {children}
    </article>
  )
}


function ResourceCard({
  icon: Icon,
  title,
  value,
  percent,
  description,
}) {
  const valido = typeof percent === 'number' && Number.isFinite(percent)
  const valorBarra = valido ? Math.min(Math.max(percent, 0), 100) : 0

  return (
    <article className="tech-overview-resourceCard">
      <div className="tech-overview-resourceHeader">
        <div style={styles.resourceIcon}>
          <Icon size={18} strokeWidth={1.5} />
        </div>
        <span style={styles.resourceTitle}>{title}</span>
      </div>

      <div className="tech-overview-resourceValue">
        {valido ? value : '—'}
      </div>

      {valido && (
        <div
          style={styles.progress}
          role="meter"
          aria-label={title}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={valorBarra}
        >
          <div
            style={{
              ...styles.progressFill,
              width: `${valorBarra}%`,
            }}
          />
        </div>
      )}

      <p style={styles.resourceDescription}>{description}</p>
    </article>
  )
}


function StatusBadge({
  online,
  loading,
}) {
  if (loading) {
    return (
      <span style={styles.badgeNeutral}>
        Verificando...
      </span>
    )
  }

  return (
    <span
      style={
        online
          ? styles.badgeOnline
          : styles.badgeOffline
      }
    >
      <span
        style={{
          ...styles.dot,
          background: online
            ? 'var(--green-primary)'
            : 'var(--danger)',
        }}
      />

      {online
        ? 'Sistema online'
        : 'Sistema offline'}
    </span>
  )
}


const styles = {
  hero: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 24,
    marginBottom: 24,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 24,
  },

  eyebrow: {
    color: 'var(--gold-primary)',
    fontSize: 12,
    fontWeight: 600,
  },

  heroTitle: {
    margin: '6px 0 7px',
    fontSize: 24,
    color: 'var(--text-primary)',
  },

  heroText: {
    margin: 0,
    color: 'var(--text-secondary)',
    fontSize: 13,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    marginBottom: 32,
  },

  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 20,
  },

  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  iconBox: {
    width: 40,
    height: 40,
    display: 'grid',
    placeItems: 'center',
    borderRadius: 10,
  },

  statusText: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    display: 'inline-block',
  },

  cardTitle: {
    margin: 0,
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },

  cardValue: {
    display: 'block',
    marginTop: 6,
    fontSize: 20,
    color: 'var(--text-primary)',
  },

  cardDescription: {
    margin: '8px 0 0',
    fontSize: 12,
    color: 'var(--text-tertiary)',
  },

  serviceActions: {
    display: 'flex',
    gap: 8,
    marginTop: 18,
  },

  serviceButton: {
    minHeight: 34,
    padding: '0 13px',
    borderRadius: 7,
    fontSize: 11,
    fontWeight: 650,
    cursor: 'pointer',
  },

  startButton: {
    background: 'var(--green-deep)',
    border: '1px solid var(--green-primary)',
    color: 'var(--green-primary)',
  },

  stopButton: {
    background: 'rgba(196, 93, 93, 0.10)',
    border: '1px solid var(--danger)',
    color: 'var(--danger)',
  },

  restartButton: {
    background: 'transparent',
    border: '1px solid var(--gold-primary)',
    color: 'var(--gold-primary)',
  },


  resources: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 24,
  },

  sectionTitle: {
    margin: '0 0 20px',
    fontSize: 17,
    color: 'var(--text-primary)',
  },

  resourceGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },

  resourceCard: {
    padding: 18,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
  },

  resourceHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },

  resourceIcon: {
    color: 'var(--gold-primary)',
  },

  resourceTitle: {
    color: 'var(--text-secondary)',
    fontSize: 13,
  },

  resourceValue: {
    color: 'var(--text-primary)',
    fontSize: 23,
    fontWeight: 650,
  },

  progress: {
    height: 6,
    background: 'var(--border)',
    borderRadius: 20,
    overflow: 'hidden',
    margin: '14px 0 10px',
  },

  progressFill: {
    height: '100%',
    borderRadius: 20,
    background: 'var(--green-primary)',
    transition: 'width var(--transition)',
  },

  resourceDescription: {
    margin: 0,
    color: 'var(--text-tertiary)',
    fontSize: 12,
  },

  badgeOnline: {
    padding: '8px 11px',
    borderRadius: 8,
    background: 'var(--green-deep)',
    color: 'var(--green-primary)',
    fontSize: 12,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 7,
  },

  badgeOffline: {
    padding: '8px 11px',
    borderRadius: 8,
    background: 'rgba(196, 93, 93, 0.12)',
    color: 'var(--danger)',
    fontSize: 12,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 7,
  },

  badgeNeutral: {
    padding: '8px 11px',
    borderRadius: 8,
    background: 'var(--bg-elevated)',
    color: 'var(--text-secondary)',
    fontSize: 12,
  },

  errorBox: {
    marginBottom: 16,
    padding: 14,
    border: '1px solid var(--danger)',
    borderRadius: 10,
    color: 'var(--danger)',
    fontSize: 13,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },

  retryButton: {
    padding: '7px 11px',
    background: 'transparent',
    border: '1px solid var(--danger)',
    borderRadius: 8,
    color: 'var(--danger)',
    cursor: 'pointer',
  },
}
