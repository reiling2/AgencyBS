(function () {
  'use strict';

  function render() {
    return window.absApp?.renderBrief?.();
  }

  window.briefView = { render };
})();
