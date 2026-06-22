(function () {
  'use strict';

  function render({ id = 'fileDropzone', label = 'Добавить файлы' } = {}) {
    const esc = window.absSecurity.escapeHtml;
    return `<button class="btn soft" id="${esc(id)}" type="button">${esc(label)}</button>`;
  }

  window.fileDropzone = { render };
})();
