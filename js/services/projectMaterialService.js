(function () {
  'use strict';

  function list(projectId) {
    return window.localStorageAdapter.list('projectMaterials').filter(material => material.projectId === projectId);
  }

  function ensureDefault(projectId) {
    const current = list(projectId);
    if (current.length) return current;
    const db = window.localStorageAdapter.getDatabase();
    const rows = window.localStorageAdapter.defaultMaterials(projectId);
    db.projectMaterials.push(...rows);
    window.localStorageAdapter.saveDatabase(db);
    return rows;
  }

  function update(materialId, data) {
    const db = window.localStorageAdapter.getDatabase();
    db.projectMaterials = db.projectMaterials.map(material => material.id === materialId
      ? { ...material, ...data, updatedAt: new Date().toISOString() }
      : material);
    window.localStorageAdapter.saveDatabase(db);
    return db.projectMaterials.find(material => material.id === materialId) || null;
  }

  window.projectMaterialService = { ensureDefault, list, update };
})();
