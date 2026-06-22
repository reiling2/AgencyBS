(function () {
  'use strict';

  function render() {
    return window.absApp?.renderSettings?.();
  }

  window.settingsView = { render };
})();
