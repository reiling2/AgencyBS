(function () {
  'use strict';

  function list(projectId) {
    return window.localStorageAdapter.list('projectStages')
      .filter(stage => stage.projectId === projectId)
      .sort((left, right) => Number(left.order || 0) - Number(right.order || 0));
  }

  function ensureDefault(projectId) {
    const current = list(projectId);
    if (current.length) return current;
    const db = window.localStorageAdapter.getDatabase();
    const rows = window.localStorageAdapter.defaultStages(projectId);
    db.projectStages.push(...rows);
    window.localStorageAdapter.saveDatabase(db);
    return rows;
  }

  function update(stageId, data) {
    const db = window.localStorageAdapter.getDatabase();
    db.projectStages = db.projectStages.map(stage => stage.id === stageId
      ? { ...stage, ...data, completedAt: data.completed ? new Date().toISOString() : null, updatedAt: new Date().toISOString() }
      : stage);
    window.localStorageAdapter.saveDatabase(db);
    return db.projectStages.find(stage => stage.id === stageId) || null;
  }

  window.projectStageService = { ensureDefault, list, update };
})();
