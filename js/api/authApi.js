(function () {
  'use strict';

  const AUTH_ROLES = Object.freeze(['owner', 'admin', 'manager', 'avito_specialist', 'viewer']);
  const MOCK_CURRENT_USER = Object.freeze({
    id: 'mock-owner',
    name: 'Владелец',
    email: 'owner@agencybs.local',
    role: 'owner'
  });
  let mockSessionUser = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isBackendMode() {
    const config = window.absConfig || {};
    if (config.dataMode === 'mock') return false;
    return config.isBackendMode === true || config.dataMode === 'backend';
  }

  function getApiClient() {
    if (!window.absApiClient) {
      throw new Error('absApiClient is not available');
    }
    return window.absApiClient;
  }

  function sanitizeUser(user) {
    if (!user || typeof user !== 'object') return null;
    const id = String(user.id || '').trim();
    const email = String(user.email || '').trim();
    if (!id || !email) return null;
    const role = AUTH_ROLES.includes(user.role) ? user.role : 'viewer';
    return {
      id,
      name: String(user.name || '').trim(),
      email,
      role
    };
  }

  async function unwrapBackendResponse(response, fallback = null) {
    if (response?.ok) return response.data ?? fallback;
    throw response?.error || { message: 'Auth API request failed' };
  }

  function userFromPayload(payload) {
    return sanitizeUser(payload?.user || payload?.currentUser || payload);
  }

  const mockAuthApi = {
    getCurrentUser() {
      return mockSessionUser ? clone(mockSessionUser) : null;
    },
    login(credentials = {}) {
      const email = String(credentials.email || '').trim().toLowerCase();
      const password = String(credentials.password || '');
      if (email !== MOCK_CURRENT_USER.email || !password.trim()) {
        throw new Error('Неверный email или пароль');
      }
      mockSessionUser = clone(MOCK_CURRENT_USER);
      return clone(mockSessionUser);
    },
    logout() {
      mockSessionUser = null;
      return { success: true };
    }
  };

  const backendAuthApi = {
    async getCurrentUser() {
      const payload = await unwrapBackendResponse(await getApiClient().get('/auth/me'), null);
      return userFromPayload(payload);
    },
    async login(credentials = {}) {
      const payload = {
        email: credentials.email || '',
        password: credentials.password || ''
      };
      const data = await unwrapBackendResponse(await getApiClient().post('/auth/login', payload), null);
      return userFromPayload(data);
    },
    async logout() {
      return unwrapBackendResponse(await getApiClient().post('/auth/logout', {}), { success: true });
    }
  };

  function getActiveApi() {
    return isBackendMode() ? backendAuthApi : mockAuthApi;
  }

  function getCurrentUser() {
    return getActiveApi().getCurrentUser();
  }

  function login(credentials = {}) {
    return getActiveApi().login(credentials);
  }

  function logout() {
    return getActiveApi().logout();
  }

  window.absApi = window.absApi || {};
  window.authApi = {
    roles: AUTH_ROLES,
    getCurrentUser,
    login,
    logout,
    sanitizeUser
  };
  window.absApi.auth = window.authApi;
})();
