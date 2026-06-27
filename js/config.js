(function () {
  'use strict';

  const DATA_MODES = Object.freeze({
    MOCK: 'mock',
    BACKEND: 'backend'
  });

  const DEFAULTS = Object.freeze({
    dataMode: DATA_MODES.MOCK,
    apiBaseUrl: '/api',
    environment: 'development'
  });

  function normalizeDataMode(value) {
    return value === DATA_MODES.BACKEND ? DATA_MODES.BACKEND : DATA_MODES.MOCK;
  }

  function normalizeApiBaseUrl(value) {
    const url = String(value || DEFAULTS.apiBaseUrl).trim();
    return url || DEFAULTS.apiBaseUrl;
  }

  function detectProduction() {
    const hostname = window.location.hostname;
    const localHosts = new Set(['', 'localhost', '127.0.0.1', '::1']);
    return window.location.protocol === 'https:' && !localHosts.has(hostname);
  }

  const runtimeConfig = window.__ABS_CONFIG__ || {};
  const dataMode = normalizeDataMode(runtimeConfig.dataMode || DEFAULTS.dataMode);
  const isProduction = typeof runtimeConfig.isProduction === 'boolean'
    ? runtimeConfig.isProduction
    : detectProduction();

  window.absConfig = Object.freeze({
    dataMode,
    apiBaseUrl: normalizeApiBaseUrl(runtimeConfig.apiBaseUrl || DEFAULTS.apiBaseUrl),
    environment: runtimeConfig.environment || (isProduction ? 'production' : DEFAULTS.environment),
    isProduction,
    isDevelopment: !isProduction,
    isMockMode: dataMode === DATA_MODES.MOCK,
    isBackendMode: dataMode === DATA_MODES.BACKEND,
    dataModes: DATA_MODES
  });
})();
