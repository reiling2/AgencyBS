(function () {
  'use strict';

  const DEFAULT_WEBSITE_SETTINGS = {
    showNewLeadBadge: true
  };

  function normalizeWebsiteSettings(settings = {}) {
    return {
      ...DEFAULT_WEBSITE_SETTINGS,
      ...(settings || {}),
      showNewLeadBadge: settings?.showNewLeadBadge !== false
    };
  }

  function normalizeSettings(settings = {}) {
    const rest = { ...(settings || {}) };
    delete rest.weather;
    return {
      ...rest,
      website: normalizeWebsiteSettings(settings.website)
    };
  }

  function get() {
    const db = window.localStorageAdapter.getDatabase();
    const settings = normalizeSettings(db.settings || {});
    return {
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
    const safeData = { ...(data || {}) };
    delete safeData.weather;
    const next = { ...current, ...safeData };
    if (safeData?.website) next.website = normalizeWebsiteSettings({ ...current.website, ...safeData.website });
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
