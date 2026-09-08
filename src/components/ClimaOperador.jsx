import { useEffect, useState } from 'react'
import { CloudSun } from 'lucide-react'
import reserva from '../config/reserva.json'

// Mantém o provedor e a configuração usados pelo widget anterior.
const CHAVE = (import.meta.env.VITE_OPENWEATHER_API_KEY || '').trim()
const INTERVALO_MS = 5 * 60 * 1000

/** Consulta o clima da reserva e cancela requisições ao sair da página. */
export default function ClimaOperador() {
  const [clima, setClima] = useState(null)
  const [erro, setErro] = useState(
    CHAVE ? '' : 'Chave OpenWeather não configurada.'
  )

  useEffect(() => {
    if (!CHAVE) return undefined

    let encerrado = false
    let proximaConsulta
    let controlador

    async function consultar() {
      controlador = new AbortController()
      const limite = window.setTimeout(() => controlador.abort(), 15000)

      try {
        const [latitude, longitude] = reserva.centro
        const parametros = new URLSearchParams({
          lat: String(latitude),
          lon: String(longitude),
          appid: CHAVE,
          units: 'metric',
          lang: 'pt_br',
        })

        const resposta = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?${parametros}`,
          { signal: controlador.signal }
        )

        if (resposta.status === 401) {
          throw new Error('OpenWeather recusou a chave. Confira sua ativação.')
        }

        if (resposta.status === 429) {
          throw new Error('Limite de consultas do OpenWeather atingido.')
        }

        if (!resposta.ok) {
          throw new Error(`Falha no serviço de clima: HTTP ${resposta.status}.`)
        }

        const dados = await resposta.json()
        const temperatura = dados.main?.temp
        const umidade = dados.main?.humidity
        const vento = dados.wind?.speed

        if (![temperatura, umidade, vento].every(Number.isFinite)) {
          throw new Error('O serviço retornou dados de clima incompletos.')
        }

        if (!encerrado) {
          setClima({
            temperatura: Math.round(temperatura),
            umidade: Math.round(umidade),
            vento: Math.round(vento * 3.6),
            condicao: dados.weather?.[0]?.description || 'Condição não informada',
          })
          setErro('')
        }
      } catch (falha) {
        if (!encerrado) {
          setErro(
            falha.name === 'AbortError'
              ? 'A consulta do clima demorou demais.'
              : falha instanceof TypeError
                ? 'Não foi possível conectar ao OpenWeather pelo navegador.'
                : falha.message
          )
        }
      } finally {
        window.clearTimeout(limite)
        if (!encerrado) {
          proximaConsulta = window.setTimeout(consultar, INTERVALO_MS)
        }
      }
    }

    consultar()

    return () => {
      encerrado = true
      controlador?.abort()
      window.clearTimeout(proximaConsulta)
    }
  }, [])

  return (
    <div className="operador__clima" role="status">
      <CloudSun size={19} aria-hidden="true" />
      <div>
        {clima ? (
          <>
            <span>
              {clima.temperatura} °C · {clima.condicao}
              {' · '}Umidade {clima.umidade}%
              {' · '}Vento {clima.vento} km/h
            </span>
            <small>
              Reserva · <a href="https://openweathermap.org/" target="_blank" rel="noreferrer">OpenWeather</a>
              {erro && ' · Última leitura; atualização indisponível'}
            </small>
          </>
        ) : (
          <span>{erro || 'Consultando clima...'}</span>
        )}
        {clima && erro && <small>{erro}</small>}
      </div>
    </div>
  )
}
