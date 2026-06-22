(function () {
  'use strict';

  function input({ name = '', label = '', value = '', type = 'text', wide = false, attrs = '' } = {}) {
    const esc = window.absSecurity.escapeHtml;
    return `<label class="field ${wide ? 'field-wide' : ''}"><span>${esc(label)}</span><input name="${esc(name)}" type="${esc(type)}" value="${esc(value)}" ${attrs} /></label>`;
  }

  function textarea({ name = '', label = '', value = '', rows = 4, wide = true, attrs = '' } = {}) {
    const esc = window.absSecurity.escapeHtml;
    return `<label class="field ${wide ? 'field-wide' : ''}"><span>${esc(label)}</span><textarea name="${esc(name)}" rows="${rows}" ${attrs}>${esc(value)}</textarea></label>`;
  }

  window.formField = { input, textarea };
})();
