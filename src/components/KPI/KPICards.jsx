import React from 'react';
import { Activity, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

function KPICards({ eventos }) {
  // 📊 Calcular métricas
  const totalHoje = eventos.filter(e => {
    const hoje = new Date();
    const dataEvento = new Date(e.detected_at);
    return dataEvento.toDateString() === hoje.toDateString();
  }).length;

  const alarmesAtivos = eventos.filter(e => e.status === 'CONFIRMED').length;
  const falsosPositivos = eventos.filter(e => e.status === 'FALSO_POSITIVO').length;
  const resolvidos = eventos.filter(e => e.status === 'RESOLVIDO').length;
  
  // 🎯 Calcular taxa de acerto (confirmados / total)
  const totalProcessados = falsosPositivos + resolvidos + alarmesAtivos;
  const taxaAcerto = totalProcessados > 0 
    ? Math.round((resolvidos / totalProcessados) * 100) 
    : 0;

  // 📈 Tendência (simulada - você pode ajustar depois)
  const tendencia = {
    eventos: '+12%',
    alarmes: alarmesAtivos > 0 ? '🔴 Crítico' : '✅ Normal',
    falsos: '-8%',
    acerto: '+5%'
  };

  const cards = [
  {
    titulo: 'Eventos Hoje',
    valor: totalHoje,
    icone: <Activity size={24} />,
    cor: '#3b82f6',
    tendencia: tendencia.eventos,
    bg: 'rgba(59, 130, 246, 0.15)'
  },
  {
    titulo: 'Alarmes Ativos',
    valor: alarmesAtivos,
    icone: <AlertTriangle size={24} />,
    cor: '#ef4444',
    tendencia: tendencia.alarmes,
    bg: 'rgba(239, 68, 68, 0.15)'
  },
  {
    titulo: 'Falsos Positivos',
    valor: falsosPositivos,
    icone: <TrendingUp size={24} />,
    cor: '#f59e0b',
    tendencia: tendencia.falsos,
    bg: 'rgba(245, 158, 11, 0.15)'
  }
  // ❌ REMOVIDO: card da Taxa de Acerto

];

  return (
    <div className="kpi-grid">
      {cards.map((card, index) => (
        <div key={index} className="kpi-card" style={{ borderLeftColor: card.cor }}>
          <div className="kpi-header">
            <span className="kpi-icon" style={{ color: card.cor, background: card.bg }}>
              {card.icone}
            </span>
            <span className="kpi-tendencia" style={{ color: card.cor }}>
              {card.tendencia}
            </span>
          </div>
          <div className="kpi-valor">{card.valor}</div>
          <div className="kpi-titulo">{card.titulo}</div>
        </div>
      ))}
    </div>
  );
}

export default KPICards;
