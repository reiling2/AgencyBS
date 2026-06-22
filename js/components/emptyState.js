(function () {
  'use strict';

  function render({ title = 'Данных пока нет', text = '', action = '' } = {}) {
    return `<div class="empty"><strong>${window.absSecurity.escapeHtml(title)}</strong>${text ? `<span>${window.absSecurity.escapeHtml(text)}</span>` : ''}${action}</div>`;
  }

  window.emptyState = { render };
})();
