(function () {
  'use strict';

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

  function avitoPath(projectId, connectionId = '', action = '') {
    const base = `/projects/${encodeURIComponent(projectId)}/avito/connections`;
    if (!connectionId) return base;
    const connectionPath = `${base}/${encodeURIComponent(connectionId)}`;
    return action ? `${connectionPath}/${action}` : connectionPath;
  }

  function normalizeConnection(projectId, connection = {}) {
    return {
      id: connection.id || window.absIds?.uid?.('avito') || '',
      projectId: connection.projectId || projectId || '',
      accountId: connection.accountId || '',
      accountName: connection.accountName || '',
      avitoUserId: connection.avitoUserId || connection.profileId || '',
      connected: Boolean(connection.connected),
      status: connection.status || (connection.connected ? 'active' : 'draft'),
      lastSyncAt: connection.lastSyncAt || null,
      syncError: connection.syncError || null,
      updatedAt: connection.updatedAt || new Date().toISOString()
    };
  }

  async function unwrapBackendResponse(response, fallback = null) {
    if (response?.ok) return response.data ?? fallback;
    throw response?.error || { message: 'Avito API request failed' };
  }

  const mockAvitoApi = {
    listConnections(projectId) {
      const rows = window.localStorageAdapter.list('avitoConnections');
      const filtered = projectId ? rows.filter(item => item.projectId === projectId) : rows;
      return filtered.map(item => normalizeConnection(item.projectId || projectId, item));
    },
    saveConnection(projectId, connection) {
      const db = window.localStorageAdapter.getDatabase();
      const row = normalizeConnection(projectId, connection);
      db.avitoConnections = db.avitoConnections.filter(item => item.id !== row.id);
      db.avitoConnections.push(row);
      window.localStorageAdapter.saveDatabase(db);
      return row;
    },
    deleteConnection(projectId, connectionId) {
      const db = window.localStorageAdapter.getDatabase();
      db.avitoConnections = db.avitoConnections.filter(item => item.id !== connectionId || item.projectId !== projectId);
      window.localStorageAdapter.saveDatabase(db);
      return null;
    },
    syncConnection(projectId, connectionId) {
      const db = window.localStorageAdapter.getDatabase();
      let synced = null;
      db.avitoConnections = db.avitoConnections.map(item => {
        if (item.id !== connectionId || item.projectId !== projectId) return item;
        synced = normalizeConnection(projectId, { ...item, connected: true, status: 'active', lastSyncAt: new Date().toISOString(), syncError: null });
        return synced;
      });
      window.localStorageAdapter.saveDatabase(db);
      return synced;
    }
  };

  const backendAvitoApi = {
    async listConnections(projectId) {
      if (!projectId) return [];
      const data = await unwrapBackendResponse(await getApiClient().get(avitoPath(projectId)), []);
      const rows = Array.isArray(data) ? data : (Array.isArray(data?.connections) ? data.connections : []);
      return rows.map(item => normalizeConnection(projectId, item));
    },
    async saveConnection(projectId, connection) {
      if (!projectId) return null;
      const data = await unwrapBackendResponse(await getApiClient().post(avitoPath(projectId), normalizeConnection(projectId, connection)), null);
      return data ? normalizeConnection(projectId, data.connection || data) : null;
    },
    async deleteConnection(projectId, connectionId) {
      if (!projectId || !connectionId) return null;
      await unwrapBackendResponse(await getApiClient().delete(avitoPath(projectId, connectionId)), null);
      return null;
    },
    async syncConnection(projectId, connectionId) {
      if (!projectId || !connectionId) return null;
      const data = await unwrapBackendResponse(await getApiClient().post(avitoPath(projectId, connectionId, 'sync'), {}), null);
      return data ? normalizeConnection(projectId, data.connection || data) : null;
    }
  };

  function getActiveApi() {
    return isBackendMode() ? backendAvitoApi : mockAvitoApi;
  }

  function listConnections(projectId) {
    return getActiveApi().listConnections(projectId);
  }

  function saveConnection(projectId, connection) {
    return getActiveApi().saveConnection(projectId, connection);
  }

  function deleteConnection(projectId, connectionId) {
    return getActiveApi().deleteConnection(projectId, connectionId);
  }

  function syncConnection(projectId, connectionId) {
    return getActiveApi().syncConnection(projectId, connectionId);
  }

  window.avitoApi = { deleteConnection, listConnections, saveConnection, syncConnection };
  window.absApi.avito = window.avitoApi;
})();
