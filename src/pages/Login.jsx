import { useState } from 'react'
import { ChevronRight, MessageCircle, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import logoUsina from '../assets/logo-usina-dourada.png'

const API_URL = 'http://localhost:8000'


export default function Login() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar(e) {
    e.preventDefault()

    setErro('')

    if (!username.trim() || !password) {
      setErro('Informe o usuário e a senha.')
      return
    }

    try {
      setCarregando(true)

      const resposta = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      })

      const dados = await resposta.json()

      if (!resposta.ok) {
        setErro(dados.detail || 'Usuário ou senha inválidos.')
        return
      }

      localStorage.setItem(
        'usuario',
        JSON.stringify(dados.user)
      )

      if (
        dados.user.is_system_admin ||
        dados.user.role === 'TECNICO'
      ) {
        navigate('/tecnico')
        return
      }

      if (dados.user.role === 'OPERADOR') {
        navigate('/operador')
        return
      }

      setErro('Usuário sem permissão de acesso.')
    } catch (error) {
      console.error(error)
      setErro('Não foi possível conectar ao servidor.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg-main)',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 32,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 32,
          }}
        >
          <img
            src={logoUsina}
            alt="Logo"
            style={{
              width: 48,
              height: 48,
              objectFit: 'contain',
            }}
          />

          <div>
            <strong
              style={{
                display: 'block',
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Monitoramento de Fumaça
            </strong>

            <span
              style={{
                color: 'var(--text-secondary)',
                fontSize: 12,
              }}
            >
              Plataforma de monitoramento inteligente
            </span>
          </div>
        </div>

        <h1
          style={{
            fontSize: 25,
            marginBottom: 8,
          }}
        >
          Bem-vindo
        </h1>

        <p
          style={{
            marginBottom: 28,
            fontSize: 14,
          }}
        >
          Entre com suas credenciais para acessar o sistema.
        </p>

        <form onSubmit={entrar}>
          <label
            style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            Usuário
          </label>

          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Digite seu usuário"
            autoComplete="username"
            disabled={carregando}
            style={{
              width: '100%',
              height: 44,
              padding: '0 12px',
              marginBottom: 20,
            }}
          />

          <label
            style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            Senha
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite sua senha"
            autoComplete="current-password"
            disabled={carregando}
            style={{
              width: '100%',
              height: 44,
              padding: '0 12px',
              marginBottom: erro ? 12 : 24,
            }}
          />

          {erro && (
            <div
              style={{
                marginBottom: 18,
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(196, 93, 93, 0.12)',
                border: '1px solid rgba(196, 93, 93, 0.35)',
                color: '#E28B8B',
                fontSize: 11,
              }}
            >
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            style={{
              width: '100%',
              height: 44,
              border: 0,
              borderRadius: 8,
              background: 'var(--gold-primary)',
              color: '#17120A',
              fontWeight: 650,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: carregando ? 'not-allowed' : 'pointer',
              opacity: carregando ? 0.7 : 1,
            }}
          >
            {carregando ? 'Entrando...' : 'Entrar'}

            {!carregando && (
              <ChevronRight size={18} />
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px solid var(--border)',
            color: 'var(--text-tertiary)',
            fontSize: 12,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <ShieldCheck size={15} />
          Acesso restrito a usuários autorizados
        </div>

        <div
          style={{
            marginTop: 12,
            width: '100%',
            boxSizing: 'border-box',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'rgba(255, 255, 255, 0.015)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              flexShrink: 0,
              borderRadius: 7,
              display: 'grid',
              placeItems: 'center',
              background: 'transparent',
              color: 'var(--text-tertiary)',
            }}
          >
            <MessageCircle size={15} />
          </div>

          <div style={{ minWidth: 0 }}>
            <span
              style={{
                display: 'block',
                marginBottom: 4,
                color: 'var(--gold-primary)',
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Suporte técnico
            </span>

            <strong
              style={{
                display: 'block',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 650,
              }}
            >
              Matheus Brito
            </strong>

            <span
              style={{
                display: 'block',
                marginTop: 3,
                color: 'var(--text-secondary)',
                fontSize: 11,
              }}
            >
              +55 34 99736-0838
            </span>

          </div>
        </div>
      </section>
    </main>
  )
}
