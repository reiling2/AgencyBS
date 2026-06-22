(function () {
  'use strict';
  function getByProject(projectId) {
    const answers = {};
    window.localStorageAdapter.list('briefAnswers').filter(answer => answer.projectId === projectId).forEach(answer => { answers[answer.section] = answer.answer; });
    return answers;
  }
  function save(projectId, answers) {
    const db = window.localStorageAdapter.getDatabase();
    db.briefAnswers = db.briefAnswers.filter(answer => answer.projectId !== projectId);
    Object.entries(answers || {}).forEach(([section, answer]) => db.briefAnswers.push({ id: window.absIds.uid('brief'), projectId, section, answer, updatedAt: new Date().toISOString() }));
    window.localStorageAdapter.saveDatabase(db);
    return getByProject(projectId);
  }
  window.briefApi = { getByProject, save };
  window.absApi.brief = window.briefApi;
})();
