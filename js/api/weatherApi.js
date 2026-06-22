(function () {
  'use strict';

  const REQUEST_TIMEOUT_MS = 8000;

  function buildSaintPetersburgWeatherUrl() {
    const url = new URL('https://api.open-meteo.com/v1/forecast');

    url.search = new URLSearchParams({
      latitude: '59.9386',
      longitude: '30.3141',
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'weather_code',
        'wind_speed_10m'
      ].join(','),
      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'weather_code'
      ].join(','),
      timezone: 'Europe/Moscow',
      forecast_days: '2',
      wind_speed_unit: 'ms'
    }).toString();

    return url.toString();
  }

  async function getSaintPetersburgWeather(options = {}) {
    const controller = new AbortController();
    const timeoutMs = Number(options.timeoutMs || REQUEST_TIMEOUT_MS);
    const timeout = setTimeout(
      () => controller.abort(),
      Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : REQUEST_TIMEOUT_MS
    );

    const abortFromCaller = () => controller.abort();

    if (options.signal?.aborted) controller.abort();

    if (options.signal) {
      options.signal.addEventListener('abort', abortFromCaller, { once: true });
    }

    try {
      const response = await fetch(buildSaintPetersburgWeatherUrl(), {
        cache: 'no-store',
        signal: controller.signal
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

      if (
        !payload.daily?.temperature_2m_max ||
        !payload.daily?.temperature_2m_min
      ) {
        throw new Error('Weather response does not include daily temperature data');
      }

      return payload;
    } finally {
      clearTimeout(timeout);

      if (options.signal) {
        options.signal.removeEventListener('abort', abortFromCaller);
      }
    }
  }

  window.absApi = window.absApi || {};
  window.weatherApi = {
    getSaintPetersburgWeather,
    buildSaintPetersburgWeatherUrl
  };
  window.absApi.weather = window.weatherApi;
})();
