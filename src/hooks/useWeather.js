import { useState, useEffect } from 'react';

// 📍 Localização da RPPN
const LAT = -14.777;
const LNG = -45.123;

// 🔑 Sua chave da OpenWeatherMap (gratuita)
// Cadastre em: https://openweathermap.org/api
const API_KEY = 'sua_chave_aqui'; // ← VOCÊ VAI COLOCAR SUA CHAVE DEPOIS

export function useWeather() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LNG}&appid=${API_KEY}&units=metric&lang=pt_br`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }
      
      const data = await response.json();
      
      setWeather({
        temperatura: Math.round(data.main.temp),
        condicao: data.weather[0].description,
        umidade: data.main.humidity,
        vento: Math.round(data.wind.speed * 3.6), // m/s → km/h
        icone: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
        atualizado: new Date(),
      });
      
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar clima:', err);
      setError('Não foi possível carregar o clima');
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Buscar ao montar e a cada 5 minutos
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

  return { weather, loading, error };
}
