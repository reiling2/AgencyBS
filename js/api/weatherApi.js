(function () {
  'use strict';

  const SAINT_PETERSBURG_FORECAST_URL =
    'https://api.open-meteo.com/v1/forecast?latitude=59.9386&longitude=30.3141&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Europe%2FMoscow';

  async function getSaintPetersburgWeather(options = {}) {
    const response = await fetch(SAINT_PETERSBURG_FORECAST_URL, {
      cache: 'no-store',
      signal: options.signal
    });

    if (!response.ok) {
      throw new Error(`Weather request failed: ${response.status}`);
    }

    const payload = await response.json();
    if (
      !payload?.current ||
      payload.current.temperature_2m === undefined ||
      payload.current.relative_humidity_2m === undefined ||
      payload.current.weather_code === undefined ||
      payload.current.wind_speed_10m === undefined ||
      !payload.current.time
    ) {
      throw new Error('Weather response does not include current data');
    }
    if (!payload.daily?.temperature_2m_max || !payload.daily?.temperature_2m_min) {
      throw new Error('Weather response does not include daily temperature data');
    }
    return payload;
  }

  window.absApi = window.absApi || {};
  window.weatherApi = {
    getSaintPetersburgWeather
  };
  window.absApi.weather = window.weatherApi;
})();
