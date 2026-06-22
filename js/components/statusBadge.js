(function () {
  'use strict';

  function className(status = '') {
    const normalized = status.toLowerCase();
    if (normalized.includes('отказ')) return 'danger';
    if (normalized.includes('архив')) return 'muted';
    if (normalized.includes('работ') || normalized.includes('запуск')) return 'blue';
    return 'green';
  }

  function render(status) {
    const safe = window.absSecurity.escapeHtml(status || 'Без статуса');
    return `<span class="badge ${className(status)}">${safe}</span>`;
  }

  window.statusBadge = { className, render };
})();
