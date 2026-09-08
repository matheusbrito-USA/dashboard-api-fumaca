import { useEffect, useMemo, useRef, useState } from 'react'
import { API_URL } from '../config/operador'

const INTERVALO_MS = 5000
const ITENS_PAGINA = 10
const STATUS = { CONFIRMED: 'Não resolvido', FALSO_POSITIVO: 'Falso positivo', RESOLVIDO: 'Resolvido' }

/** Datas inválidas não interrompem a renderização da lista. */
function formatarData(valor) {
  const data = new Date(valor)
  return valor && Number.isFinite(data.getTime()) ? data.toLocaleString('pt-BR') : '—'
}

/** Consulta sequencial e ações preservam os endpoints existentes da aplicação. */
export default function EventosOperador({ ativo, historico, abrirHistorico }) {
  const [eventos, setEventos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroConsulta, setErroConsulta] = useState('')
  const [erroAcao, setErroAcao] = useState('')
  const [processando, setProcessando] = useState(null)
  const [revisao, setRevisao] = useState(0)
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)
  const travaAcao = useRef(false)

  useEffect(() => {
    if (!ativo) return undefined
    let encerrado = false
    let intervalo
    let controller

    async function consultar() {
      controller = new AbortController()
      const limite = window.setTimeout(() => controller.abort(), 15000)
      try {
        const resposta = await fetch(`${API_URL}/events`, { signal: controller.signal })
        if (!resposta.ok) throw new Error('Não foi possível atualizar os alertas.')
        const dados = await resposta.json()
        if (!Array.isArray(dados)) throw new Error('Resposta de alertas inválida.')
        if (!encerrado) { setEventos(dados); setErroConsulta('') }
      } catch (erro) {
        if (!encerrado) setErroConsulta(erro.name === 'AbortError' ? 'Tempo de consulta excedido.' : erro.message)
      } finally {
        window.clearTimeout(limite)
        if (!encerrado) {
          setCarregando(false)
          intervalo = window.setTimeout(consultar, INTERVALO_MS)
        }
      }
    }
    consultar()
    return () => { encerrado = true; controller?.abort(); window.clearTimeout(intervalo) }
  }, [ativo, revisao])

  async function alterarStatus(id, status) {
    if (travaAcao.current) return
    travaAcao.current = true
    setProcessando(id)
    setErroAcao('')
    const controller = new AbortController()
    const limite = window.setTimeout(() => controller.abort(), 15000)
    try {
      const resposta = await fetch(`${API_URL}/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        signal: controller.signal,
      })
      if (!resposta.ok) throw new Error('Não foi possível salvar a ação no alerta.')
      setEventos((anteriores) => anteriores.map((evento) => evento.id === id ? { ...evento, status } : evento))
    } catch (erro) {
      setErroAcao(erro.name === 'AbortError'
        ? 'A confirmação demorou. Confira o status atualizado antes de repetir a ação.'
        : erro.message)
    } finally {
      window.clearTimeout(limite)
      setRevisao((valor) => valor + 1)
      setProcessando(null)
      travaAcao.current = false
    }
  }

  const lista = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    return eventos.filter((evento) => {
      if (!historico) return evento.status === 'CONFIRMED'
      return [evento.id, evento.camera_name, evento.camera_id, evento.event_type,
        STATUS[evento.status] || evento.status].join(' ').toLocaleLowerCase('pt-BR').includes(termo)
    }).sort((a, b) => (Date.parse(b.detected_at || b.created_at) || 0) - (Date.parse(a.detected_at || a.created_at) || 0))
  }, [eventos, historico, busca])
  const totalPaginas = Math.max(1, Math.ceil(lista.length / ITENS_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = historico ? lista.slice((paginaAtual - 1) * ITENS_PAGINA, paginaAtual * ITENS_PAGINA) : lista

  function acoes(evento) {
    if (evento.status !== 'CONFIRMED') return '—'
    return (
      <div className="operador__acoes-evento">
        <button type="button" disabled={processando !== null || Boolean(erroConsulta)} onClick={() => alterarStatus(evento.id, 'FALSO_POSITIVO')}>Falso positivo</button>
        <button type="button" disabled={processando !== null || Boolean(erroConsulta)} onClick={() => alterarStatus(evento.id, 'RESOLVIDO')}>Resolver</button>
        {processando === evento.id && <span role="status">Salvando...</span>}
      </div>
    )
  }

  return (
    <>
      <header className="operador__titulo-painel">
        <h2>{historico ? 'Histórico de alertas' : 'Alertas ativos'}</h2>
        <button type="button" onClick={historico ? () => setRevisao((valor) => valor + 1) : abrirHistorico}>
          {historico ? 'Atualizar' : 'Ver histórico'}
        </button>
      </header>
      {(erroConsulta || erroAcao) && <p className="operador__aviso" role="alert">{erroAcao || `${erroConsulta} Os dados anteriores podem estar desatualizados.`}</p>}
      {historico && <label className="operador__busca">Buscar alerta
        <input value={busca} onChange={(evento) => { setBusca(evento.target.value); setPagina(1) }} placeholder="Câmera, tipo, status ou número" />
      </label>}
      <div className="operador__eventos-conteudo">
        {carregando ? <p className="operador__vazio">Carregando alertas...</p>
          : lista.length === 0 ? <p className="operador__vazio">{erroConsulta ? 'Alertas indisponíveis.' : historico ? 'Nenhum alerta encontrado.' : 'Nenhum alerta ativo.'}</p>
          : historico ? (
            <table className="operador__tabela">
              <thead><tr><th>Data e hora</th><th>Câmera</th><th>Tipo</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>{visiveis.map((evento) => <tr key={evento.id}>
                <td>{formatarData(evento.detected_at || evento.created_at)}</td>
                <td>{evento.camera_name || `Câmera ${evento.camera_id ?? '—'}`}</td>
                <td>{evento.event_type || 'Detecção'}</td>
                <td>
                  <span
                    className="operador__status-evento"
                    data-status={evento.status}
                  >
                    {STATUS[evento.status] || evento.status || '—'}
                  </span>
                </td>
                <td>{acoes(evento)}</td>
              </tr>)}</tbody>
            </table>
          ) : visiveis.map((evento) => (
            <article className="operador__evento" key={evento.id}>
              <strong>{evento.event_type || 'Detecção'} · #{evento.id}</strong>
              <span>{evento.camera_name || `Câmera ${evento.camera_id ?? '—'}`}</span>
              <time>{formatarData(evento.detected_at || evento.created_at)}</time>
              {acoes(evento)}
            </article>
          ))}
      </div>
      {historico && <footer className="operador__paginacao">
        <button type="button" disabled={paginaAtual === 1} onClick={() => setPagina(paginaAtual - 1)}>Anterior</button>
        <span>{paginaAtual} de {totalPaginas} · {lista.length} alertas</span>
        <button type="button" disabled={paginaAtual === totalPaginas} onClick={() => setPagina(paginaAtual + 1)}>Próxima</button>
      </footer>}
    </>
  )
}
