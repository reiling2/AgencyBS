(function () {
  'use strict';

  let lastWeather = null;
  let refreshPromise = null;

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

  function isDisplayValue(value) {
    return value !== undefined && value !== null && !['undefined', 'NaN', 'Infinity', '-Infinity'].includes(String(value));
  }

  function safeText(value, fallback = '—') {
    return isDisplayValue(value) ? value : fallback;
  }

  function shouldShowWeather() {
    return window.settingsApi?.get?.()?.weather?.showSidebarWeather !== false;
  }

  function render(target, weatherData) {
    const root = getRoot(target);
    if (!root || !window.weatherService) return;
    root.hidden = false;
    root.setAttribute('role', 'button');
    root.setAttribute('tabindex', '0');
    root.setAttribute('title', 'Обновить погоду');

    const weather = normalizeWeather(weatherData || lastWeather || window.weatherService.createLoadingWeather());
    const weatherKey = safeText(weather.weatherKey, 'unavailable');
    const iconClass = safeText(weather.iconClass, window.weatherService.WEATHER_ICON_CLASS.unavailable);
    lastWeather = weather;
    root.innerHTML = `
      <section class="weather-card" data-weather="${escapeHtml(weatherKey)}" aria-label="Погода в Санкт-Петербурге">
        <div class="weather-top">
          <div>
            <div class="weather-label">Погода</div>
            <div class="weather-city">${escapeHtml(safeText(weather.city, 'Санкт-Петербург'))}</div>
          </div>
          <div class="weather-icon" aria-hidden="true">
            <div class="icon ${escapeHtml(iconClass)}"></div>
          </div>
        </div>
        <div class="weather-main">
          <div class="weather-temp">${escapeHtml(safeText(weather.temperatureLabel))}</div>
          <div class="weather-condition">${escapeHtml(safeText(weather.condition, 'Данные недоступны'))}</div>
        </div>
        <div class="weather-bottom">
          <div class="weather-chip">
            <div class="chip-label">Сегодня</div>
            <div class="chip-value">${escapeHtml(safeText(weather.todayRange))}</div>
          </div>
          <div class="weather-chip">
            <div class="chip-label">Завтра</div>
            <div class="chip-value">${escapeHtml(safeText(weather.tomorrowRange))}</div>
          </div>
        </div>
        <div class="weather-note">${escapeHtml(safeText(weather.updatedLabel, 'Нет связи, нажмите для повтора'))}</div>
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
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
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
      } finally {
        refreshPromise = null;
      }
    })();
    return refreshPromise;
  }

  function init(target = 'sidebarWeatherWidget') {
    const root = getRoot(target);
    if (!root || !window.weatherService) return;
    if (!shouldShowWeather()) {
      destroy(root);
      return;
    }

    root.onclick = () => refresh(root);
    root.onkeydown = event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      refresh(root);
    };

    render(root, window.weatherService.createLoadingWeather());
    const cached = window.weatherService.getCachedWeather() || window.weatherService.getAnyCachedWeather();

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
    root.removeAttribute('role');
    root.removeAttribute('tabindex');
    root.removeAttribute('title');
    root.onclick = null;
    root.onkeydown = null;
    lastWeather = null;
    refreshPromise = null;
  }

  window.weatherWidget = {
    destroy,
    init,
    refresh,
    render
  };
})();
