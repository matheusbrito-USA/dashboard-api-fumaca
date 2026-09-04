import { useEffect, useMemo, useState } from 'react'

import {
  Check,
  Edit3,
  LockKeyhole,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UserCheck,
  UserCog,
  Users as UsersIcon,
  X,
} from 'lucide-react'

import TechnicalLayout from '../components/layout/TechnicalLayout'

const API_URL = 'http://localhost:8000'

const usuarioVazio = {
  name: '',
  username: '',
  email: '',
  password: '',
  role: 'OPERADOR',
  active: true,
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  const [modalAberto, setModalAberto] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState(null)
  const [formulario, setFormulario] = useState(usuarioVazio)

  async function carregarUsuarios() {
    try {
      setCarregando(true)
      setErro('')

      const resposta = await fetch(`${API_URL}/users`)

      if (!resposta.ok) {
        throw new Error('Não foi possível carregar os usuários.')
      }

      const dados = await resposta.json()
      setUsuarios(dados)
    } catch (error) {
      setErro(
        error.message ||
          'Não foi possível carregar os usuários.'
      )
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    const carregamentoInicial = setTimeout(() => {
      void carregarUsuarios()
    }, 0)

    return () => clearTimeout(carregamentoInicial)
  }, [])

  const resumo = useMemo(() => {
    return {
      total: usuarios.length,
      ativos: usuarios.filter((usuario) => usuario.active).length,
      tecnicos: usuarios.filter(
        (usuario) => usuario.role === 'TECNICO'
      ).length,
      operadores: usuarios.filter(
        (usuario) => usuario.role === 'OPERADOR'
      ).length,
    }
  }, [usuarios])

  function abrirNovoUsuario() {
    setUsuarioEditando(null)
    setFormulario(usuarioVazio)
    setErro('')
    setMensagem('')
    setModalAberto(true)
  }

  function abrirEdicao(usuario) {
    setUsuarioEditando(usuario)

    setFormulario({
      name: usuario.name || '',
      username: usuario.username || '',
      email: usuario.email || '',
      password: '',
      role: usuario.role,
      active: usuario.active,
    })

    setErro('')
    setMensagem('')
    setModalAberto(true)
  }

  function fecharModal() {
    if (salvando) return

    setModalAberto(false)
    setUsuarioEditando(null)
    setFormulario(usuarioVazio)
  }

  function atualizarCampo(evento) {
    const { name, value, type, checked } = evento.target

    if (
      usuarioEditando?.is_system_admin &&
      (name === 'role' || name === 'active' || name === 'username')
    ) {
      return
    }

    setFormulario((estadoAnterior) => ({
      ...estadoAnterior,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function salvarUsuario(evento) {
    evento.preventDefault()

    setErro('')
    setMensagem('')

    if (!formulario.name.trim()) {
      setErro('Informe o nome do usuário.')
      return
    }

    if (!formulario.username.trim()) {
      setErro('Informe o nome de usuário para login.')
      return
    }

    if (!formulario.email.trim()) {
      setErro('Informe o e-mail do usuário.')
      return
    }

    if (!usuarioEditando && formulario.password.length < 8) {
      setErro('A senha precisa ter pelo menos 8 caracteres.')
      return
    }

    setSalvando(true)

    try {
      let resposta

      if (usuarioEditando) {
        resposta = await fetch(
          `${API_URL}/users/${usuarioEditando.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: formulario.name.trim(),
              username: usuarioEditando.is_system_admin
                ? usuarioEditando.username
                : formulario.username.trim().toLowerCase(),
              email: formulario.email.trim(),
              role: usuarioEditando.is_system_admin
                ? 'TECNICO'
                : formulario.role,
              active: usuarioEditando.is_system_admin
                ? true
                : formulario.active,
            }),
          }
        )
      } else {
        resposta = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formulario.name.trim(),
            username: formulario.username.trim().toLowerCase(),
            email: formulario.email.trim(),
            password: formulario.password,
            role: formulario.role,
            active: formulario.active,
          }),
        })
      }

      const dados = await resposta.json()

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
            'Não foi possível salvar o usuário.'
        )
      }

      setMensagem(
        usuarioEditando
          ? 'Usuário atualizado com sucesso.'
          : 'Usuário criado com sucesso.'
      )

      setModalAberto(false)
      setUsuarioEditando(null)
      setFormulario(usuarioVazio)

      await carregarUsuarios()
    } catch (error) {
      setErro(
        error.message ||
          'Não foi possível salvar o usuário.'
      )
    } finally {
      setSalvando(false)
    }
  }

  async function alternarStatus(usuario) {
    if (usuario.is_system_admin) {
      setErro(
        'O Administrador do Sistema não pode ser desativado.'
      )
      return
    }

    setErro('')
    setMensagem('')

    try {
      const resposta = await fetch(
        `${API_URL}/users/${usuario.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            active: !usuario.active,
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
        usuario.active
          ? 'Usuário desativado.'
          : 'Usuário ativado.'
      )

      await carregarUsuarios()
    } catch (error) {
      setErro(
        error.message ||
          'Não foi possível alterar o status.'
      )
    }
  }

  async function excluirUsuario(usuario) {
    if (usuario.is_system_admin) {
      setErro(
        'O Administrador do Sistema não pode ser removido.'
      )
      return
    }

    const confirmado = window.confirm(
      `Deseja realmente remover ${usuario.name}?`
    )

    if (!confirmado) return

    setErro('')
    setMensagem('')

    try {
      const resposta = await fetch(
        `${API_URL}/users/${usuario.id}`,
        {
          method: 'DELETE',
        }
      )

      const dados = await resposta.json()

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
            'Não foi possível remover o usuário.'
        )
      }

      setMensagem('Usuário removido com sucesso.')
      await carregarUsuarios()
    } catch (error) {
      setErro(
        error.message ||
          'Não foi possível remover o usuário.'
      )
    }
  }

  return (
    <TechnicalLayout
      title="Usuários"
      description="Gerencie quem pode acessar o sistema e o que cada pessoa pode visualizar."
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
          icon={UsersIcon}
          title="Usuários cadastrados"
          value={resumo.total}
          description="Total de contas no sistema"
        />

        <SummaryCard
          icon={UserCheck}
          title="Usuários ativos"
          value={resumo.ativos}
          description="Contas liberadas para acesso"
        />

        <SummaryCard
          icon={UserCog}
          title="Técnicos"
          value={resumo.tecnicos}
          description="Acesso técnico e operacional"
        />

        <SummaryCard
          icon={Shield}
          title="Operadores"
          value={resumo.operadores}
          description="Acesso somente ao painel operacional"
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
            <h2
              style={{
                margin: 0,
                fontSize: 17,
              }}
            >
              Pessoas com acesso
            </h2>

            <p
              style={{
                margin: '4px 0 0',
                fontSize: 12,
              }}
            >
              Adicione usuários e defina o nível de acesso de cada pessoa.
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
              onClick={carregarUsuarios}
              title="Atualizar lista"
              style={botaoSecundario}
            >
              <RefreshCw size={16} />
            </button>

            <button
              type="button"
              onClick={abrirNovoUsuario}
              style={botaoPrimario}
            >
              <Plus size={17} />
              Adicionar usuário
            </button>
          </div>
        </div>

        {carregando ? (
          <EstadoCentral>
            <RefreshCw size={24} strokeWidth={1.8} />
            <h3>Carregando usuários</h3>
            <p>Buscando os cadastros no servidor.</p>
          </EstadoCentral>
        ) : usuarios.length === 0 ? (
          <EstadoCentral>
            <UsersIcon size={24} strokeWidth={1.8} />
            <h3>Nenhum usuário cadastrado</h3>
            <p>
              Adicione o primeiro usuário para começar a controlar o acesso ao sistema.
            </p>
          </EstadoCentral>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 900,
              }}
            >
              <thead>
                <tr>
                  <CabecalhoTabela>Usuário</CabecalhoTabela>
                  <CabecalhoTabela>Login</CabecalhoTabela>
                  <CabecalhoTabela>Perfil</CabecalhoTabela>
                  <CabecalhoTabela>Status</CabecalhoTabela>
                  <CabecalhoTabela>Criado em</CabecalhoTabela>
                  <CabecalhoTabela align="right">
                    Ações
                  </CabecalhoTabela>
                </tr>
              </thead>

              <tbody>
                {usuarios.map((usuario) => (
                  <tr
                    key={usuario.id}
                    style={{
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <td style={celulaTabela}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              color: 'var(--text-primary)',
                              fontSize: 14,
                              fontWeight: 600,
                            }}
                          >
                            {usuario.name}
                          </div>

                          <div
                            style={{
                              marginTop: 3,
                              color: 'var(--text-secondary)',
                              fontSize: 12,
                            }}
                          >
                            {usuario.email}
                          </div>
                        </div>

                        {usuario.is_system_admin && (
                          <AdminBadge />
                        )}
                      </div>
                    </td>

                    <td style={celulaTabela}>
                      <span
                        style={{
                          color: 'var(--text-primary)',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {usuario.username || '—'}
                      </span>
                    </td>

                    <td style={celulaTabela}>
                      <RoleBadge role={usuario.role} />
                    </td>

                    <td style={celulaTabela}>
                      {usuario.is_system_admin ? (
                        <div
                          title="O Administrador do Sistema não pode ser desativado"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 7,
                          }}
                        >
                          <StatusBadge active={true} />
                          <LockKeyhole
                            size={13}
                            color="var(--gold-primary)"
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            alternarStatus(usuario)
                          }
                          title="Alterar status"
                          style={{
                            border: 0,
                            padding: 0,
                            background: 'transparent',
                            cursor: 'pointer',
                          }}
                        >
                          <StatusBadge active={usuario.active} />
                        </button>
                      )}
                    </td>

                    <td style={celulaTabela}>
                      <span
                        style={{
                          color: 'var(--text-secondary)',
                          fontSize: 13,
                        }}
                      >
                        {formatarData(usuario.created_at)}
                      </span>
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
                          justifyContent: 'flex-end',
                          gap: 6,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            abrirEdicao(usuario)
                          }
                          title="Editar usuário"
                          style={botaoIcone}
                        >
                          <Edit3 size={16} />
                        </button>

                        {!usuario.is_system_admin && (
                          <button
                            type="button"
                            onClick={() =>
                              excluirUsuario(usuario)
                            }
                            title="Remover usuário"
                            style={{
                              ...botaoIcone,
                              color: 'var(--danger-hover)',
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
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
            if (event.target === event.currentTarget) {
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
            background: 'rgba(5, 7, 9, 0.72)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 18px 50px rgba(0,0,0,.25)',
            }}
          >
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 17,
                  }}
                >
                  {usuarioEditando
                    ? 'Editar usuário'
                    : 'Adicionar usuário'}
                </h2>

                <p
                  style={{
                    margin: '5px 0 0',
                    fontSize: 12,
                  }}
                >
                  {usuarioEditando?.is_system_admin
                    ? 'Conta principal protegida do sistema.'
                    : usuarioEditando
                      ? 'Atualize os dados e permissões da conta.'
                      : 'Crie uma nova conta de acesso ao sistema.'}
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

            <form onSubmit={salvarUsuario}>
              <div
                style={{
                  padding: 20,
                  display: 'grid',
                  gap: 18,
                }}
              >
                {usuarioEditando?.is_system_admin && (
                  <div
                    style={{
                      padding: '12px 14px',
                      border:
                        '1px solid var(--gold-muted)',
                      borderRadius: 10,
                      background: 'var(--gold-deep)',
                      color: 'var(--gold-hover)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 12,
                    }}
                  >
                    <LockKeyhole size={17} />

                    Esta é a conta Administrador do Sistema.
                    Login, perfil e status são protegidos.
                  </div>
                )}

                <Campo
                  label="Nome"
                  name="name"
                  value={formulario.name}
                  onChange={atualizarCampo}
                  placeholder="Nome completo"
                  required
                />

                <Campo
                  label="Usuário de login"
                  name="username"
                  value={formulario.username}
                  onChange={atualizarCampo}
                  placeholder="Ex: joao.silva"
                  required
                  disabled={usuarioEditando?.is_system_admin}
                />

                <Campo
                  label="E-mail"
                  name="email"
                  type="email"
                  value={formulario.email}
                  onChange={atualizarCampo}
                  placeholder="usuario@empresa.com"
                  required
                />

                {!usuarioEditando && (
                  <Campo
                    label="Senha inicial"
                    name="password"
                    type="password"
                    value={formulario.password}
                    onChange={atualizarCampo}
                    placeholder="Mínimo de 8 caracteres"
                    required
                  />
                )}

                <label
                  style={{
                    display: 'grid',
                    gap: 7,
                  }}
                >
                  <span style={labelStyle}>
                    Perfil de acesso
                  </span>

                  <select
                    name="role"
                    value={formulario.role}
                    onChange={atualizarCampo}
                    disabled={usuarioEditando?.is_system_admin}
                    style={{
                      ...inputStyle,
                      opacity:
                        usuarioEditando?.is_system_admin
                          ? 0.6
                          : 1,
                      cursor:
                        usuarioEditando?.is_system_admin
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    <option value="OPERADOR">
                      Operador
                    </option>

                    <option value="TECNICO">
                      Técnico
                    </option>
                  </select>
                </label>

                <label
                  style={{
                    minHeight: 48,
                    padding: '12px 14px',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    background: 'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    cursor:
                      usuarioEditando?.is_system_admin
                        ? 'not-allowed'
                        : 'pointer',
                    opacity:
                      usuarioEditando?.is_system_admin
                        ? 0.65
                        : 1,
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: 'var(--text-primary)',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Conta ativa
                    </div>

                    <div
                      style={{
                        marginTop: 3,
                        color: 'var(--text-secondary)',
                        fontSize: 12,
                      }}
                    >
                      {usuarioEditando?.is_system_admin
                        ? 'O Administrador do Sistema permanece sempre ativo.'
                        : 'Permite que a pessoa utilize o sistema.'}
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    name="active"
                    checked={formulario.active}
                    onChange={atualizarCampo}
                    disabled={usuarioEditando?.is_system_admin}
                    style={{
                      width: 18,
                      height: 18,
                      accentColor: 'var(--green-primary)',
                    }}
                  />
                </label>
              </div>

              <div
                style={{
                  padding: '16px 20px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
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
                    opacity: salvando ? 0.65 : 1,
                  }}
                >
                  <Check size={17} />

                  {salvando
                    ? 'Salvando...'
                    : usuarioEditando
                      ? 'Salvar alterações'
                      : 'Criar usuário'}
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
  disabled = false,
}) {
  return (
    <label
      style={{
        display: 'grid',
        gap: 7,
      }}
    >
      <span style={labelStyle}>{label}</span>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={{
          ...inputStyle,
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
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
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
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
          background: 'var(--green-deep)',
          color: 'var(--green-primary)',
          marginBottom: 18,
        }}
      >
        <Icon size={19} strokeWidth={1.8} />
      </div>

      <div
        style={{
          fontSize: 25,
          fontWeight: 650,
          color: 'var(--text-primary)',
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

function RoleBadge({ role }) {
  const tecnico = role === 'TECNICO'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 9px',
        borderRadius: 8,
        background: tecnico
          ? 'var(--gold-deep)'
          : 'var(--green-deep)',
        color: tecnico
          ? 'var(--gold-hover)'
          : 'var(--green-hover)',
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {tecnico ? (
        <UserCog size={13} />
      ) : (
        <Shield size={13} />
      )}

      {tecnico ? 'Técnico' : 'Operador'}
    </span>
  )
}

function AdminBadge() {
  return (
    <span
      title="Conta principal protegida"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 7px',
        borderRadius: 7,
        background: 'var(--gold-deep)',
        color: 'var(--gold-hover)',
        fontSize: 10,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      <LockKeyhole size={11} />
      Administrador
    </span>
  )
}

function StatusBadge({ active }) {
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
          : 'rgba(106, 114, 128, 0.12)',
        color: active
          ? 'var(--green-hover)'
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
          background: active
            ? 'var(--green-primary)'
            : 'var(--text-tertiary)',
        }}
      />

      {active ? 'Ativo' : 'Inativo'}
    </span>
  )
}

function EstadoCentral({ children }) {
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
            background: 'var(--green-deep)',
            color: 'var(--green-primary)',
          }}
        >
          {children[0]}
        </div>

        <div>{children.slice(1)}</div>
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
        color: 'var(--text-secondary)',
        background: 'rgba(255,255,255,.015)',
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {children}
    </th>
  )
}

function formatarData(data) {
  if (!data) return '—'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(data))
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
  border: '1px solid var(--border)',
  borderRadius: 9,
  outline: 0,
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  fontSize: 13,
}

const labelStyle = {
  color: 'var(--text-secondary)',
  fontSize: 12,
  fontWeight: 600,
}

const botaoPrimario = {
  minHeight: 40,
  padding: '0 15px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--gold-muted)',
  background: 'var(--gold-primary)',
  color: '#17120A',
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
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-secondary)',
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
  border: '1px solid var(--border)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-secondary)',
  display: 'inline-grid',
  placeItems: 'center',
  cursor: 'pointer',
}
