(function () {
  'use strict';
  function getAnalytics(filters = {}) {
    return { filters, leads: window.localStorageAdapter.list('websiteLeads'), events: window.localStorageAdapter.list('websiteEvents') };
  }
  window.websiteApi = { getAnalytics };
  window.absApi.website = window.websiteApi;
})();
