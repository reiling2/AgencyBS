(function () {
  'use strict';

  const SAINT_PETERSBURG_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast?latitude=59.9386&longitude=30.3141&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Europe%2FMoscow';

  async function getSaintPetersburgWeather(options = {}) {
    const response = await fetch(SAINT_PETERSBURG_FORECAST_URL, {
      cache: 'no-store',
      signal: options.signal
    });

    if (!response.ok) {
      throw new Error(`Weather request failed: ${response.status}`);
    }

    return response.json();
  }

  window.absApi = window.absApi || {};
  window.weatherApi = {
    getSaintPetersburgWeather
  };
  window.absApi.weather = window.weatherApi;
})();
