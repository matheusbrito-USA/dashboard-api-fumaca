# DASHBOARD-API-FUMACA

Dashboard para monitoramento em tempo real do sistema de detecção de fumaça e incêndios utilizando visão computacional (YOLOv8). Desenvolvido em React com Vite.

---

## Arquitetura

- **React 18** com **Vite** e **SWC** para compilação otimizada
- **HMR** (Hot Module Replacement) para desenvolvimento
- **Fetch API** para comunicação assíncrona com backend FastAPI
- **Leaflet + OpenStreetMap** para renderização de mapas satélite
- **MJPEG** para transmissão do stream da câmera
- **OpenWeatherMap API** para dados climáticos
- **Recharts** para visualização de dados
- **Lucide React** para ícones

---

## Funcionalidades

- KPIs em tempo real (eventos, alarmes, falsos positivos)
- Mapa interativo com perímetro da RPPN
- Stream MJPEG da câmera com detecções da IA
- Lista de eventos com ações (Falso Positivo / Resolvido)
- Dados climáticos atualizados (temperatura, umidade, vento)
- Atualização automática a cada 5 segundos
- Design responsivo com tema escuro

---

## Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Frontend | React | 18.2.0 |
| Build Tool | Vite | 5.0.0 |
| Compilador | SWC | - |
| Mapas | Leaflet | 1.9.4 |
| Gráficos | Recharts | 2.8.0 |
| Ícones | Lucide React | 0.294.0 |
| Estilização | CSS | - |

---

## Endpoints Consumidos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /events | Lista eventos recentes |
| PATCH | /events/{id} | Atualiza status do evento |
| GET | /stream/live | Stream MJPEG da câmera |

---

## Execução

```bash
git clone https://github.com/matheusbrito-USA/dashboard-api-fumaca.git
cd dashboard-api-fumaca
npm install
npm run dev
