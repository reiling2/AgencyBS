(function () {
  'use strict';

  function render() {
    return window.absApp?.renderProjectCard?.();
  }

  window.projectCardView = { render };
})();
