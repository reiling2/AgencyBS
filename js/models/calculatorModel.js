(function () {
  'use strict';

  function createResult(data = {}) {
    return {
      id: data.id || window.absIds.uid('calc'),
      projectId: data.projectId || '',
      title: data.title || 'KPI проекта',
      budget: Number(data.budget || 0),
      views: Number(data.views || 0),
      leads: Number(data.leads || 0),
      weeklyLeadsGoal: Number(data.weeklyLeadsGoal || data.leadsPerWeek || 0),
      desiredCpc: Number(data.desiredCpc || 0),
      saleConversion: Number(data.saleConversion || 0),
      avgCheck: Number(data.avgCheck || 0),
      margin: Number(data.margin || 0),
      cpc: Number(data.cpc || 0),
      cpl: Number(data.cpl || 0),
      conversion: Number(data.conversion || 0),
      sales: Number(data.sales || 0),
      revenue: Number(data.revenue || 0),
      profit: Number(data.profit || 0),
      createdAt: data.createdAt || new Date().toISOString()
    };
  }

  window.calculatorModel = { createResult };
})();
