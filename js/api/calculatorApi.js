(function () {
  'use strict';
  function listResults(projectId) {
    const rows = window.localStorageAdapter.list('calculatorResults');
    return projectId ? rows.filter(result => result.projectId === projectId) : rows;
  }
  function saveResult(projectId, result) {
    const db = window.localStorageAdapter.getDatabase();
    const row = { id: result.id || window.absIds.uid('calc'), projectId, title: result.title || 'KPI проекта', budget: Number(result.budget || 0), leads: Number(result.leads || 0), leadsPerWeek: Number(result.leadsPerWeek || result.weeklyLeadsGoal || 0), cpc: Number(result.cpc || 0), desiredCpc: Number(result.desiredCpc || 0), cpl: Number(result.cpl || 0), createdAt: result.createdAt || new Date().toISOString() };
    db.calculatorResults.push(row);
    window.localStorageAdapter.saveDatabase(db);
    return row;
  }
  window.calculatorApi = { listResults, saveResult };
  window.absApi.calculator = window.calculatorApi;
})();
