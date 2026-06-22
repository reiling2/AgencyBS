(function () {
  'use strict';

  const constants = window.ABS_CONSTANTS;

  function createEmptyDatabase() {
    return {
      schemaVersion: constants.schemaVersion,
      projects: [],
      clients: [],
      projectStages: [],
      projectMaterials: [],
      projectFiles: [],
      briefAnswers: [],
      calculatorResults: [],
      reminders: [],
      avitoConnections: [],
      avitoDailyStats: [],
      avitoFinance: [],
      websiteLeads: [],
      websiteEvents: [],
      websitePageViews: [],
      websiteVisitors: [],
      websiteSessions: [],
      websiteErrors: [],
      websitePages: [],
      websitePagePerformance: [],
      websiteContentBlocks: [],
      websiteForms: [],
      websiteMedia: [],
      websiteSeoSettings: null,
      websiteSiteSettings: null,
      knowledgeBaseItems: [],
      settings: { theme: 'light' }
    };
  }

  function defaultStages(projectId, existingStages = []) {
    return constants.defaultStageTitles.map((title, index) => {
      const saved = existingStages[index] || existingStages.find(stage => stage.title === title) || {};
      const now = new Date().toISOString();
      return {
        id: saved.id || window.absIds.uid('stage'),
        projectId,
        order: index + 1,
        title,
        description: saved.text || saved.description || '',
        completed: Boolean(saved.completed),
        completedAt: saved.completedAt || null,
        createdAt: saved.createdAt || now,
        updatedAt: saved.updatedAt || now
      };
    });
  }

  function defaultMaterials(projectId, existingMaterials = []) {
    return constants.defaultMaterialTitles.map(title => {
      const saved = existingMaterials.find(material => material.label === title || material.title === title) || {};
      return {
        id: saved.id || window.absIds.uid('material'),
        projectId,
        title,
        status: saved.status || 'не указано',
        comment: saved.note || saved.comment || '',
        updatedAt: saved.updatedAt || new Date().toISOString()
      };
    });
  }

  function migrateLegacyState(legacyState) {
    const db = createEmptyDatabase();
    const projects = Array.isArray(legacyState?.projects) ? legacyState.projects : [];

    projects.forEach(legacyProject => {
      const now = new Date().toISOString();
      const clientId = legacyProject.clientId || window.absIds.uid('client');
      const projectId = legacyProject.id || window.absIds.uid('project');
      const email = projectId === 'demo-project' && legacyProject.email === 'client@example.ru' ? '' : (legacyProject.email || '');

      db.clients.push({
        id: clientId,
        fullName: legacyProject.clientName || '',
        phone: legacyProject.phone || '',
        email,
        createdAt: legacyProject.createdAt || now,
        updatedAt: legacyProject.updatedAt || now
      });

      db.projects.push({
        id: projectId,
        title: legacyProject.title || 'Новый проект',
        niche: legacyProject.niche || '',
        status: legacyProject.status || 'Подготовка к запуску',
        dealType: legacyProject.dealType || '',
        paymentType: legacyProject.paymentType || '',
        paymentDate: legacyProject.paymentDate || '',
        paymentAmount: Number(legacyProject.paymentAmount || 0),
        clientId,
        comment: legacyProject.comment || '',
        createdAt: legacyProject.createdAt || now,
        updatedAt: legacyProject.updatedAt || now
      });

      db.projectStages.push(...defaultStages(projectId, legacyProject.stages || []));
      db.projectMaterials.push(...defaultMaterials(projectId, legacyProject.materials || []));

      (legacyProject.files || []).forEach(file => {
        db.projectFiles.push({
          id: file.id || window.absIds.uid('file'),
          projectId,
          name: file.name || 'Файл',
          type: file.type || '',
          size: Number(file.size || 0),
          storageKey: file.dataUrl || file.storageKey || '',
          createdAt: file.createdAt || now
        });
      });

      Object.entries(legacyProject.brief || {}).forEach(([section, answer]) => {
        db.briefAnswers.push({
          id: window.absIds.uid('brief'),
          projectId,
          section,
          answer: answer || '',
          updatedAt: legacyProject.updatedAt || now
        });
      });

      (legacyProject.calculations || []).forEach(result => {
        db.calculatorResults.push({
          id: result.id || window.absIds.uid('calc'),
          projectId,
          title: result.title || 'KPI проекта',
          budget: Number(result.budget || 0),
          leads: Number(result.leads || 0),
          leadsPerWeek: Number(result.weeklyLeadsGoal || result.leadsPerWeek || 0),
          cpc: Number(result.cpc || 0),
          desiredCpc: Number(result.desiredCpc || 0),
          cpl: Number(result.cpl || 0),
          createdAt: result.createdAt || now
        });
      });

      if (legacyProject.reminder) {
        db.reminders.push({
          id: legacyProject.reminder.id || window.absIds.uid('reminder'),
          projectId,
          type: legacyProject.reminder.type || 'conditional-refusal-call',
          title: legacyProject.reminder.title || 'Позвонить клиенту',
          dueDate: legacyProject.reminder.date || legacyProject.reminder.dueDate || '',
          repeatRule: legacyProject.reminder.repeat || legacyProject.reminder.repeatRule || 'monthly',
          active: legacyProject.reminder.active !== false,
          createdAt: legacyProject.reminder.createdAt || now
        });
      }
    });

    if (Array.isArray(legacyState?.knowledge)) {
      db.knowledgeBaseItems = legacyState.knowledge.map(item => ({
        id: item.id || window.absIds.uid('knowledge'),
        title: item.title || '',
        type: item.type || 'Заметка',
        category: item.category || '',
        url: item.url || '',
        content: item.content || '',
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString()
      }));
    }

    db.settings.theme = window.absStorage.getString(constants.themeKey, 'light') === 'dark' ? 'dark' : 'light';
    return db;
  }

  function normalizeDatabase(input) {
    const fallback = createEmptyDatabase();
    const db = { ...fallback, ...(input || {}) };
    db.schemaVersion = constants.schemaVersion;
    Object.keys(fallback).forEach(key => {
      if (Array.isArray(fallback[key]) && !Array.isArray(db[key])) db[key] = [];
    });
    db.settings = { ...fallback.settings, ...(db.settings || {}) };
    const demoProject = db.projects.find(project => project.id === 'demo-project');
    if (demoProject?.clientId) {
      db.clients = db.clients.map(client => client.id === demoProject.clientId && client.email === 'client@example.ru'
        ? { ...client, email: '' }
        : client);
    }
    return db;
  }

  function getDatabase() {
    const stored = window.absStorage.getJson(constants.entityStoreKey, null);
    if (stored) return normalizeDatabase(stored);
    const legacy = window.absStorage.getJson(constants.legacyStateKey, null);
    const migrated = legacy ? migrateLegacyState(legacy) : createEmptyDatabase();
    saveDatabase(migrated);
    return migrated;
  }

  function saveDatabase(database) {
    return window.absStorage.setJson(constants.entityStoreKey, normalizeDatabase(database));
  }

  function list(collection) {
    return [...(getDatabase()[collection] || [])];
  }

  function get(key, fallback = null) {
    return window.absStorage.getJson(key, fallback);
  }

  function set(key, value) {
    return window.absStorage.setJson(key, value);
  }

  function remove(key) {
    return window.absStorage.remove(key);
  }

  function migrateState(legacyState, defaultState) {
    const next = { ...(defaultState || {}), ...(legacyState || {}) };
    next.schemaVersion = constants.schemaVersion;
    if (!Array.isArray(next.projects)) next.projects = [];
    next.projects = next.projects.map(project => ({
      ...project,
      stages: Array.isArray(project.stages) && project.stages.length ? project.stages : defaultStages(project.id || window.absIds.uid('project')),
      materials: Array.isArray(project.materials) && project.materials.length ? project.materials : defaultMaterials(project.id || window.absIds.uid('project'))
    }));
    if (!Array.isArray(next.knowledge)) next.knowledge = [];
    if (!Array.isArray(next.selectedMetrics)) next.selectedMetrics = [];
    return next;
  }

  window.localStorageAdapter = {
    createEmptyDatabase,
    defaultMaterials,
    defaultStages,
    get,
    getDatabase,
    list,
    migrateLegacyState,
    migrateState,
    remove,
    saveDatabase,
    set
  };
})();
