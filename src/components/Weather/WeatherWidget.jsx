import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets } from 'lucide-react';

// 📍 Coordenadas da RPPN
const LAT = -14.777;
const LNG = -45.123;

// ⚠️ COLOQUE SUA CHAVE AQUI (gratuita no OpenWeatherMap)
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || ''

// 🎨 Ícone baseado na condição do tempo
const getWeatherIcon = (condition) => {
  const iconMap = {
    'céu limpo': <Sun size={32} className="text-yellow-400" />,
    'nuvens': <Cloud size={32} className="text-gray-400" />,
    'chuva': <CloudRain size={32} className="text-blue-400" />,
    'vento': <Wind size={32} className="text-gray-300" />,
  };
  
  for (const [key, icon] of Object.entries(iconMap)) {
    if (condition.toLowerCase().includes(key)) return icon;
  }
  return <Cloud size={32} className="text-gray-400" />;
};

function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = async () => {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LNG}&appid=${API_KEY}&units=metric&lang=pt_br`;
      const response = await fetch(url);
      const data = await response.json();
      
      setWeather({
        temperatura: Math.round(data.main.temp),
        condicao: data.weather[0].description,
        umidade: data.main.humidity,
        vento: Math.round(data.wind.speed * 3.6),
        icone: data.weather[0].icon,
      });
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar clima:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const primeiraBusca = setTimeout(() => {
      void fetchWeather();
    }, 0);

    const interval = setInterval(() => {
      void fetchWeather();
    }, 5 * 60 * 1000);

    return () => {
      clearTimeout(primeiraBusca);
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="weather-widget">
        <span>⏳</span>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="weather-widget">
        <span>🌤️ --°C</span>
      </div>
    );
  }

  return (
    <div className="weather-widget">
      <div className="weather-icon">
        {getWeatherIcon(weather.condicao)}
      </div>
      <div className="weather-info">
        <div className="weather-temp">
          {weather.temperatura}°C
        </div>
        <div className="weather-details">
          <span className="weather-condition">
            {weather.condicao.charAt(0).toUpperCase() + weather.condicao.slice(1)}
          </span>
          <div className="weather-stats">
            <span><Droplets size={14} /> {weather.umidade}%</span>
            <span><Wind size={14} /> {weather.vento} km/h</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeatherWidget;
