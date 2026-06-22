(function () {
  'use strict';

  function listFiles(projectId) {
    return window.filesApi.listByProject(projectId);
  }

  function addFile(projectId, fileData) {
    return window.filesApi.upload(projectId, window.fileModel.createFile({ ...fileData, projectId }));
  }

  function removeFile(fileId) {
    return window.filesApi.delete(fileId);
  }

  window.fileService = { addFile, listFiles, removeFile };
})();
