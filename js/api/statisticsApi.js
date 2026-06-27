(function () {
  'use strict';

  const formatters = window.absFormatters;

  const METRICS = [
    { key: 'spent', label: 'Расход', type: 'money' },
    { key: 'wallet', label: 'Баланс', type: 'money' },
    { key: 'advance', label: 'Аванс', type: 'money' },
    { key: 'leads', label: 'Лиды', type: 'number' },
    { key: 'cpl', label: 'CPL', type: 'money' },
    { key: 'views', label: 'Просмотры', type: 'number' },
    { key: 'conversion', label: 'Конверсия', type: 'percent' },
    { key: 'chats', label: 'Чаты', type: 'number' },
    { key: 'calls', label: 'Звонки', type: 'number' },
    { key: 'favorites', label: 'Избранное', type: 'number' },
    { key: 'cpc', label: 'CPC', type: 'money' },
    { key: 'adsCount', label: 'Количество объявлений', type: 'number' }
  ];

  const BASE_PROJECTS = [
    {
      id: 'demo-project',
      name: 'Пять решений — септики и скважины',
      niche: 'Инженерные системы для частных домов',
      status: 'Запуск',
      seed: 2,
      adsCount: 12,
      walletBalance: 37200,
      advance: 120000,
      accountId: 'avito-main'
    },
    {
      id: 'avito-septic-mo',
      name: 'Септики МО',
      niche: 'Монтаж септиков',
      status: 'В работе',
      seed: 5,
      adsCount: 9,
      walletBalance: 18400,
      advance: 76000,
      accountId: 'avito-main'
    },
    {
      id: 'avito-wells',
      name: 'Скважины под ключ',
      niche: 'Бурение и водоснабжение',
      status: 'Продление',
      seed: 8,
      adsCount: 15,
      walletBalance: 42800,
      advance: 98000,
      accountId: 'avito-main'
    }
  ];

  const ACCOUNTS = [
    {
      id: 'avito-main',
      name: 'Основной аккаунт Авито',
      connected: true,
      lastSyncAt: new Date().toISOString()
    }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isBackendMode() {
    const config = window.absConfig || {};
    if (config.dataMode === 'mock') return false;
    return config.isBackendMode === true || config.dataMode === 'backend';
  }

  function getApiClient() {
    if (!window.absApiClient) {
      throw new Error('absApiClient is not available');
    }
    return window.absApiClient;
  }

  function buildStatisticsQuery(filters = {}) {
    const query = {
      projectId: filters.projectId && filters.projectId !== 'all' ? filters.projectId : undefined,
      from: filters.from ?? filters.dateFrom ?? undefined,
      to: filters.to ?? filters.dateTo ?? undefined,
      source: filters.source ?? undefined,
      accountId: filters.accountId ?? undefined,
      limit: filters.limit ?? undefined,
      offset: filters.offset ?? undefined
    };
    return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== ''));
  }

  function statisticsPath(endpoint) {
    return `/statistics/${endpoint}`;
  }

  function projectStatisticsPath(projectId, endpoint) {
    return `/projects/${encodeURIComponent(projectId)}/statistics/${endpoint}`;
  }

  async function unwrapBackendResponse(response, fallback = null) {
    if (response?.ok) return response.data ?? fallback;
    throw response?.error || { message: 'Statistics API request failed' };
  }

  function readWorkspaceProjects() {
    try {
      if (window.projectsApi?.list) return window.projectsApi.list();
      const parsed = window.localStorageAdapter?.get?.(window.ABS_CONSTANTS?.legacyStateKey, null);
      return Array.isArray(parsed.projects) ? parsed.projects : [];
    } catch (err) {
      console.warn('Cannot read ABS projects for statistics', err);
      return [];
    }
  }

  function buildDailyStats(seed, intensity = 1) {
    const today = new Date();
    const rows = [];

    for (let index = 59; index >= 0; index -= 1) {
      const date = formatters.dateToIso(formatters.addDays(today, -index));
      const weekday = new Date(`${date}T00:00:00`).getDay();
      const wave = Math.sin((index + seed) / 4) * 0.16 + Math.cos((index + seed) / 9) * 0.1;
      const weekendFactor = weekday === 0 ? 0.52 : weekday === 6 ? 0.72 : 1;
      const spentRaw = (2300 + seed * 260) * (1 + wave) * weekendFactor * intensity;
      const spent = Math.max(0, Math.round(spentRaw / 10) * 10);
      const cpcBase = 3.55 + seed * 0.16 + (index % 5) * 0.14;
      const views = spent ? Math.max(60, Math.round(spent / cpcBase)) : 0;
      const chats = views ? Math.max(0, Math.round(views * (0.0068 + seed * 0.00036) + (index % 6 === 0 ? 1 : 0))) : 0;
      const calls = views ? Math.max(0, Math.round(views * (0.0035 + seed * 0.00018) + (index % 9 === 0 ? 1 : 0))) : 0;
      const favorites = views ? Math.max(0, Math.round(views * (0.014 + seed * 0.00055))) : 0;

      rows.push({
        date,
        spent,
        views,
        chats,
        calls,
        favorites
      });
    }

    return rows;
  }

  function toProjectStats(base, workspaceProject, index) {
    const id = workspaceProject?.id || base.id;
    const name = workspaceProject?.title || base.name;
    const status = workspaceProject?.status || base.status;
    const niche = workspaceProject?.niche || base.niche;
    const advance = Number(workspaceProject?.paymentAmount || base.advance);
    const intensity = 0.92 + (index % 4) * 0.12;

    return {
      id,
      name,
      title: name,
      niche,
      status,
      account: clone(ACCOUNTS.find(account => account.id === base.accountId) || ACCOUNTS[0]),
      finance: {
        walletBalance: Number(base.walletBalance),
        clientAdvance: advance
      },
      metrics: {
        adsCount: Number(base.adsCount)
      },
      leadSources: [
        { key: 'chats', label: 'Чаты' },
        { key: 'calls', label: 'Звонки' },
        { key: 'favorites', label: 'Избранное' }
      ],
      dailyStats: buildDailyStats(base.seed + index, intensity)
    };
  }

  function getAllProjectStats() {
    const workspaceProjects = readWorkspaceProjects();
    const total = Math.max(BASE_PROJECTS.length, workspaceProjects.length || 0);
    const result = [];

    for (let index = 0; index < total; index += 1) {
      const base = BASE_PROJECTS[index] || {
        id: `avito-project-${index + 1}`,
        name: workspaceProjects[index]?.title || `Проект ${index + 1}`,
        niche: workspaceProjects[index]?.niche || 'Авито',
        status: workspaceProjects[index]?.status || 'В работе',
        seed: index + 4,
        adsCount: 7 + index,
        walletBalance: 15000 + index * 6500,
        advance: 60000 + index * 9000,
        accountId: 'avito-main'
      };
      result.push(toProjectStats(base, workspaceProjects[index], index));
    }

    return result;
  }

  function filterDailyStats(project, dateFrom, dateTo) {
    return {
      ...project,
      dailyStats: project.dailyStats.filter(row => {
        const byFrom = !dateFrom || row.date >= dateFrom;
        const byTo = !dateTo || row.date <= dateTo;
        return byFrom && byTo;
      })
    };
  }

  function getMockProjects() {
    return getAllProjectStats().map(project => ({
      id: project.id,
      name: project.name,
      title: project.title,
      status: project.status,
      niche: project.niche,
      accountId: project.account.id
    }));
  }

  function getMockStats(filters = {}) {
    const projectId = filters.projectId || 'all';
    const dateFrom = filters.dateFrom || '';
    const dateTo = filters.dateTo || '';
    const allProjects = getAllProjectStats();
    const selectedProjects = projectId === 'all'
      ? allProjects
      : allProjects.filter(project => project.id === projectId);

    return {
      avitoConnected: true,
      accounts: clone(ACCOUNTS),
      generatedAt: new Date().toISOString(),
      filters: { projectId, dateFrom, dateTo },
      projects: selectedProjects.map(project => filterDailyStats(project, dateFrom, dateTo))
    };
  }

  function getAvailableMetrics() {
    return clone(METRICS);
  }

  function normalizeBackendAccount(account = {}) {
    return {
      id: account.id || account.accountId || '',
      name: account.name || account.accountName || '',
      connected: account.connected !== false,
      lastSyncAt: account.lastSyncAt || null
    };
  }

  function normalizeBackendDailyStats(rows = []) {
    return (Array.isArray(rows) ? rows : []).map(row => ({
      date: row.date || String(row.createdAt || '').slice(0, 10),
      spent: Number(row.spent ?? row.budget ?? row.cost ?? 0),
      views: Number(row.views || 0),
      chats: Number(row.chats || 0),
      calls: Number(row.calls || 0),
      favorites: Number(row.favorites || 0)
    })).filter(row => row.date);
  }

  function normalizeBackendProject(project = {}, index = 0, dailyByProject = new Map()) {
    const id = project.id || project.projectId || `backend-project-${index + 1}`;
    const account = normalizeBackendAccount(project.account || { id: project.accountId, name: project.accountName });
    const finance = project.finance || {};
    const metrics = project.metrics || {};
    const dailyStats = project.dailyStats || project.daily || dailyByProject.get(id) || [];

    return {
      id,
      name: project.name || project.title || `Проект ${index + 1}`,
      title: project.title || project.name || `Проект ${index + 1}`,
      niche: project.niche || '',
      status: project.status || 'В работе',
      account,
      finance: {
        walletBalance: Number(finance.walletBalance ?? project.walletBalance ?? project.wallet ?? 0),
        clientAdvance: Number(finance.clientAdvance ?? project.clientAdvance ?? project.advance ?? 0)
      },
      metrics: {
        adsCount: Number(metrics.adsCount ?? project.adsCount ?? project.ads ?? 0)
      },
      leadSources: Array.isArray(project.leadSources) ? project.leadSources : [
        { key: 'chats', label: 'Чаты' },
        { key: 'calls', label: 'Звонки' },
        { key: 'favorites', label: 'Избранное' }
      ],
      dailyStats: normalizeBackendDailyStats(dailyStats)
    };
  }

  function normalizeBackendStatsPayload(summaryPayload = {}, dailyPayload = {}, filters = {}) {
    const projectId = filters.projectId || 'all';
    const dateFrom = filters.from || filters.dateFrom || '';
    const dateTo = filters.to || filters.dateTo || '';
    const summaryProjects = Array.isArray(summaryPayload?.projects)
      ? summaryPayload.projects
      : (summaryPayload?.project ? [summaryPayload.project] : []);
    const dailyProjects = Array.isArray(dailyPayload?.projects)
      ? dailyPayload.projects
      : [];
    const dailyRows = Array.isArray(dailyPayload)
      ? dailyPayload
      : (Array.isArray(dailyPayload?.dailyStats) ? dailyPayload.dailyStats : []);
    const dailyByProject = new Map();

    dailyProjects.forEach(project => {
      const id = project.id || project.projectId;
      if (id) dailyByProject.set(id, project.dailyStats || project.daily || []);
    });
    dailyRows.forEach(row => {
      const id = row.projectId || projectId;
      if (!id || id === 'all') return;
      const rows = dailyByProject.get(id) || [];
      rows.push(row);
      dailyByProject.set(id, rows);
    });

    const projectsSource = summaryProjects.length
      ? summaryProjects
      : [...dailyByProject.entries()].map(([id, rows]) => ({ id, projectId: id, dailyStats: rows }));

    return {
      avitoConnected: summaryPayload?.avitoConnected !== false,
      accounts: Array.isArray(summaryPayload?.accounts) ? summaryPayload.accounts.map(normalizeBackendAccount) : [],
      generatedAt: summaryPayload?.generatedAt || dailyPayload?.generatedAt || new Date().toISOString(),
      filters: { projectId, dateFrom, dateTo },
      projects: projectsSource.map((project, index) => normalizeBackendProject(project, index, dailyByProject))
    };
  }

  const mockStatisticsApi = {
    exportStats(filters = {}) {
      return getMockStats(filters);
    },
    getAvailableMetrics,
    getProjects: getMockProjects,
    getStats: getMockStats
  };

  const backendStatisticsApi = {
    async exportStats(filters = {}) {
      return backendStatisticsApi.getStats(filters);
    },
    getAvailableMetrics,
    async getProjects(filters = {}) {
      const data = await unwrapBackendResponse(await getApiClient().get(statisticsPath('projects'), { query: buildStatisticsQuery(filters) }), []);
      const rows = Array.isArray(data) ? data : (Array.isArray(data?.projects) ? data.projects : []);
      return rows.map((project, index) => {
        const normalized = normalizeBackendProject(project, index);
        return {
          id: normalized.id,
          name: normalized.name,
          title: normalized.title,
          status: normalized.status,
          niche: normalized.niche,
          accountId: normalized.account.id
        };
      });
    },
    async getStats(filters = {}) {
      const query = buildStatisticsQuery(filters);
      const projectId = filters.projectId || 'all';
      const useProjectEndpoint = projectId && projectId !== 'all';
      const summaryPath = useProjectEndpoint ? projectStatisticsPath(projectId, 'summary') : statisticsPath('summary');
      const dailyPath = useProjectEndpoint ? projectStatisticsPath(projectId, 'daily') : statisticsPath('daily');
      const [summaryPayload, dailyPayload] = await Promise.all([
        getApiClient().get(summaryPath, { query }).then(response => unwrapBackendResponse(response, {})),
        getApiClient().get(dailyPath, { query }).then(response => unwrapBackendResponse(response, {}))
      ]);
      return normalizeBackendStatsPayload(summaryPayload, dailyPayload, filters);
    }
  };

  function getActiveApi() {
    return isBackendMode() ? backendStatisticsApi : mockStatisticsApi;
  }

  function getMetricSettings() {
    const defaultSelected = METRICS.map(metric => metric.key);
    const parsed = window.settingsApi?.get?.().statisticsMetricSettings || {};
    const selectedMetrics = Array.isArray(parsed.selectedMetrics)
      ? parsed.selectedMetrics.filter(key => METRICS.some(metric => metric.key === key))
      : defaultSelected;
    return { selectedMetrics };
  }

  function saveMetricSettings(settings) {
    const selectedMetrics = Array.isArray(settings?.selectedMetrics)
      ? settings.selectedMetrics.filter(key => METRICS.some(metric => metric.key === key))
      : METRICS.map(metric => metric.key);

    const currentSettings = window.settingsApi?.get?.() || {};
    window.settingsApi?.update?.({ ...currentSettings, statisticsMetricSettings: { selectedMetrics } });
    return { selectedMetrics };
  }

  function getFilters() {
    return window.settingsApi?.get?.().statisticsFilters || null;
  }

  function saveFilters(filters) {
    const settings = window.settingsApi?.get?.() || {};
    window.settingsApi?.update?.({ ...settings, statisticsFilters: filters || {} });
    return filters || {};
  }

  function getProjects(filters = {}) {
    return getActiveApi().getProjects(filters);
  }

  function getStats(filters = {}) {
    return getActiveApi().getStats(filters);
  }

  function exportStats(filters = {}) {
    return getActiveApi().exportStats(filters);
  }

  window.statisticsApi = {
    exportStats,
    getAvailableMetrics,
    getFilters,
    getMetricSettings,
    getProjects,
    getStats,
    saveFilters,
    saveMetricSettings
  };
})();
