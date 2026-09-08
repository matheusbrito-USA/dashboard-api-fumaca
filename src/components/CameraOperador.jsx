import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { STREAM_URL } from '../config/operador'

/** Visualização MJPEG sem controles PTZ. Uma falha exige reconexão explícita. */
export default function CameraOperador({ ativa }) {
  const [estado, setEstado] = useState('conectando')
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    if (!ativa || estado !== 'conectando') return undefined
    const limite = window.setTimeout(() => setEstado('sem-confirmacao'), 20000)
    return () => window.clearTimeout(limite)
  }, [ativa, estado, tentativa])

  const descricao = {
    conectando: 'Conectando',
    imagem: 'Imagem recebida',
    erro: 'Stream indisponível',
    'sem-confirmacao': 'Aguardando imagem',
  }[estado]

  function reconectar() {
    setEstado('conectando')
    setTentativa((valor) => valor + 1)
  }

  return (
    <>
      <header className="operador__titulo-painel">
        <h2>Câmera ao vivo</h2>
        <div className="operador__acoes">
          <span role="status">{descricao}</span>
          <button type="button" onClick={reconectar} aria-label="Reconectar stream">
            <RefreshCw size={15} aria-hidden="true" /> Reconectar
          </button>
        </div>
      </header>
      <div className="operador__video">
        {ativa && estado !== 'erro' && (
          <img
            key={tentativa}
            src={`${STREAM_URL}?reconexao=${tentativa}`}
            alt="Visualização da câmera da reserva"
            onLoad={() => setEstado('imagem')}
            onError={() => setEstado('erro')}
          />
        )}
        {estado === 'erro' && <p role="alert">Não foi possível abrir o stream. Tente reconectar.</p>}
      </div>
    </>
  )
}
