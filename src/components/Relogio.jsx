import { useState, useEffect } from 'react'

function Relogio() {
  const [agora, setAgora] = useState(new Date())

  useEffect(() => {
    const intervalo = setInterval(() => {
      setAgora(new Date())
    }, 1000)

    return () => clearInterval(intervalo)
  }, [])

  const horario = agora.toLocaleTimeString('pt-BR')
  const data = agora.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="relogio">
      <span className="relogio-hora">{horario}</span>
      <span className="relogio-data">{data}</span>
    </div>
  )
}

export default Relogio
