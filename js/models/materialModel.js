(function () {
  'use strict';

  function createMaterial(data = {}) {
    return {
      id: data.id || window.absIds.uid('material'),
      projectId: data.projectId || '',
      title: data.title || data.label || '',
      status: data.status || 'не указано',
      comment: data.comment || data.note || '',
      updatedAt: data.updatedAt || new Date().toISOString()
    };
  }

  window.materialModel = { createMaterial };
})();
