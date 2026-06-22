(function () {
  'use strict';

  function getLeads() {
    return window.localStorageAdapter.list('websiteLeads');
  }

  function getEvents() {
    return window.localStorageAdapter.list('websiteEvents');
  }

  window.websiteService = { getEvents, getLeads };
})();
