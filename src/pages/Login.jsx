import { useState } from 'react'
import { ChevronRight, MessageCircle, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import logoUsina from '../assets/logo-usina-dourada.png'
import floresta from '../assets/unnamed.png'
import '../styles/login.css'

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
    <main className="login-page">
      <section className="login-shell" aria-label="Acesso ao sistema">
        <aside className="login-landscape">
          <img className="login-forest" src={floresta} alt="" />
          <div className="login-brand">
            <img
              className="login-logo"
              src={logoUsina}
              alt="Usina Santo Ângelo"
            />
            <div className="login-brand-name">USINA SANTO ÂNGELO</div>
          </div>
          <div className="login-title">
            <span className="login-line" />
            <h1>Sistema de<br />Detecção de Incêndio</h1>
            <p>Monitoramento em tempo real</p>
          </div>
        </aside>

        <div className="login-panel">
          <div className="login-form-wrap">
            <header className="login-heading">
              <h2>Bem-vindo</h2>
              <p>Acesse o sistema para continuar.</p>
            </header>

            <form onSubmit={entrar} aria-busy={carregando}>
              <div className="login-field">
                <label htmlFor="login-username">Usuário</label>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={carregando}
                  required
                />
              </div>

              <div className="login-field">
                <label htmlFor="login-password">Senha</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  disabled={carregando}
                  required
                />
              </div>

              {erro && (
                <div className="login-error" role="alert">{erro}</div>
              )}

              <button
                className="login-submit"
                type="submit"
                disabled={carregando}
              >
                {carregando ? 'Entrando...' : 'Entrar'}
                {!carregando && <ChevronRight size={17} aria-hidden="true" />}
              </button>
            </form>

            <div className="login-restricted">
              <ShieldCheck size={15} aria-hidden="true" />
              <span>Acesso restrito a usuários autorizados</span>
            </div>

            <div className="login-support">
              <MessageCircle size={18} aria-hidden="true" />
              <div>
                <span>Suporte técnico</span>
                <strong>Matheus Brito</strong>
                <a href="tel:+5534997360838">+55 34 99736-0838</a>
              </div>
            </div>
          </div>

          <footer className="login-footer">Usina Santo Ângelo</footer>
        </div>
      </section>
    </main>
  )
}
