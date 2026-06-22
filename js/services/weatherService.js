(function () {
  'use strict';

  const CACHE_KEY = 'abs_spb_weather_cache';
  const CACHE_TTL_MS = 15 * 60 * 1000;
  const CITY = 'Санкт-Петербург';

  const WEATHER_CODE_MAP = {
    0: { key: 'clear', label: 'Ясно' },
    1: { key: 'partly', label: 'Преимущественно ясно' },
    2: { key: 'partly', label: 'Переменная облачность' },
    3: { key: 'overcast', label: 'Пасмурно' },
    45: { key: 'fog', label: 'Туман' },
    48: { key: 'fog', label: 'Изморозь' },
    51: { key: 'drizzle', label: 'Слабая морось' },
    53: { key: 'drizzle', label: 'Морось' },
    55: { key: 'drizzle', label: 'Сильная морось' },
    56: { key: 'sleet', label: 'Ледяная морось' },
    57: { key: 'sleet', label: 'Сильная ледяная морось' },
    61: { key: 'rain', label: 'Небольшой дождь' },
    63: { key: 'rain', label: 'Дождь' },
    65: { key: 'heavy-rain', label: 'Сильный дождь' },
    66: { key: 'sleet', label: 'Ледяной дождь' },
    67: { key: 'sleet', label: 'Сильный ледяной дождь' },
    71: { key: 'snow', label: 'Небольшой снег' },
    73: { key: 'snow', label: 'Снег' },
    75: { key: 'snow', label: 'Сильный снег' },
    77: { key: 'snow', label: 'Снежные зёрна' },
    80: { key: 'rain', label: 'Небольшой ливень' },
    81: { key: 'rain', label: 'Ливень' },
    82: { key: 'heavy-rain', label: 'Сильный ливень' },
    85: { key: 'snow', label: 'Снегопад' },
    86: { key: 'snow', label: 'Сильный снегопад' },
    95: { key: 'thunder', label: 'Гроза' },
    96: { key: 'thunder', label: 'Гроза с градом' },
    99: { key: 'thunder', label: 'Сильная гроза с градом' }
  };

  const WEATHER_ICON_CLASS = {
    clear: 'sun',
    partly: 'partly',
    cloudy: 'cloud',
    overcast: 'cloud',
    drizzle: 'rain drizzle',
    rain: 'rain',
    'heavy-rain': 'rain heavy-rain',
    thunder: 'thunder',
    snow: 'snow',
    sleet: 'sleet',
    hail: 'hail',
    fog: 'fog',
    wind: 'wind',
    night: 'moon',
    loading: 'loading-icon',
    unavailable: 'unavailable-icon'
  };

  const STRONG_WEATHER_KEYS = new Set(['heavy-rain', 'thunder', 'snow', 'sleet', 'hail']);

  function asNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function round(value) {
    const number = asNumber(value);
    return number === null ? null : Math.round(number);
  }

  function formatTemperature(value) {
    const number = round(value);
    if (number === null) return '—';
    return `${String(number).replace('-', '−')}°`;
  }

  function formatWind(value) {
    const number = round(value);
    return number === null ? '—' : `${number} м/с`;
  }

  function formatRange(max, min) {
    if (round(max) === null || round(min) === null) return '—';
    return `${formatTemperature(max)} / ${formatTemperature(min)}`;
  }

  function formatTime(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  function isNight(time) {
    if (!time) return false;
    const date = new Date(time);
    if (Number.isNaN(date.getTime())) return false;
    const hour = date.getHours();
    return hour >= 22 || hour < 6;
  }

  function getCodeMeta(weatherCode, windSpeed, time) {
    const code = Number(weatherCode);
    const meta = WEATHER_CODE_MAP[code] || { key: 'cloudy', label: 'Облачно' };
    const wind = asNumber(windSpeed) || 0;

    if (wind >= 10 && !STRONG_WEATHER_KEYS.has(meta.key)) {
      return { key: 'wind', label: 'Ветрено' };
    }

    if (isNight(time) && ['clear', 'partly'].includes(meta.key)) {
      return { key: 'night', label: meta.key === 'clear' ? 'Ясно ночью' : 'Ночь, переменная облачность' };
    }

    return meta;
  }

  function createLoadingWeather() {
    return {
      city: CITY,
      temperature: null,
      temperatureLabel: '—',
      condition: 'Загрузка погоды',
      weatherKey: 'loading',
      iconClass: WEATHER_ICON_CLASS.loading,
      humidity: null,
      windSpeed: null,
      windLabel: '—',
      todayMin: null,
      todayMax: null,
      tomorrowMin: null,
      tomorrowMax: null,
      todayRange: '—',
      tomorrowRange: '—',
      updatedAt: '',
      updatedLabel: 'Обновление'
    };
  }

  function createUnavailableWeather() {
    return {
      city: CITY,
      temperature: null,
      temperatureLabel: '—',
      condition: 'Данные недоступны',
      weatherKey: 'unavailable',
      iconClass: WEATHER_ICON_CLASS.unavailable,
      humidity: null,
      windSpeed: null,
      windLabel: '—',
      todayMin: null,
      todayMax: null,
      tomorrowMin: null,
      tomorrowMax: null,
      todayRange: '—',
      tomorrowRange: '—',
      updatedAt: '',
      updatedLabel: 'Нет связи'
    };
  }

  function normalizeWeatherPayload(payload = {}) {
    const current = payload.current || {};
    const daily = payload.daily || {};
    const weather = getCodeMeta(current.weather_code, current.wind_speed_10m, current.time);
    const todayMax = daily.temperature_2m_max?.[0];
    const todayMin = daily.temperature_2m_min?.[0];
    const tomorrowMax = daily.temperature_2m_max?.[1];
    const tomorrowMin = daily.temperature_2m_min?.[1];

    return {
      city: CITY,
      temperature: round(current.temperature_2m),
      temperatureLabel: formatTemperature(current.temperature_2m),
      condition: weather.label,
      weatherKey: weather.key,
      iconClass: WEATHER_ICON_CLASS[weather.key] || WEATHER_ICON_CLASS.cloudy,
      humidity: round(current.relative_humidity_2m),
      windSpeed: round(current.wind_speed_10m),
      windLabel: formatWind(current.wind_speed_10m),
      todayMin: round(todayMin),
      todayMax: round(todayMax),
      tomorrowMin: round(tomorrowMin),
      tomorrowMax: round(tomorrowMax),
      todayRange: formatRange(todayMax, todayMin),
      tomorrowRange: formatRange(tomorrowMax, tomorrowMin),
      updatedAt: formatTime(current.time),
      updatedLabel: `Обновлено ${formatTime(current.time)}`,
      source: 'open-meteo'
    };
  }

  function readCache() {
    const cached = window.absStorage?.getJson?.(CACHE_KEY, null);
    if (!cached?.data || !cached.savedAt) return null;
    return cached;
  }

  function getCachedWeather() {
    const cached = readCache();
    if (!cached) return null;
    return Date.now() - Number(cached.savedAt) <= CACHE_TTL_MS ? cached.data : null;
  }

  function getAnyCachedWeather() {
    return readCache()?.data || null;
  }

  function saveCache(data) {
    window.absStorage?.setJson?.(CACHE_KEY, {
      savedAt: Date.now(),
      data
    });
    return data;
  }

  async function fetchSaintPetersburgWeather() {
    const payload = await window.weatherApi.getSaintPetersburgWeather();
    return saveCache(normalizeWeatherPayload(payload));
  }

  window.weatherService = {
    CACHE_KEY,
    CACHE_TTL_MS,
    WEATHER_CODE_MAP,
    WEATHER_ICON_CLASS,
    createLoadingWeather,
    createUnavailableWeather,
    fetchSaintPetersburgWeather,
    formatTemperature,
    getAnyCachedWeather,
    getCachedWeather,
    normalizeWeatherPayload
  };
})();
