(function () {
  'use strict';
  function listByProject(projectId) { return window.localStorageAdapter.list('projectFiles').filter(file => file.projectId === projectId); }
  function upload(projectId, fileData) {
    const db = window.localStorageAdapter.getDatabase();
    const file = { id: fileData.id || window.absIds.uid('file'), projectId, name: fileData.name || 'Файл', type: fileData.type || '', size: Number(fileData.size || 0), storageKey: fileData.storageKey || fileData.dataUrl || '', createdAt: fileData.createdAt || new Date().toISOString() };
    db.projectFiles.push(file);
    window.localStorageAdapter.saveDatabase(db);
    return file;
  }
  function remove(fileId) {
    const db = window.localStorageAdapter.getDatabase();
    db.projectFiles = db.projectFiles.filter(file => file.id !== fileId);
    window.localStorageAdapter.saveDatabase(db);
  }
  window.filesApi = { delete: remove, listByProject, upload };
  window.absApi.files = window.filesApi;
})();
