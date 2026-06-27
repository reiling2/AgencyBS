(function () {
  'use strict';

  const listeners = new Set();
  let state = {
    currentUser: null,
    isAuthenticated: false,
    status: 'idle',
    error: null
  };

  function snapshot() {
    return {
      currentUser: state.currentUser ? { ...state.currentUser } : null,
      isAuthenticated: state.isAuthenticated,
      status: state.status,
      error: state.error
    };
  }

  function notify() {
    const next = snapshot();
    listeners.forEach(listener => listener(next));
    return next;
  }

  function get() {
    return snapshot();
  }

  function setUser(user) {
    const currentUser = user ? window.authApi?.sanitizeUser?.(user) || null : null;
    state = {
      currentUser,
      isAuthenticated: Boolean(currentUser),
      status: currentUser ? 'authenticated' : 'anonymous',
      error: null
    };
    return notify();
  }

  function setLoading() {
    state = { ...state, status: 'loading', error: null };
    return notify();
  }

  function setError(error) {
    state = {
      ...state,
      status: 'error',
      error: error?.message || String(error || 'Auth error')
    };
    return notify();
  }

  function clear() {
    state = {
      currentUser: null,
      isAuthenticated: false,
      status: 'anonymous',
      error: null
    };
    return notify();
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  window.authState = {
    clear,
    get,
    setError,
    setLoading,
    setUser,
    subscribe
  };
})();
