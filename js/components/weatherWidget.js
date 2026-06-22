(function () {
  'use strict';

  let lastWeather = null;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getRoot(target) {
    if (typeof target === 'string') return document.getElementById(target);
    return target || document.getElementById('sidebarWeatherWidget');
  }

  function normalizeWeather(data) {
    return {
      ...window.weatherService.createUnavailableWeather(),
      ...(data || {})
    };
  }

  function shouldShowWeather() {
    return window.settingsApi?.get?.().weather?.showSidebarWeather !== false;
  }

  function render(target, weatherData) {
    const root = getRoot(target);
    if (!root || !window.weatherService) return;
    root.hidden = false;

    const weather = normalizeWeather(weatherData || lastWeather || window.weatherService.createLoadingWeather());
    lastWeather = weather;
    root.innerHTML = `
      <section class="sidebar-weather-card" data-weather="${escapeHtml(weather.weatherKey)}" aria-label="Погода в Санкт-Петербурге">
        <div class="weather-top">
          <div>
            <div class="weather-label">Погода</div>
            <div class="weather-city">${escapeHtml(weather.city)}</div>
          </div>
          <div class="weather-icon" aria-hidden="true">
            <div class="weather-glyph ${escapeHtml(weather.iconClass)}"></div>
          </div>
        </div>
        <div class="weather-main">
          <div class="weather-temp">${escapeHtml(weather.temperatureLabel)}</div>
          <div class="weather-condition">${escapeHtml(weather.condition)}</div>
        </div>
        <div class="weather-bottom">
          <div class="weather-chip">
            <div class="chip-label">Сегодня</div>
            <div class="chip-value">${escapeHtml(weather.todayRange)}</div>
          </div>
          <div class="weather-chip">
            <div class="chip-label">Завтра</div>
            <div class="chip-value">${escapeHtml(weather.tomorrowRange)}</div>
          </div>
        </div>
        <div class="weather-note">${escapeHtml(weather.updatedLabel)}</div>
      </section>
    `;
  }

  async function refresh(target) {
    const root = getRoot(target);
    if (!root || !window.weatherService) return null;
    if (!shouldShowWeather()) {
      destroy(root);
      return null;
    }

    try {
      const freshWeather = await window.weatherService.fetchSaintPetersburgWeather();
      if (!shouldShowWeather()) {
        destroy(root);
        return null;
      }
      render(root, freshWeather);
      return freshWeather;
    } catch (err) {
      console.warn('Weather widget update failed', err);
      const cached = window.weatherService.getAnyCachedWeather();
      const fallback = cached || window.weatherService.createUnavailableWeather();
      render(root, fallback);
      return fallback;
    }
  }

  function init(target = 'sidebarWeatherWidget') {
    const root = getRoot(target);
    if (!root || !window.weatherService) return;
    if (!shouldShowWeather()) {
      destroy(root);
      return;
    }

    render(root, window.weatherService.createLoadingWeather());
    const cached = window.weatherService.getCachedWeather();

    if (cached) {
      render(root, cached);
      refresh(root);
      return;
    }

    refresh(root);
  }

  function destroy(target = 'sidebarWeatherWidget') {
    const root = getRoot(target);
    if (!root) return;
    root.innerHTML = '';
    root.hidden = true;
    lastWeather = null;
  }

  window.weatherWidget = {
    destroy,
    init,
    refresh,
    render
  };
})();
