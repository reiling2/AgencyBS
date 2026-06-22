(function () {
  'use strict';

  const DEFAULT_WEATHER_SETTINGS = {
    showSidebarWeather: true
  };
  const DEFAULT_WEBSITE_SETTINGS = {
    showNewLeadBadge: true
  };

  function normalizeWeatherSettings(settings = {}) {
    return {
      ...DEFAULT_WEATHER_SETTINGS,
      ...(settings || {}),
      showSidebarWeather: settings?.showSidebarWeather !== false
    };
  }

  function normalizeWebsiteSettings(settings = {}) {
    return {
      ...DEFAULT_WEBSITE_SETTINGS,
      ...(settings || {}),
      showNewLeadBadge: settings?.showNewLeadBadge !== false
    };
  }

  function normalizeSettings(settings = {}) {
    return {
      ...(settings || {}),
      website: normalizeWebsiteSettings(settings.website),
      weather: normalizeWeatherSettings(settings.weather)
    };
  }

  function get() {
    const db = window.localStorageAdapter.getDatabase();
    const settings = normalizeSettings(db.settings || {});
    return {
      ...(db.settings || {}),
      ...settings,
      theme: settings.theme || window.absStorage.getString(window.ABS_CONSTANTS.themeKey, 'light') || 'light',
      statisticsFilters: settings.statisticsFilters || null,
      statisticsMetricSettings: settings.statisticsMetricSettings || null,
      websiteSettings: settings.websiteSettings || null
    };
  }
  function update(data) {
    const db = window.localStorageAdapter.getDatabase();
    const current = normalizeSettings(db.settings || {});
    const next = { ...current, ...(data || {}) };
    if (data?.website) next.website = normalizeWebsiteSettings({ ...current.website, ...data.website });
    if (data?.weather) next.weather = normalizeWeatherSettings({ ...current.weather, ...data.weather });
    db.settings = normalizeSettings(next);
    window.localStorageAdapter.saveDatabase(db);
    if (data && data.theme) window.absStorage.setString(window.ABS_CONSTANTS.themeKey, data.theme);
    return db.settings;
  }
  function getTheme() { return get().theme === 'dark' ? 'dark' : 'light'; }
  function setTheme(theme) { return update({ theme: theme === 'dark' ? 'dark' : 'light' }); }
  window.settingsApi = { get, getTheme, setTheme, update };
  window.absApi.settings = window.settingsApi;
})();
