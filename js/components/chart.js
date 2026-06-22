(function () {
  'use strict';

  function bars(rows = [], valueKey = 'value', labelKey = 'label') {
    const max = Math.max(1, ...rows.map(row => Number(row[valueKey] || 0)));
    const esc = window.absSecurity.escapeHtml;
    return `<div class="stats-v6-chart">${rows.map(row => {
      const value = Number(row[valueKey] || 0);
      const height = Math.max(6, Math.round(value / max * 100));
      return `<div class="stats-v6-bar" style="--bar-height:${height}%"><span>${esc(row[labelKey] || '')}</span></div>`;
    }).join('')}</div>`;
  }

  window.absChart = { bars };
})();
