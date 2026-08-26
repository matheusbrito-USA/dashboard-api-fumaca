import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function agruparPorDia(eventos) {
  const contagem = {}

  eventos.forEach((evento) => {
    const data = new Date(evento.detected_at)
    const chave = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    contagem[chave] = (contagem[chave] || 0) + 1
  })

  return Object.entries(contagem)
    .map(([dia, total]) => ({ dia, total }))
    .reverse()
}

function GraficoEventos({ eventos }) {
  const dados = agruparPorDia(eventos)

  if (dados.length === 0) {
    return null
  }

  return (
    <div className="grafico-container">
      <h2>Eventos por Dia</h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={dados}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="dia" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#f1f5f9' }}
          />
          <Bar dataKey="total" fill="#eab308" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default GraficoEventos
