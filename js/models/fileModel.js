(function () {
  'use strict';

  function createFile(data = {}) {
    const name = data.name || 'Файл';
    const extension = String(data.extension || name.split('.').pop() || '').toLowerCase();
    const previewExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'mp4', 'webm', 'txt', 'csv', 'json'];
    return {
      id: data.id || window.absIds.uid('file'),
      projectId: data.projectId || '',
      name,
      type: data.type || 'file',
      size: Number(data.size || 0),
      extension,
      storageKey: data.storageKey || '',
      previewAvailable: Boolean(data.previewAvailable ?? previewExtensions.includes(extension)),
      createdAt: data.createdAt || new Date().toISOString()
    };
  }

  window.fileModel = { createFile };
})();
