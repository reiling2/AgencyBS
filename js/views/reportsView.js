(function () {
  'use strict';

  function render() {
    return window.absApp?.renderReports?.();
  }

  window.reportsView = { render };
})();
