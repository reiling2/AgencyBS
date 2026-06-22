(function () {
  'use strict';

  function getDefaultFilters() {
    const settings = window.websiteApi.getSettings();
    return {
      period: settings.period || 'today',
      customFrom: settings.customFrom || '',
      customTo: settings.customTo || '',
      chartMetric: settings.chartMetric || 'leads'
    };
  }

  function saveFilters(filters) {
    return window.websiteApi.updateSettings(filters);
  }

  function getSettings() {
    return window.websiteApi.getSettings();
  }

  function saveSettings(patch) {
    return window.websiteApi.updateSettings(patch);
  }

  function updateLeadStatus(leadId, status) {
    return window.websiteApi.updateLeadStatus(leadId, status);
  }

  function getNewLeadCount() {
    return window.websiteApi.getNewLeadCount();
  }

  function getNotificationSettings() {
    return window.websiteApi.getNotificationSettings();
  }

  function saveNotificationSettings(patch) {
    return window.websiteApi.updateNotificationSettings(patch);
  }

  function getDashboard(filters = getDefaultFilters()) {
    const dataset = window.websiteApi.getStatistics(filters);
    const range = window.websiteStatsService.getPeriodRange(filters.period, filters.customFrom, filters.customTo);
    const settings = getSettings();
    const selectedMetrics = Array.isArray(settings.selectedMetrics) && settings.selectedMetrics.length
      ? settings.selectedMetrics
      : window.websiteStatsService.SELECTABLE_METRICS.map(metric => metric.key);
    const summary = window.websiteStatsService.calcSummary(dataset, range);
    const pages = window.websiteStatsService.buildPages(dataset, range);
    const chart = window.websiteStatsService.buildChart(dataset, range, filters.chartMetric || 'leads');
    const normalizeStatus = window.websiteApi.normalizeLeadStatus || (status => status || 'new');
    const leads = dataset.websiteLeads.slice().sort((left, right) => {
      const leftIsNew = normalizeStatus(left.status) === 'new' ? 0 : 1;
      const rightIsNew = normalizeStatus(right.status) === 'new' ? 0 : 1;
      if (leftIsNew !== rightIsNew) return leftIsNew - rightIsNew;
      return new Date(right.createdAt) - new Date(left.createdAt);
    });
    const exportRows = window.websiteStatsService.buildExportRows(dataset, range, selectedMetrics);
    return {
      dataset,
      filters,
      range,
      settings,
      selectedMetrics,
      summary,
      pages,
      chart,
      leads,
      exportRows,
      adminStructure: window.websiteStatsService.getAdminStructure(dataset)
    };
  }

  function exportCurrent(dashboard) {
    return window.exportService.exportWebsiteStatistics({
      dateFrom: dashboard.range.dateFrom,
      dateTo: dashboard.range.dateTo,
      selectedMetrics: dashboard.selectedMetrics
    });
  }

  window.websiteService = {
    exportCsv: exportCurrent,
    exportCurrent,
    getDashboard,
    getDefaultFilters,
    getEvents: () => window.websiteApi.getDataset().websiteEvents,
    getLeads: () => window.websiteApi.getDataset().websiteLeads,
    getNewLeadCount,
    getNotificationSettings,
    getSettings,
    saveFilters,
    saveNotificationSettings,
    saveSettings,
    updateLeadStatus
  };
})();
