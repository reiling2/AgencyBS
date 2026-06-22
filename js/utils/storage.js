(function () {
  'use strict';

  function getJson(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.warn('Storage read error', key, err);
      return fallback;
    }
  }

  function setJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function remove(key) {
    localStorage.removeItem(key);
  }

  function getString(key, fallback = '') {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  }

  function setString(key, value) {
    localStorage.setItem(key, String(value));
    return value;
  }

  window.absStorage = {
    getJson,
    getString,
    remove,
    setJson,
    setString
  };
})();
