(function () {
  'use strict';
  function get() {
    const db = window.localStorageAdapter.getDatabase();
    return { theme: db.settings?.theme || window.absStorage.getString(window.ABS_CONSTANTS.themeKey, 'light') || 'light', statisticsFilters: db.settings?.statisticsFilters || null, statisticsMetricSettings: db.settings?.statisticsMetricSettings || null };
  }
  function update(data) {
    const db = window.localStorageAdapter.getDatabase();
    db.settings = { ...(db.settings || {}), ...(data || {}) };
    window.localStorageAdapter.saveDatabase(db);
    if (data && data.theme) window.absStorage.setString(window.ABS_CONSTANTS.themeKey, data.theme);
    return db.settings;
  }
  function getTheme() { return get().theme === 'dark' ? 'dark' : 'light'; }
  function setTheme(theme) { return update({ theme: theme === 'dark' ? 'dark' : 'light' }); }
  window.settingsApi = { get, getTheme, setTheme, update };
  window.absApi.settings = window.settingsApi;
})();
