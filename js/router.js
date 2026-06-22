(function () {
  'use strict';

  const allowedViews = ['projects', 'project-card', 'brief', 'stats', 'calculator', 'reports', 'site', 'settings', 'knowledge'];

  function normalize(view) {
    return allowedViews.includes(view) ? view : 'projects';
  }

  function current() {
    return normalize((window.location.hash || '').replace('#', ''));
  }

  function go(view, options = {}) {
    const nextView = normalize(view);
    if (window.location.hash !== `#${nextView}`) {
      window.history.replaceState(null, '', `#${nextView}`);
    }
    if (window.absApp?.setView) {
      window.absApp.setView(nextView, options);
    } else {
      window.absState?.set?.({ currentView: nextView, selectedProjectId: options.projectId || null });
    }
  }

  window.addEventListener('hashchange', () => {
    if (window.absApp?.setView) window.absApp.setView(current());
  });

  window.router = { current, go, normalize };
})();
