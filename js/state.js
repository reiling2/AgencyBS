(function () {
  'use strict';

  const constants = window.ABS_CONSTANTS || {};
  const defaults = {
    currentView: 'projects',
    selectedProjectId: null,
    sidebarOpen: false
  };
  const listeners = new Set();
  let state = { ...defaults, ...(window.localStorageAdapter?.get?.(constants.uiStateKey, {}) || {}) };

  function get() {
    return { ...state };
  }

  function set(patch = {}) {
    state = { ...state, ...patch };
    window.localStorageAdapter?.set?.(constants.uiStateKey, state);
    listeners.forEach(listener => listener(get()));
    return get();
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function reset() {
    state = { ...defaults };
    window.localStorageAdapter?.set?.(constants.uiStateKey, state);
    listeners.forEach(listener => listener(get()));
  }

  window.absState = { get, reset, set, subscribe };
})();
