import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, Polygon, Popup, TileLayer, useMap } from 'react-leaflet'
import { LocateFixed } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

import reserva from '../config/reserva.json'
import { API_URL, INTERVALO_MAPA_MS } from '../config/operador'

// O perímetro foi preservado do mapa original, sem inferir coordenadas de eventos.
const GIBS_URL = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best'
const CREDITO_NASA = '<a href="https://www.earthdata.nasa.gov/" target="_blank">NASA GIBS</a> · Focos: NASA FIRMS'

function dataImagemInicial() {
  const ontem = new Date()
  ontem.setUTCDate(ontem.getUTCDate() - 1)
  return ontem.toISOString().slice(0, 10)
}

/** Recalcula a área útil quando a aba ou o tamanho do painel muda. */
function Enquadramento({ ativa, revisao }) {
  const mapa = useMap()

  useEffect(() => {
    const observer = new ResizeObserver(() => mapa.invalidateSize())
    observer.observe(mapa.getContainer())
    return () => observer.disconnect()
  }, [mapa])

  useEffect(() => {
    if (!ativa) return
    const quadro = requestAnimationFrame(() => {
      mapa.invalidateSize()
      mapa.fitBounds(reserva.perimetro, { padding: [24, 24], animate: false })
    })
    return () => cancelAnimationFrame(quadro)
  }, [mapa, ativa, revisao])

  return null
}

/** Consulta o proxy da API; nenhuma chave NASA é enviada pelo navegador. */
export default function CameraMap({ ativa = true }) {
  const [camada, setCamada] = useState('diaria')
  const [dataImagem, setDataImagem] = useState(dataImagemInicial)
  const [revisao, setRevisao] = useState(0)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState('')
  const [erroBase, setErroBase] = useState(false)
  const urlImagem = camada === 'diaria'
    ? `${GIBS_URL}/MODIS_Terra_CorrectedReflectance_TrueColor/default/${dataImagem}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpeg`
    : `${GIBS_URL}/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg`

  useEffect(() => {
    if (!ativa) return undefined
    let encerrado = false
    let proximaConsulta
    let controlador

    async function consultarFocos() {
      controlador = new AbortController()
      const limite = window.setTimeout(() => controlador.abort(), 45000)
      try {
        const resposta = await fetch(`${API_URL}/firms/focos`, { signal: controlador.signal })
        const dados = await resposta.json()
        if (!resposta.ok) {
          throw new Error(typeof dados.detail === 'string' ? dados.detail : 'Focos indisponíveis.')
        }
        if (!Array.isArray(dados.focos) || !dados.consultado_em) {
          throw new Error('Resposta inválida do serviço de focos.')
        }
        if (!encerrado) {
          setResultado(dados)
          setErro('')
        }
      } catch (falha) {
        if (!encerrado) {
          setErro(falha.name === 'AbortError'
            ? 'A consulta de focos excedeu o tempo limite.'
            : falha.message || 'Não foi possível consultar os focos.')
        }
      } finally {
        window.clearTimeout(limite)
        if (!encerrado) proximaConsulta = window.setTimeout(consultarFocos, INTERVALO_MAPA_MS)
      }
    }

    consultarFocos()
    return () => {
      encerrado = true
      controlador?.abort()
      window.clearTimeout(proximaConsulta)
    }
  }, [ativa])

  const focos = resultado?.focos || []
  const horario = resultado ? new Date(resultado.consultado_em).toLocaleString('pt-BR') : ''

  return (
    <>
      <header className="operador__titulo-painel">
        <h2>Mapa da reserva · NASA FIRMS</h2>
        <div className="operador__acoes">
          <label>
            <span className="operador__somente-leitor">Camada do mapa</span>
            <select value={camada} onChange={(evento) => {
              setCamada(evento.target.value)
              setErroBase(false)
            }}>
              <option value="diaria">NASA · imagem diária</option>
              <option value="relevo">NASA · relevo</option>
            </select>
          </label>
          {camada === 'diaria' && <label>
            <span className="operador__somente-leitor">Data da imagem NASA, independente do período dos focos</span>
            <input type="date" value={dataImagem} min="2000-02-24" max={new Date().toISOString().slice(0, 10)} onChange={(evento) => {
              if (!evento.target.value) return
              setDataImagem(evento.target.value)
              setErroBase(false)
            }} />
          </label>}
          <button type="button" onClick={() => setRevisao((valor) => valor + 1)}>
            <LocateFixed size={15} aria-hidden="true" /> Reserva
          </button>
        </div>
      </header>

      <div className="operador__mapa">
        <MapContainer center={reserva.centro} zoom={11} maxZoom={13} scrollWheelZoom>
          <Enquadramento ativa={ativa} revisao={revisao} />
          <TileLayer
            key={`${camada}-${dataImagem}`}
            url={urlImagem}
            attribution={CREDITO_NASA}
            maxNativeZoom={camada === 'diaria' ? 9 : 8}
            maxZoom={13}
            eventHandlers={{ tileerror: () => setErroBase(true) }}
          />
          <Polygon positions={reserva.perimetro} pathOptions={{ color: '#a9d293', weight: 2, fillOpacity: 0.04 }}>
            <Popup>{reserva.nome} · perímetro cadastrado</Popup>
          </Polygon>
          {focos.map((foco) => (
            <CircleMarker
              key={foco.id}
              center={[foco.latitude, foco.longitude]}
              radius={5}
              pathOptions={{ color: '#a52f20', weight: 1, fillColor: '#f36c30', fillOpacity: 0.9 }}
            >
              <Popup>
                <strong>Foco de calor · NASA FIRMS</strong><br />
                {new Date(foco.detectado_em).toLocaleString('pt-BR')}<br />
                {foco.satelite}<br />
                {foco.latitude.toFixed(5)}, {foco.longitude.toFixed(5)}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <footer className="operador__legenda" aria-live="polite">
        <span>Contorno verde: reserva · pontos laranja: focos de calor</span>
        {erroBase && <span className="operador__erro">Falha ao carregar imagens do mapa. Tente outra camada.</span>}
        {erro && <span className="operador__erro">{erro} {resultado && 'Exibindo a última consulta disponível.'}</span>}
        {!resultado && !erro && <span>Consultando focos de calor...</span>}
        {resultado && <span>{focos.length} detecções na região consultada · últimas 24 h · consulta: {horario}</span>}
        <span>{camada === 'diaria' ? `Imagem NASA: ${dataImagem} (UTC). Pode conter nuvens ou áreas sem cobertura.` : 'NASA Blue Marble: mosaico de referência, não é imagem atual.'} Focos: últimas 24 h, independentes da data da imagem.</span>
      </footer>
    </>
  )
}
