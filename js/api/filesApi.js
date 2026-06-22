(function () {
  'use strict';
  function listByProject(projectId) { return window.localStorageAdapter.list('projectFiles').filter(file => file.projectId === projectId); }
  function upload(projectId, fileData) {
    const db = window.localStorageAdapter.getDatabase();
    const id = fileData.id || window.absIds.uid('file');
    const name = fileData.name || 'Файл';
    const extension = String(fileData.extension || name.split('.').pop() || '').toLowerCase();
    const previewExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'mp4', 'webm', 'txt', 'csv', 'json'];
    const file = {
      id,
      projectId,
      name,
      type: fileData.type || '',
      size: Number(fileData.size || 0),
      extension,
      storageKey: fileData.storageKey || `project-file:${projectId}:${id}`,
      previewAvailable: Boolean(fileData.previewAvailable ?? previewExtensions.includes(extension)),
      createdAt: fileData.createdAt || new Date().toISOString()
    };
    db.projectFiles = Array.isArray(db.projectFiles) ? db.projectFiles.filter(item => item.id !== id) : [];
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
