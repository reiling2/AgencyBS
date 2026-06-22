(function () {
  'use strict';

  function button({ id = '', label = '', tone = 'soft', type = 'button', attrs = '' } = {}) {
    const esc = window.absSecurity.escapeHtml;
    return `<button ${id ? `id="${esc(id)}"` : ''} class="btn ${esc(tone)}" type="${esc(type)}" ${attrs}>${esc(label)}</button>`;
  }

  window.absButtons = { button };
})();
