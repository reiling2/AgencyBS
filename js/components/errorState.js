(function () {
  'use strict';

  function render(message = 'Не удалось загрузить данные') {
    return `<div class="empty error"><strong>Ошибка</strong><span>${window.absSecurity.escapeHtml(message)}</span></div>`;
  }

  window.errorState = { render };
})();
