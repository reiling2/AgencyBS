(function () {
  'use strict';

  function createStage(data = {}) {
    const now = new Date().toISOString();
    return {
      id: data.id || window.absIds.uid('stage'),
      projectId: data.projectId || '',
      order: Number(data.order || 0),
      title: data.title || '',
      description: data.description || data.text || '',
      completed: Boolean(data.completed),
      completedAt: data.completedAt || null,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    };
  }

  window.stageModel = { createStage };
})();
