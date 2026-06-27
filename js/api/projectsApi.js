(function () {
  'use strict';

  function isBackendMode() {
    return window.absConfig?.isBackendMode === true;
  }

  function getApiClient() {
    if (!window.absApiClient) {
      throw new Error('absApiClient is not available');
    }
    return window.absApiClient;
  }

  function projectPath(id = '') {
    return id ? `/projects/${encodeURIComponent(id)}` : '/projects';
  }

  function normalizeProject(project = {}) {
    return {
      ...project,
      id: project.id || '',
      title: project.title || '',
      niche: project.niche || '',
      status: project.status || 'Подготовка к запуску',
      dealType: project.dealType || '',
      paymentType: project.paymentType || '',
      paymentDate: project.paymentDate || '',
      paymentAmount: Number(project.paymentAmount || 0),
      clientId: project.clientId || '',
      comment: project.comment || '',
      createdAt: project.createdAt || new Date().toISOString(),
      updatedAt: project.updatedAt || new Date().toISOString()
    };
  }

  async function unwrapBackendResponse(response, fallback = null) {
    if (response?.ok) return response.data ?? fallback;
    throw response?.error || { message: 'Projects API request failed' };
  }

  const mockProjectsApi = {
    list() {
      return window.localStorageAdapter.list('projects');
    },
    getById(id) {
      return mockProjectsApi.list().find(project => project.id === id) || null;
    },
    create(data) {
      const db = window.localStorageAdapter.getDatabase();
      const project = { id: data.id || window.absIds.uid('project'), title: data.title || '', niche: data.niche || '', status: data.status || 'Подготовка к запуску', dealType: data.dealType || '', paymentType: data.paymentType || '', paymentDate: data.paymentDate || '', paymentAmount: Number(data.paymentAmount || 0), clientId: data.clientId || '', comment: data.comment || '', createdAt: data.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
      db.projects.unshift(project);
      window.localStorageAdapter.saveDatabase(db);
      return project;
    },
    update(id, data) {
      const db = window.localStorageAdapter.getDatabase();
      db.projects = db.projects.map(project => project.id === id ? { ...project, ...data, updatedAt: new Date().toISOString() } : project);
      window.localStorageAdapter.saveDatabase(db);
      return db.projects.find(project => project.id === id) || null;
    },
    delete(id) {
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
  };

  const backendProjectsApi = {
    async list() {
      const data = await unwrapBackendResponse(await getApiClient().get(projectPath()), []);
      const rows = Array.isArray(data) ? data : (Array.isArray(data?.projects) ? data.projects : []);
      return rows.map(normalizeProject);
    },
    async getById(id) {
      if (!id) return null;
      const data = await unwrapBackendResponse(await getApiClient().get(projectPath(id)), null);
      return data ? normalizeProject(data.project || data) : null;
    },
    async create(data) {
      const project = await unwrapBackendResponse(await getApiClient().post(projectPath(), data), null);
      return project ? normalizeProject(project.project || project) : null;
    },
    async update(id, data) {
      if (!id) return null;
      const project = await unwrapBackendResponse(await getApiClient().patch(projectPath(id), data), null);
      return project ? normalizeProject(project.project || project) : null;
    },
    async delete(id) {
      if (!id) return null;
      await unwrapBackendResponse(await getApiClient().delete(projectPath(id)), null);
      return null;
    }
  };

  function getActiveApi() {
    return isBackendMode() ? backendProjectsApi : mockProjectsApi;
  }

  function list() {
    return getActiveApi().list();
  }

  function getById(id) {
    return getActiveApi().getById(id);
  }

  function create(data) {
    return getActiveApi().create(data);
  }

  function update(id, data) {
    return getActiveApi().update(id, data);
  }

  function remove(id) {
    return getActiveApi().delete(id);
  }

  window.projectsApi = { create, delete: remove, getById, list, update };
  window.absApi.projects = window.projectsApi;
})();
