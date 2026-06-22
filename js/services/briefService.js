(function () {
  'use strict';

  function get(projectId) {
    return window.briefApi.getByProject(projectId);
  }

  function save(projectId, answers) {
    return window.briefApi.save(projectId, answers);
  }

  function addWordFile(projectId, fileData) {
    return window.fileService.addFile(projectId, fileData);
  }

  window.briefService = { addWordFile, get, save };
})();
