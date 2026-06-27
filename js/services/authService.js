(function () {
  'use strict';

  const PERMISSIONS = Object.freeze({
    manageProjects: ['owner', 'admin', 'manager'],
    manageAvito: ['owner', 'admin', 'avito_specialist'],
    viewStatistics: ['owner', 'admin', 'manager', 'avito_specialist', 'viewer'],
    manageWebsite: ['owner', 'admin', 'manager'],
    manageSettings: ['owner', 'admin'],
    viewReports: ['owner', 'admin', 'manager', 'viewer']
  });

  function normalizeRoles(roles) {
    return Array.isArray(roles) ? roles : [roles].filter(Boolean);
  }

  function getStateUser() {
    return window.authState?.get?.().currentUser || null;
  }

  function getCurrentUser() {
    const currentUser = getStateUser();
    if (currentUser) return currentUser;

    try {
      const result = window.authApi.getCurrentUser();
      if (result && typeof result.then === 'function') {
        window.authState?.setLoading?.();
        return result
          .then(user => {
            window.authState?.setUser?.(user);
            return user;
          })
          .catch(error => {
            window.authState?.setError?.(error);
            throw error;
          });
      }

      window.authState?.setUser?.(result);
      return result;
    } catch (error) {
      window.authState?.setError?.(error);
      throw error;
    }
  }

  function isAuthenticated() {
    return Boolean(getStateUser());
  }

  function hasRole(role) {
    return getStateUser()?.role === role;
  }

  function hasAnyRole(roles) {
    const allowedRoles = normalizeRoles(roles);
    const role = getStateUser()?.role;
    return Boolean(role && allowedRoles.includes(role));
  }

  function can(permission) {
    return hasAnyRole(PERMISSIONS[permission] || []);
  }

  function login(credentials = {}) {
    window.authState?.setLoading?.();
    let result;
    try {
      result = window.authApi.login(credentials);
    } catch (error) {
      window.authState?.setError?.(error);
      return Promise.reject(error);
    }

    return Promise.resolve(result)
      .then(user => {
        window.authState?.setUser?.(user);
        return user;
      })
      .catch(error => {
        window.authState?.setError?.(error);
        throw error;
      });
  }

  function logout() {
    window.authState?.setLoading?.();
    let result;
    try {
      result = window.authApi.logout();
    } catch (error) {
      window.authState?.setError?.(error);
      return Promise.reject(error);
    }

    return Promise.resolve(result)
      .finally(() => {
        window.authState?.clear?.();
      });
  }

  window.authService = {
    can,
    getCurrentUser,
    hasAnyRole,
    hasRole,
    isAuthenticated,
    login,
    logout,
    permissions: PERMISSIONS,
    roles: window.authApi?.roles || []
  };
})();
