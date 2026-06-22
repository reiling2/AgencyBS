(function () {
  'use strict';

  function safeDivide(top, bottom) {
    const numerator = Number(top);
    const denominator = Number(bottom);
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
    return numerator / denominator;
  }

  function calculateKpi(input) {
    const budget = Number(input.budget || 0);
    const views = Number(input.views || 0);
    const leads = Number(input.leads || 0);
    const saleConversion = Number(input.saleConversion || 0);
    const avgCheck = Number(input.avgCheck || 0);
    const margin = Number(input.margin || 0);
    const sales = leads * saleConversion / 100;
    const revenue = sales * avgCheck;
    const profit = revenue * margin / 100 - budget;

    return {
      cpc: safeDivide(budget, views) || 0,
      cpl: safeDivide(budget, leads) || 0,
      conversion: (safeDivide(leads, views) || 0) * 100,
      sales,
      revenue,
      profit
    };
  }

  window.absCalculations = {
    calculateKpi,
    safeDivide
  };
})();
