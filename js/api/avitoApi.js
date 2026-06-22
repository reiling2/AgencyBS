(function () {
  'use strict';
  function listConnections(projectId) {
    const rows = window.localStorageAdapter.list('avitoConnections');
    return projectId ? rows.filter(item => item.projectId === projectId) : rows;
  }
  function saveConnection(projectId, connection) {
    const db = window.localStorageAdapter.getDatabase();
    const row = { id: connection.id || window.absIds.uid('avito'), projectId, accountId: connection.accountId || '', accountName: connection.accountName || '', connected: Boolean(connection.connected), updatedAt: new Date().toISOString() };
    db.avitoConnections = db.avitoConnections.filter(item => item.id !== row.id);
    db.avitoConnections.push(row);
    window.localStorageAdapter.saveDatabase(db);
    return row;
  }
  window.avitoApi = { listConnections, saveConnection };
  window.absApi.avito = window.avitoApi;
})();
