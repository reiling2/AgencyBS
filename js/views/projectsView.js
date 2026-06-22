(function () {
  'use strict';

  function render() {
    return window.absApp?.renderProjects?.();
  }

  window.projectsView = { render };
})();
