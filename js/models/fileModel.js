(function () {
  'use strict';

  function createFile(data = {}) {
    return {
      id: data.id || window.absIds.uid('file'),
      projectId: data.projectId || '',
      name: data.name || 'Файл',
      type: data.type || 'file',
      size: Number(data.size || 0),
      storageKey: data.storageKey || data.dataUrl || '',
      createdAt: data.createdAt || new Date().toISOString()
    };
  }

  window.fileModel = { createFile };
})();
