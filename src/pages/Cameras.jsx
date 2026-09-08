import { useEffect, useMemo, useState } from 'react'

import {
  Camera,
  Check,
  Edit3,
  Plus,
  RefreshCw,
  Trash2,
  Video,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'

import TechnicalLayout from '../components/layout/TechnicalLayout'

const API_URL = 'http://localhost:8000'

const cameraVazia = {
  name: '',
  ip_address: '',
  model: '',
  location: '',
  username: '',
  password: '',
  rtsp_port: 554,
  channel: '102',
  rtsp_path: '',
  active: true,
}

export default function Cameras() {
  const [cameras, setCameras] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [testandoId, setTestandoId] = useState(null)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  const [modalAberto, setModalAberto] = useState(false)
  const [cameraEditando, setCameraEditando] = useState(null)
  const [formulario, setFormulario] = useState(cameraVazia)

  async function carregarCameras() {
    try {
      setCarregando(true)
      setErro('')

      const resposta = await fetch(`${API_URL}/cameras`)

      if (!resposta.ok) {
        throw new Error('Não foi possível carregar as câmeras.')
      }

      const dados = await resposta.json()
      setCameras(dados)
    } catch (error) {
      setErro(
        error.message ||
          'Não foi possível carregar as câmeras.'
      )
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    const carregamentoInicial = setTimeout(() => {
      void carregarCameras()
    }, 0)

    return () => clearTimeout(carregamentoInicial)
  }, [])

  const resumo = useMemo(() => {
    return {
      total: cameras.length,

      online: cameras.filter(
        (camera) => camera.status === 'ONLINE'
      ).length,

      offline: cameras.filter(
        (camera) => camera.status === 'OFFLINE'
      ).length,

      ativas: cameras.filter(
        (camera) => camera.active !== false
      ).length,
    }
  }, [cameras])

  function abrirNovaCamera() {
    setCameraEditando(null)
    setFormulario(cameraVazia)
    setErro('')
    setMensagem('')
    setModalAberto(true)
  }

  function abrirEdicao(camera) {
    setCameraEditando(camera)

    setFormulario({
      name: camera.name || '',
      ip_address: camera.ip_address || '',
      model: camera.model || '',
      location: camera.location || '',
      username: camera.username || '',
      password: '',
      rtsp_port: camera.rtsp_port || 554,
      channel: camera.channel || '102',
      rtsp_path: camera.rtsp_path || '',
      active: camera.active ?? true,
    })

    setErro('')
    setMensagem('')
    setModalAberto(true)
  }

  function fecharModal() {
    if (salvando) {
      return
    }

    setModalAberto(false)
    setCameraEditando(null)
    setFormulario(cameraVazia)
  }

  function atualizarCampo(evento) {
    const { name, value, type, checked } = evento.target

    setFormulario((anterior) => ({
      ...anterior,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }))
  }

  async function salvarCamera(evento) {
    evento.preventDefault()

    setErro('')
    setMensagem('')

    if (!formulario.name.trim()) {
      setErro('Informe o nome da câmera.')
      return
    }

    if (!formulario.ip_address.trim()) {
      setErro('Informe o endereço IP da câmera.')
      return
    }

    setSalvando(true)

    try {
      let resposta

      if (cameraEditando) {
        const body = {
          name: formulario.name.trim(),
          ip_address: formulario.ip_address.trim(),
          model: formulario.model.trim() || null,
          location: formulario.location.trim() || null,
          username: formulario.username.trim() || null,
          rtsp_port: Number(formulario.rtsp_port),
          channel: formulario.channel.trim() || '102',
          rtsp_path: formulario.rtsp_path.trim() || null,
          active: formulario.active,
        }

        if (formulario.password) {
          body.password = formulario.password
        }

        resposta = await fetch(
          `${API_URL}/cameras/${cameraEditando.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          }
        )
      } else {
        resposta = await fetch(`${API_URL}/cameras`, {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            name: formulario.name.trim(),
            ip_address: formulario.ip_address.trim(),
            model: formulario.model.trim() || null,
            location: formulario.location.trim() || null,
            username: formulario.username.trim() || null,
            password: formulario.password || null,
            rtsp_port: Number(formulario.rtsp_port),
            channel: formulario.channel.trim() || '102',
            rtsp_path: formulario.rtsp_path.trim() || null,
            active: formulario.active,
          }),
        })
      }

      const dados = await resposta.json()

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
            'Não foi possível salvar a câmera.'
        )
      }

      setMensagem(
        cameraEditando
          ? 'Câmera atualizada com sucesso.'
          : 'Câmera cadastrada com sucesso.'
      )

      setModalAberto(false)
      setCameraEditando(null)
      setFormulario(cameraVazia)

      await carregarCameras()
    } catch (error) {
      setErro(
        error.message ||
          'Não foi possível salvar a câmera.'
      )
    } finally {
      setSalvando(false)
    }
  }

  async function testarCamera(camera) {
    setErro('')
    setMensagem('')
    setTestandoId(camera.id)

    try {
      const resposta = await fetch(
        `${API_URL}/cameras/${camera.id}/test`,
        {
          method: 'POST',
        }
      )

      const dados = await resposta.json()

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
            'Não foi possível testar a câmera.'
        )
      }

      if (dados.status === 'online') {
        setMensagem(
          `Conexão com ${camera.name} validada com sucesso.`
        )
      } else {
        setErro(
          `Não foi possível obter imagem de ${camera.name}.`
        )
      }

      await carregarCameras()
    } catch (error) {
      setErro(
        error.message ||
          'Não foi possível testar a câmera.'
      )
    } finally {
      setTestandoId(null)
    }
  }

  async function alternarStatus(camera) {
    setErro('')
    setMensagem('')

    try {
      const resposta = await fetch(
        `${API_URL}/cameras/${camera.id}`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            active: !(camera.active ?? true),
          }),
        }
      )

      const dados = await resposta.json()

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
            'Não foi possível alterar o status.'
        )
      }

      setMensagem(
        camera.active === false
          ? 'Câmera ativada.'
          : 'Câmera desativada.'
      )

      await carregarCameras()
    } catch (error) {
      setErro(
        error.message ||
          'Não foi possível alterar o status.'
      )
    }
  }

  async function excluirCamera(camera) {
    const confirmado = window.confirm(
      `Deseja realmente remover a câmera ${camera.name}?`
    )

    if (!confirmado) {
      return
    }

    setErro('')
    setMensagem('')

    try {
      const resposta = await fetch(
        `${API_URL}/cameras/${camera.id}`,
        {
          method: 'DELETE',
        }
      )

      const dados = await resposta.json()

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
            'Não foi possível remover a câmera.'
        )
      }

      setMensagem('Câmera removida com sucesso.')
      await carregarCameras()
    } catch (error) {
      setErro(
        error.message ||
          'Não foi possível remover a câmera.'
      )
    }
  }

  return (
    <TechnicalLayout
      title="Câmeras"
      description="Gerencie os dispositivos usados pelo sistema de detecção."
    >
      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <SummaryCard
          icon={Camera}
          title="Câmeras cadastradas"
          value={resumo.total}
          description="Total de dispositivos no sistema"
        />

        <SummaryCard
          icon={Wifi}
          title="Online"
          value={resumo.online}
          description="Câmeras com conexão validada"
        />

        <SummaryCard
          icon={WifiOff}
          title="Offline"
          value={resumo.offline}
          description="Câmeras sem resposta no último teste"
        />

        <SummaryCard
          icon={Video}
          title="Ativas"
          value={resumo.ativas}
          description="Disponíveis para uso pelo sistema"
        />
      </section>

      {(erro || mensagem) && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 14px',
            borderRadius: 10,
            border: erro
              ? '1px solid rgba(196, 93, 93, 0.35)'
              : '1px solid rgba(76, 175, 110, 0.35)',
            background: erro
              ? 'rgba(196, 93, 93, 0.08)'
              : 'rgba(76, 175, 110, 0.08)',
            color: erro
              ? 'var(--danger-hover)'
              : 'var(--green-hover)',
            fontSize: 13,
          }}
        >
          {erro || mensagem}
        </div>
      )}

      <section
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            minHeight: 72,
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 17 }}>
              Dispositivos
            </h2>

            <p
              style={{
                margin: '4px 0 0',
                fontSize: 12,
              }}
            >
              Configure acesso RTSP e valide a conexão das câmeras.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={carregarCameras}
              style={botaoSecundario}
              title="Atualizar lista"
            >
              <RefreshCw size={16} />
            </button>

            <button
              type="button"
              onClick={abrirNovaCamera}
              style={botaoPrimario}
            >
              <Plus size={17} />
              Adicionar câmera
            </button>
          </div>
        </div>

        {carregando ? (
          <EstadoCentral
            icon={RefreshCw}
            titulo="Carregando câmeras"
            descricao="Buscando os dispositivos no servidor."
          />
        ) : cameras.length === 0 ? (
          <EstadoCentral
            icon={Camera}
            titulo="Nenhuma câmera cadastrada"
            descricao="Adicione uma câmera para começar a configurar a detecção."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 920,
              }}
            >
              <thead>
                <tr>
                  <CabecalhoTabela>Câmera</CabecalhoTabela>
                  <CabecalhoTabela>Local</CabecalhoTabela>
                  <CabecalhoTabela>RTSP</CabecalhoTabela>
                  <CabecalhoTabela>Conexão</CabecalhoTabela>
                  <CabecalhoTabela>Uso</CabecalhoTabela>
                  <CabecalhoTabela align="right">
                    Ações
                  </CabecalhoTabela>
                </tr>
              </thead>

              <tbody>
                {cameras.map((camera) => (
                  <tr
                    key={camera.id}
                    style={{
                      borderTop:
                        '1px solid var(--border)',
                    }}
                  >
                    <td style={celulaTabela}>
                      <div
                        style={{
                          color:
                            'var(--text-primary)',
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {camera.name}
                      </div>

                      <div
                        style={{
                          marginTop: 3,
                          color:
                            'var(--text-secondary)',
                          fontSize: 12,
                        }}
                      >
                        {camera.ip_address}
                        {camera.model
                          ? ` · ${camera.model}`
                          : ''}
                      </div>
                    </td>

                    <td style={celulaTabela}>
                      <span
                        style={{
                          color:
                            'var(--text-secondary)',
                          fontSize: 13,
                        }}
                      >
                        {camera.location || '—'}
                      </span>
                    </td>

                    <td style={celulaTabela}>
                      <div
                        style={{
                          color:
                            'var(--text-primary)',
                          fontSize: 12,
                        }}
                      >
                        Porta {camera.rtsp_port || 554}
                      </div>

                      <div
                        style={{
                          marginTop: 3,
                          color:
                            'var(--text-secondary)',
                          fontSize: 11,
                        }}
                      >
                        Canal {camera.channel || '—'}
                      </div>
                    </td>

                    <td style={celulaTabela}>
                      <ConnectionBadge
                        status={camera.status}
                      />
                    </td>

                    <td style={celulaTabela}>
                      <button
                        type="button"
                        onClick={() =>
                          alternarStatus(camera)
                        }
                        style={{
                          border: 0,
                          padding: 0,
                          background:
                            'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        <ActiveBadge
                          active={camera.active ?? true}
                        />
                      </button>
                    </td>

                    <td
                      style={{
                        ...celulaTabela,
                        textAlign: 'right',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent:
                            'flex-end',
                          gap: 6,
                        }}
                      >

                        <button
                          type="button"
                             onClick={() => testarCamera(camera)}
                                disabled={testandoId === camera.id}
                              style={{
                                       ...botaoSecundario,
                                         minWidth: 'auto',
                                         padding: '0 12px',
                                         color: 'var(--green-hover)',
                                                                     }}
                                        title="Testar conexão RTSP"
                       >
                                          {testandoId === camera.id ? (
                                              <RefreshCw size={15} />
                                        ) : (
                                           <Wifi size={15} />
                                       )}

                                           {testandoId === camera.id
                                          ? 'Testando...'
                                           : 'Testar conexão'}
                           </button>

                        <button
                          type="button"
                          onClick={() =>
                            abrirEdicao(camera)
                          }
                          style={botaoIcone}
                          title="Editar câmera"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            excluirCamera(camera)
                          }
                          style={{
                            ...botaoIcone,
                            color:
                              'var(--danger-hover)',
                          }}
                          title="Remover câmera"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalAberto && (
        <div
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              fecharModal()
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: 20,
            background:
              'rgba(5, 7, 9, 0.72)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 620,
              maxHeight: '90vh',
              overflowY: 'auto',
              background:
                'var(--bg-elevated)',
              border:
                '1px solid var(--border)',
              borderRadius: 12,
            }}
          >
            <div
              style={{
                padding: '18px 20px',
                borderBottom:
                  '1px solid var(--border)',
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 17,
                  }}
                >
                  {cameraEditando
                    ? 'Editar câmera'
                    : 'Adicionar câmera'}
                </h2>

                <p
                  style={{
                    margin: '5px 0 0',
                    fontSize: 12,
                  }}
                >
                  Configure a câmera e o acesso ao stream RTSP.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                style={botaoIcone}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={salvarCamera}>
              <div
                style={{
                  padding: 20,
                  display: 'grid',
                  gap: 18,
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 16,
                  }}
                >
                  <Campo
                    label="Nome"
                    name="name"
                    value={formulario.name}
                    onChange={atualizarCampo}
                    placeholder="Ex.: Câmera Reserva 01"
                    required
                  />

                  <Campo
                    label="Endereço IP"
                    name="ip_address"
                    value={formulario.ip_address}
                    onChange={atualizarCampo}
                    placeholder="192.168.1.64"
                    required
                  />

                  <Campo
                    label="Modelo"
                    name="model"
                    value={formulario.model}
                    onChange={atualizarCampo}
                    placeholder="Ex.: Hikvision DS-..."
                  />

                  <Campo
                    label="Local / setor"
                    name="location"
                    value={formulario.location}
                    onChange={atualizarCampo}
                    placeholder="Ex.: Reserva ambiental"
                  />

                  <Campo
                    label="Usuário RTSP"
                    name="username"
                    value={formulario.username}
                    onChange={atualizarCampo}
                    placeholder="Usuário da câmera"
                  />

                  <Campo
                    label={
                      cameraEditando
                        ? 'Nova senha RTSP'
                        : 'Senha RTSP'
                    }
                    name="password"
                    type="password"
                    value={formulario.password}
                    onChange={atualizarCampo}
                    placeholder={
                      cameraEditando
                        ? 'Deixe vazio para manter'
                        : 'Senha da câmera'
                    }
                  />

                  <Campo
                    label="Porta RTSP"
                    name="rtsp_port"
                    type="number"
                    value={formulario.rtsp_port}
                    onChange={atualizarCampo}
                    placeholder="554"
                    required
                  />

                  <Campo
                    label="Canal / stream"
                    name="channel"
                    value={formulario.channel}
                    onChange={atualizarCampo}
                    placeholder="102"
                    required
                  />
                </div>

                <Campo
                  label="Caminho RTSP personalizado"
                  name="rtsp_path"
                  value={formulario.rtsp_path}
                  onChange={atualizarCampo}
                  placeholder="/Streaming/Channels/102"
                />

                <p
                  style={{
                    margin: '-8px 0 0',
                    color:
                      'var(--text-tertiary)',
                    fontSize: 11,
                    lineHeight: 1.5,
                  }}
                >
                  Se deixar o caminho vazio, o sistema usa
                  /Streaming/Channels/ seguido do canal informado.
                </p>

                <label
                  style={{
                    padding: '12px 14px',
                    border:
                      '1px solid var(--border)',
                    borderRadius: 10,
                    background:
                      'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent:
                      'space-between',
                    gap: 16,
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <div
                      style={{
                        color:
                          'var(--text-primary)',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Câmera ativa
                    </div>

                    <div
                      style={{
                        marginTop: 3,
                        color:
                          'var(--text-secondary)',
                        fontSize: 12,
                      }}
                    >
                      Permite o uso da câmera pelo sistema.
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    name="active"
                    checked={formulario.active}
                    onChange={atualizarCampo}
                    style={{
                      width: 18,
                      height: 18,
                      accentColor:
                        'var(--green-primary)',
                    }}
                  />
                </label>
              </div>

              <div
                style={{
                  padding: '16px 20px',
                  borderTop:
                    '1px solid var(--border)',
                  display: 'flex',
                  justifyContent:
                    'flex-end',
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={salvando}
                  style={{
                    ...botaoSecundario,
                    padding: '0 16px',
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  style={{
                    ...botaoPrimario,
                    opacity: salvando
                      ? 0.65
                      : 1,
                  }}
                >
                  <Check size={17} />

                  {salvando
                    ? 'Salvando...'
                    : cameraEditando
                      ? 'Salvar alterações'
                      : 'Cadastrar câmera'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </TechnicalLayout>
  )
}

function Campo({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
}) {
  return (
    <label
      style={{
        display: 'grid',
        gap: 7,
      }}
    >
      <span
        style={{
          color:
            'var(--text-secondary)',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {label}
      </span>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={inputStyle}
      />
    </label>
  )
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  description,
}) {
  return (
    <article
      style={{
        background: 'var(--bg-card)',
        border:
          '1px solid var(--border)',
        borderRadius:
          'var(--radius-lg)',
        padding: 20,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 10,
          background:
            'var(--green-deep)',
          color:
            'var(--green-primary)',
          marginBottom: 18,
        }}
      >
        <Icon
          size={19}
          strokeWidth={1.8}
        />
      </div>

      <div
        style={{
          fontSize: 25,
          fontWeight: 650,
          color:
            'var(--text-primary)',
          marginBottom: 4,
        }}
      >
        {value}
      </div>

      <h3
        style={{
          margin: '0 0 5px',
          fontSize: 14,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: 0,
          fontSize: 12,
        }}
      >
        {description}
      </p>
    </article>
  )
}

function ConnectionBadge({ status }) {
  const online = status === 'ONLINE'
  const offline = status === 'OFFLINE'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '5px 9px',
        borderRadius: 8,
        background: online
          ? 'var(--green-deep)'
          : offline
            ? 'rgba(196,93,93,.1)'
            : 'rgba(106,114,128,.12)',
        color: online
          ? 'var(--green-hover)'
          : offline
            ? 'var(--danger-hover)'
            : 'var(--text-secondary)',
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: online
            ? 'var(--green-primary)'
            : offline
              ? 'var(--danger)'
              : 'var(--text-tertiary)',
        }}
      />

      {online
        ? 'Online'
        : offline
          ? 'Offline'
          : 'Não testada'}
    </span>
  )
}

function ActiveBadge({ active }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '5px 9px',
        borderRadius: 8,
        background: active
          ? 'var(--green-deep)'
          : 'rgba(106,114,128,.12)',
        color: active
          ? 'var(--green-hover)'
          : 'var(--text-secondary)',
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {active ? 'Ativa' : 'Inativa'}
    </span>
  )
}

function EstadoCentral({
  icon: Icon,
  titulo,
  descricao,
}) {
  return (
    <div
      style={{
        minHeight: 320,
        display: 'grid',
        placeItems: 'center',
        padding: 32,
        textAlign: 'center',
      }}
    >
      <div>
        <div
          style={{
            width: 52,
            height: 52,
            margin: '0 auto 16px',
            borderRadius: 12,
            display: 'grid',
            placeItems: 'center',
            background:
              'var(--green-deep)',
            color:
              'var(--green-primary)',
          }}
        >
          <Icon size={24} strokeWidth={1.8} />
        </div>

        <h3 style={{ marginBottom: 8 }}>
          {titulo}
        </h3>

        <p
          style={{
            margin: 0,
            maxWidth: 500,
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {descricao}
        </p>
      </div>
    </div>
  )
}

function CabecalhoTabela({
  children,
  align = 'left',
}) {
  return (
    <th
      style={{
        padding: '12px 20px',
        textAlign: align,
        color:
          'var(--text-secondary)',
        background:
          'rgba(255,255,255,.015)',
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {children}
    </th>
  )
}

const celulaTabela = {
  padding: '15px 20px',
  verticalAlign: 'middle',
}

const inputStyle = {
  width: '100%',
  minHeight: 42,
  boxSizing: 'border-box',
  padding: '0 12px',
  border:
    '1px solid var(--border)',
  borderRadius: 9,
  outline: 0,
  background:
    'var(--bg-card)',
  color:
    'var(--text-primary)',
  fontFamily: 'inherit',
  fontSize: 13,
}

const botaoPrimario = {
  minHeight: 40,
  padding: '0 15px',
  borderRadius:
    'var(--radius-sm)',
  border:
    '1px solid #d4ddcb',
  background:
    '#eef2e9',
  color: '#2c4232',
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  cursor: 'pointer',
}

const botaoSecundario = {
  minWidth: 40,
  minHeight: 40,
  borderRadius:
    'var(--radius-sm)',
  border:
    '1px solid var(--border)',
  background:
    'var(--bg-elevated)',
  color:
    'var(--text-secondary)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  cursor: 'pointer',
}

const botaoIcone = {
  width: 34,
  height: 34,
  padding: 0,
  borderRadius: 8,
  border:
    '1px solid var(--border)',
  background:
    'var(--bg-elevated)',
  color:
    'var(--text-secondary)',
  display: 'inline-grid',
  placeItems: 'center',
  cursor: 'pointer',
}
