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

  function getProjects() {
    return getAllProjectStats().map(project => ({
      id: project.id,
      name: project.name,
      title: project.title,
      status: project.status,
      niche: project.niche,
      accountId: project.account.id
    }));
  }

  function getStats(filters = {}) {
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

  function exportStats(filters = {}) {
    return getStats(filters);
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
