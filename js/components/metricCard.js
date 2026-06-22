(function () {
  'use strict';

  function render({ label = '', value = '', hint = '', tone = '' } = {}) {
    const esc = window.absSecurity.escapeHtml;
    return `<div class="stat-kpi-card ${esc(tone)}"><span>${esc(label)}</span><strong>${esc(value)}</strong>${hint ? `<small>${esc(hint)}</small>` : ''}</div>`;
  }

  window.metricCard = { render };
})();
