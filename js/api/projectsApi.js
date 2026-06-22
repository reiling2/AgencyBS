(function () {
  'use strict';
  function list() { return window.localStorageAdapter.list('projects'); }
  function getById(id) { return list().find(project => project.id === id) || null; }
  function create(data) {
    const db = window.localStorageAdapter.getDatabase();
    const project = { id: data.id || window.absIds.uid('project'), title: data.title || '', niche: data.niche || '', status: data.status || 'Подготовка к запуску', dealType: data.dealType || '', paymentType: data.paymentType || '', paymentDate: data.paymentDate || '', paymentAmount: Number(data.paymentAmount || 0), clientId: data.clientId || '', comment: data.comment || '', createdAt: data.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
    db.projects.unshift(project);
    window.localStorageAdapter.saveDatabase(db);
    return project;
  }
  function update(id, data) {
    const db = window.localStorageAdapter.getDatabase();
    db.projects = db.projects.map(project => project.id === id ? { ...project, ...data, updatedAt: new Date().toISOString() } : project);
    window.localStorageAdapter.saveDatabase(db);
    return db.projects.find(project => project.id === id) || null;
  }
  function remove(id) {
    const db = window.localStorageAdapter.getDatabase();
    db.projects = db.projects.filter(project => project.id !== id);
    db.projectStages = db.projectStages.filter(stage => stage.projectId !== id);
    db.projectMaterials = db.projectMaterials.filter(material => material.projectId !== id);
    db.projectFiles = db.projectFiles.filter(file => file.projectId !== id);
    db.briefAnswers = db.briefAnswers.filter(answer => answer.projectId !== id);
    db.calculatorResults = db.calculatorResults.filter(result => result.projectId !== id);
    db.reminders = db.reminders.filter(reminder => reminder.projectId !== id);
    window.localStorageAdapter.saveDatabase(db);
  }
  window.projectsApi = { create, delete: remove, getById, list, update };
  window.absApi.projects = window.projectsApi;
})();
