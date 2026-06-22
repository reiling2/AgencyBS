(function () {
  'use strict';

  function listProjects() {
    return window.projectsApi.list();
  }

  function getProject(id) {
    return window.projectsApi.getById(id);
  }

  function createProject(data) {
    const client = window.clientsApi.create(window.clientModel.createClient({
      id: data.clientId,
      fullName: data.clientName || data.fullName,
      phone: data.phone,
      email: data.email
    }));
    const project = window.projectsApi.create(window.projectModel.createProject({ ...data, clientId: client.id }));
    window.projectStageService.ensureDefault(project.id);
    window.projectMaterialService.ensureDefault(project.id);
    return project;
  }

  function updateProject(id, data) {
    return window.projectsApi.update(id, data);
  }

  function deleteProject(id) {
    return window.projectsApi.delete(id);
  }

  window.projectService = { createProject, deleteProject, getProject, listProjects, updateProject };
})();
