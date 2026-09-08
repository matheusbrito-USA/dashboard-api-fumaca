// Sobrescreva VITE_API_URL se a API usar outro host ou um proxy reverso.
const servidor = new URL(window.location.origin)
servidor.port = '8000'
export const API_URL = (import.meta.env.VITE_API_URL || servidor.origin).replace(/\/$/, '')

// O endpoint MJPEG já utilizado pelo sistema é mantido em um único local.
export const STREAM_URL = `${API_URL}/stream/live`
export const INTERVALO_MAPA_MS = 15 * 60 * 1000
