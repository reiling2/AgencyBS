(function () {
  'use strict';

  function getSummary(filters = {}) {
    if (!window.statisticsService?.getDashboardData) return null;
    return window.statisticsService.getDashboardData(filters);
  }

  window.avitoStatsService = { getSummary };
})();
