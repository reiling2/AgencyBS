(function () {
  'use strict';

  function render() {
    return window.absApp?.renderSite?.();
  }

  window.websiteView = { render };
})();
