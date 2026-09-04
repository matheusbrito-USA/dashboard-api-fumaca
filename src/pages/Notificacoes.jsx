import { useEffect, useMemo, useState } from 'react'

import {
  Bell,
  Check,
  Mail,
  MessageCircle,
  RefreshCw,
  Settings,
  Users,
  X,
} from 'lucide-react'

import TechnicalLayout from '../components/layout/TechnicalLayout'

const API_URL = 'http://localhost:8000'

const formularioVazio = {
  user_id: null,
  name: '',
  email: '',
  telegram_chat_id: '',
  email_active: false,
  telegram_active: false,
  receive_smoke_alerts: true,
}

export default function Notificacoes() {
  const [usuarios, setUsuarios] = useState([])
  const [destinatarios, setDestinatarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  const [modalAberto, setModalAberto] = useState(false)
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null)
  const [notificacaoSelecionada, setNotificacaoSelecionada] = useState(null)
  const [formulario, setFormulario] = useState(formularioVazio)

  async function carregarDados() {
    try {
      setCarregando(true)
      setErro('')

      const [respostaUsuarios, respostaNotificacoes] =
        await Promise.all([
          fetch(`${API_URL}/users`),
          fetch(`${API_URL}/notifications`),
        ])

      const dadosUsuarios = await respostaUsuarios.json()
      const dadosNotificacoes = await respostaNotificacoes.json()

      if (!respostaUsuarios.ok) {
        throw new Error(
          dadosUsuarios.detail ||
            'Não foi possível carregar os usuários.'
        )
      }

      if (!respostaNotificacoes.ok) {
        throw new Error(
          dadosNotificacoes.detail ||
            'Não foi possível carregar as notificações.'
        )
      }

      setUsuarios(dadosUsuarios)
      setDestinatarios(dadosNotificacoes)
    } catch (error) {
      setErro(
        error.message ||
          'Não foi possível carregar os dados de notificações.'
      )
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    const carregamentoInicial = setTimeout(() => {
      void carregarDados()
    }, 0)

    return () => clearTimeout(carregamentoInicial)
  }, [])

  const usuariosComNotificacao = useMemo(
    () =>
      usuarios.map((usuario) => {
        const notificacao = destinatarios.find(
          (item) => item.user_id === usuario.id
        )

        return {
          ...usuario,
          notificacao: notificacao || null,
        }
      }),
    [usuarios, destinatarios]
  )

  const resumo = useMemo(() => {
    const configurados = usuariosComNotificacao.filter(
      (item) => Boolean(item.notificacao)
    ).length

    const emailAtivo = usuariosComNotificacao.filter(
      (item) => item.notificacao?.email_active
    ).length

    const telegramAtivo = usuariosComNotificacao.filter(
      (item) => item.notificacao?.telegram_active
    ).length

    const recebemAlertas = usuariosComNotificacao.filter(
      (item) =>
        item.notificacao?.receive_smoke_alerts &&
        (
          item.notificacao?.email_active ||
          item.notificacao?.telegram_active
        )
    ).length

    return {
      usuarios: usuarios.length,
      configurados,
      emailAtivo,
      telegramAtivo,
      recebemAlertas,
    }
  }, [usuarios, usuariosComNotificacao])

  function abrirConfiguracao(usuario) {
    const notificacao = destinatarios.find(
      (item) => item.user_id === usuario.id
    )

    setUsuarioSelecionado(usuario)
    setNotificacaoSelecionada(notificacao || null)

    setFormulario({
      user_id: usuario.id,
      name: usuario.name,
      // Usa o e-mail atual do cadastro de usuário como fonte principal.
      email: usuario.email || notificacao?.email || '',
      telegram_chat_id: notificacao?.telegram_chat_id || '',
      email_active: notificacao?.email_active ?? false,
      telegram_active: notificacao?.telegram_active ?? false,
      receive_smoke_alerts:
        notificacao?.receive_smoke_alerts ?? true,
    })

    setErro('')
    setMensagem('')
    setModalAberto(true)
  }

  function fecharModal() {
    if (salvando) return

    setModalAberto(false)
    setUsuarioSelecionado(null)
    setNotificacaoSelecionada(null)
    setFormulario(formularioVazio)
  }

  function atualizarCampo(evento) {
    const { name, value, type, checked } = evento.target

    setFormulario((anterior) => ({
      ...anterior,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function salvar(evento) {
    evento.preventDefault()

    setErro('')
    setMensagem('')

    if (!usuarioSelecionado) {
      setErro('Usuário não selecionado.')
      return
    }

    if (
      formulario.telegram_active &&
      !formulario.telegram_chat_id.trim()
    ) {
      setErro(
        'Informe o Chat ID do Telegram antes de ativar o Telegram.'
      )
      return
    }

    setSalvando(true)

    try {
      const body = {
        user_id: usuarioSelecionado.id,
        name: usuarioSelecionado.name,
        email: formulario.email.trim() || null,
        telegram_chat_id:
          formulario.telegram_chat_id.trim() || null,
        email_active:
          Boolean(formulario.email.trim()) &&
          formulario.email_active,
        telegram_active:
          Boolean(formulario.telegram_chat_id.trim()) &&
          formulario.telegram_active,
        receive_smoke_alerts:
          formulario.receive_smoke_alerts,
      }

      const resposta = await fetch(
        notificacaoSelecionada
          ? `${API_URL}/notifications/${notificacaoSelecionada.id}`
          : `${API_URL}/notifications`,
        {
          method: notificacaoSelecionada ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      )

      const dados = await resposta.json()

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
            'Não foi possível salvar as notificações.'
        )
      }

      setMensagem(
        `Notificações de ${usuarioSelecionado.name} atualizadas com sucesso.`
      )

      setModalAberto(false)
      setUsuarioSelecionado(null)
      setNotificacaoSelecionada(null)
      setFormulario(formularioVazio)

      await carregarDados()
    } catch (error) {
      setErro(
        error.message ||
          'Não foi possível salvar as notificações.'
      )
    } finally {
      setSalvando(false)
    }
  }

  function StatusBadge({ ativo, textoAtivo, textoInativo }) {
    return (
      <span style={ativo ? styles.badgeAtivo : styles.badgeInativo}>
        {ativo ? <Check size={13} /> : <X size={13} />}
        {ativo ? textoAtivo : textoInativo}
      </span>
    )
  }

  return (
    <TechnicalLayout>
      <div style={styles.pagina}>
        <div style={styles.topo}>
          <div>
            <div style={styles.tituloPagina}>
              <Bell size={25} />
              Notificações
            </div>

            <p style={styles.descricao}>
              Escolha quais usuários do sistema receberão alertas
              por e-mail ou Telegram.
            </p>
          </div>

          <button
            style={styles.botaoSecundario}
            onClick={carregarDados}
            disabled={carregando}
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>

        {erro && (
          <div style={styles.erro}>
            {erro}
          </div>
        )}

        {mensagem && (
          <div style={styles.sucesso}>
            {mensagem}
          </div>
        )}

        <div style={styles.resumo}>
          <ResumoCard
            titulo="Usuários"
            valor={resumo.usuarios}
            icon={Users}
          />

          <ResumoCard
            titulo="Configurados"
            valor={resumo.configurados}
            icon={Settings}
          />

          <ResumoCard
            titulo="E-mail ativo"
            valor={resumo.emailAtivo}
            icon={Mail}
          />

          <ResumoCard
            titulo="Telegram ativo"
            valor={resumo.telegramAtivo}
            icon={MessageCircle}
          />

          <ResumoCard
            titulo="Recebem alertas"
            valor={resumo.recebemAlertas}
            icon={Bell}
          />
        </div>

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <div style={styles.tituloCanal}>
                <Users size={20} />
                Usuários do sistema
              </div>

              <div style={styles.subtitulo}>
                Todo usuário cadastrado aparece aqui automaticamente.
              </div>
            </div>
          </div>

          {carregando ? (
            <div style={styles.vazio}>
              Carregando usuários e notificações...
            </div>
          ) : usuariosComNotificacao.length === 0 ? (
            <div style={styles.vazio}>
              Nenhum usuário cadastrado no sistema.
            </div>
          ) : (
            <div style={styles.tabelaWrapper}>
              <table style={styles.tabela}>
                <thead>
                  <tr>
                    <th style={styles.th}>Usuário</th>
                    <th style={styles.th}>E-mail</th>
                    <th style={styles.th}>Telegram</th>
                    <th style={styles.th}>Alertas</th>
                    <th style={styles.thDireita}>Ação</th>
                  </tr>
                </thead>

                <tbody>
                  {usuariosComNotificacao.map((usuario) => {
                    const notificacao = usuario.notificacao

                    return (
                      <tr key={usuario.id}>
                        <td style={styles.td}>
                          <div style={styles.nome}>
                            {usuario.name}
                          </div>

                          <div style={styles.usuarioMeta}>
                            @{usuario.username} · {usuario.role}
                          </div>
                        </td>

                        <td style={styles.td}>
                          <div style={styles.destino}>
                            {usuario.email}
                          </div>

                          <StatusBadge
                            ativo={Boolean(
                              notificacao?.email_active
                            )}
                            textoAtivo="Ativo"
                            textoInativo={
                              notificacao
                                ? 'Inativo'
                                : 'Não configurado'
                            }
                          />
                        </td>

                        <td style={styles.td}>
                          <div style={styles.destino}>
                            {notificacao?.telegram_chat_id ||
                              'Sem Chat ID'}
                          </div>

                          <StatusBadge
                            ativo={Boolean(
                              notificacao?.telegram_active
                            )}
                            textoAtivo="Ativo"
                            textoInativo={
                              notificacao?.telegram_chat_id
                                ? 'Inativo'
                                : 'Não configurado'
                            }
                          />
                        </td>

                        <td style={styles.td}>
                          <StatusBadge
                            ativo={Boolean(
                              notificacao?.receive_smoke_alerts &&
                              (
                                notificacao?.email_active ||
                                notificacao?.telegram_active
                              )
                            )}
                            textoAtivo="Recebe"
                            textoInativo="Não recebe"
                          />
                        </td>

                        <td style={styles.tdDireita}>
                          <button
                            style={styles.botaoPrincipal}
                            onClick={() =>
                              abrirConfiguracao(usuario)
                            }
                          >
                            <Settings size={15} />
                            {notificacao
                              ? 'Configurar'
                              : 'Configurar alertas'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div style={styles.info}>
          <Bell size={17} />

          <div>
            O usuário é cadastrado na área Usuários. Nesta tela você
            apenas define se ele receberá alertas por e-mail,
            Telegram ou pelos dois canais.
          </div>
        </div>

        {modalAberto && usuarioSelecionado && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <div>
                  <h2 style={styles.modalTitulo}>
                    Configurar notificações
                  </h2>

                  <div style={styles.subtitulo}>
                    {usuarioSelecionado.name} ·
                    {' '}
                    @{usuarioSelecionado.username}
                  </div>
                </div>

                <button
                  type="button"
                  style={styles.botaoFechar}
                  onClick={fecharModal}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={salvar}>
                <div style={styles.modalBody}>
                  <div style={styles.blocoCanal}>
                    <div style={styles.blocoCanalTopo}>
                      <div style={styles.canalTitulo}>
                        <Mail size={18} />
                        E-mail
                      </div>

                      <label style={styles.switchLabel}>
                        <input
                          type="checkbox"
                          name="email_active"
                          checked={formulario.email_active}
                          onChange={atualizarCampo}
                        />
                        Ativar e-mail
                      </label>
                    </div>

                    <label style={styles.label}>
                      Endereço
                      <input
                        style={styles.input}
                        name="email"
                        type="email"
                        value={formulario.email}
                        onChange={atualizarCampo}
                        placeholder="usuario@empresa.com"
                      />
                    </label>

                    <div style={styles.ajuda}>
                      Preenchido automaticamente com o e-mail
                      cadastrado em Usuários.
                    </div>
                  </div>

                  <div style={styles.blocoCanal}>
                    <div style={styles.blocoCanalTopo}>
                      <div style={styles.canalTitulo}>
                        <MessageCircle size={18} />
                        Telegram
                      </div>

                      <label style={styles.switchLabel}>
                        <input
                          type="checkbox"
                          name="telegram_active"
                          checked={formulario.telegram_active}
                          onChange={atualizarCampo}
                        />
                        Ativar Telegram
                      </label>
                    </div>

                    <label style={styles.label}>
                      Chat ID
                      <input
                        style={styles.input}
                        name="telegram_chat_id"
                        value={formulario.telegram_chat_id}
                        onChange={atualizarCampo}
                        placeholder="Ex: 123456789"
                      />
                    </label>
                  </div>

                  <div style={styles.blocoAlertas}>
                    <label style={styles.switchLabel}>
                      <input
                        type="checkbox"
                        name="receive_smoke_alerts"
                        checked={
                          formulario.receive_smoke_alerts
                        }
                        onChange={atualizarCampo}
                      />

                      <Bell size={16} />
                      Receber alertas de detecção de fumaça
                    </label>
                  </div>

                  {erro && (
                    <div style={styles.erroModal}>
                      {erro}
                    </div>
                  )}
                </div>

                <div style={styles.modalFooter}>
                  <button
                    type="button"
                    style={styles.botaoCancelar}
                    onClick={fecharModal}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    style={styles.botaoPrincipal}
                    disabled={salvando}
                  >
                    <Check size={16} />
                    {salvando
                      ? 'Salvando...'
                      : 'Salvar configuração'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </TechnicalLayout>
  )
}

function ResumoCard({
  titulo,
  valor,
  icon: Icone,
}) {
  return (
    <div style={styles.resumoCard}>
      <div style={styles.resumoIcone}>
        <Icone size={18} />
      </div>

      <div>
        <div style={styles.resumoValor}>
          {valor}
        </div>

        <div style={styles.resumoTitulo}>
          {titulo}
        </div>
      </div>
    </div>
  )
}

const styles = {
  pagina: {
    padding: 32,
    color: '#F0F2F5',
  },

  topo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 20,
    marginBottom: 24,
  },

  tituloPagina: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 26,
    fontWeight: 700,
  },

  descricao: {
    color: '#9DA6B2',
    marginTop: 8,
    marginBottom: 0,
  },

  resumo: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 14,
    marginBottom: 22,
  },

  resumoCard: {
    background: '#151A1F',
    border: '1px solid #2A2F36',
    borderRadius: 10,
    padding: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },

  resumoIcone: {
    width: 38,
    height: 38,
    borderRadius: 9,
    background: '#1B2128',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#D4A24C',
  },

  resumoValor: {
    fontSize: 21,
    fontWeight: 700,
  },

  resumoTitulo: {
    fontSize: 12,
    color: '#9DA6B2',
    marginTop: 2,
  },

  card: {
    background: '#151A1F',
    border: '1px solid #2A2F36',
    borderRadius: 10,
    overflow: 'hidden',
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderBottom: '1px solid #2A2F36',
  },

  tituloCanal: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    fontSize: 17,
    fontWeight: 650,
  },

  subtitulo: {
    color: '#8F99A5',
    fontSize: 13,
    marginTop: 5,
  },

  tabelaWrapper: {
    overflowX: 'auto',
  },

  tabela: {
    width: '100%',
    borderCollapse: 'collapse',
  },

  th: {
    textAlign: 'left',
    padding: '13px 18px',
    fontSize: 12,
    fontWeight: 600,
    color: '#8F99A5',
    borderBottom: '1px solid #2A2F36',
  },

  thDireita: {
    textAlign: 'right',
    padding: '13px 18px',
    fontSize: 12,
    color: '#8F99A5',
    borderBottom: '1px solid #2A2F36',
  },

  td: {
    padding: '15px 18px',
    borderBottom: '1px solid #242A31',
    fontSize: 14,
    verticalAlign: 'middle',
  },

  tdDireita: {
    padding: '15px 18px',
    borderBottom: '1px solid #242A31',
    textAlign: 'right',
    whiteSpace: 'nowrap',
  },

  nome: {
    fontWeight: 600,
  },

  usuarioMeta: {
    color: '#7F8995',
    fontSize: 12,
    marginTop: 4,
  },

  destino: {
    color: '#B9C1CA',
    marginBottom: 7,
  },

  badgeAtivo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 9px',
    borderRadius: 999,
    border: '1px solid #345E43',
    background: '#17271D',
    color: '#66D48A',
    fontSize: 12,
  },

  badgeInativo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 9px',
    borderRadius: 999,
    border: '1px solid #45393A',
    background: '#241A1B',
    color: '#C98282',
    fontSize: 12,
  },

  botaoPrincipal: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    padding: '9px 14px',
    border: 0,
    borderRadius: 8,
    background: '#4CAF6E',
    color: '#FFFFFF',
    fontWeight: 600,
    cursor: 'pointer',
  },

  botaoSecundario: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '9px 13px',
    borderRadius: 8,
    border: '1px solid #353B43',
    background: '#151A1F',
    color: '#D5DAE0',
    cursor: 'pointer',
  },

  vazio: {
    padding: 30,
    textAlign: 'center',
    color: '#8F99A5',
  },

  erro: {
    background: '#2A1B1C',
    border: '1px solid #5A393B',
    color: '#E09A9A',
    padding: '11px 14px',
    borderRadius: 8,
    marginBottom: 18,
  },

  sucesso: {
    background: '#17271D',
    border: '1px solid #345E43',
    color: '#78D99A',
    padding: '11px 14px',
    borderRadius: 8,
    marginBottom: 18,
  },

  info: {
    marginTop: 20,
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    background: '#171B20',
    border: '1px solid #2A2F36',
    color: '#929CA8',
    padding: 14,
    borderRadius: 9,
    fontSize: 13,
  },

  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.68)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    padding: 20,
  },

  modal: {
    width: '100%',
    maxWidth: 650,
    background: '#151A1F',
    border: '1px solid #343A42',
    borderRadius: 12,
    boxShadow: '0 20px 60px rgba(0,0,0,.4)',
  },

  modalHeader: {
    padding: 20,
    borderBottom: '1px solid #2A2F36',
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
  },

  modalTitulo: {
    margin: 0,
    fontSize: 20,
  },

  botaoFechar: {
    border: 0,
    background: 'transparent',
    color: '#AAB2BC',
    cursor: 'pointer',
  },

  modalBody: {
    padding: 20,
    display: 'grid',
    gap: 16,
  },

  blocoCanal: {
    border: '1px solid #2A2F36',
    borderRadius: 10,
    padding: 16,
    background: '#11161B',
  },

  blocoCanalTopo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginBottom: 15,
  },

  canalTitulo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 650,
  },

  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
    color: '#B9C1CA',
    fontSize: 13,
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 11px',
    borderRadius: 8,
    border: '1px solid #343A42',
    background: '#101317',
    color: '#F0F2F5',
    outline: 'none',
  },

  ajuda: {
    color: '#737D89',
    fontSize: 12,
    marginTop: 8,
  },

  blocoAlertas: {
    border: '1px solid #2A2F36',
    borderRadius: 10,
    padding: 16,
    background: '#11161B',
  },

  switchLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#C5CCD4',
    fontSize: 13,
    cursor: 'pointer',
  },

  erroModal: {
    color: '#E09A9A',
    fontSize: 13,
  },

  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 20,
    borderTop: '1px solid #2A2F36',
  },

  botaoCancelar: {
    padding: '9px 14px',
    borderRadius: 8,
    border: '1px solid #343A42',
    background: '#1B2128',
    color: '#C5CCD4',
    cursor: 'pointer',
  },
}
