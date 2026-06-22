(function () {
  'use strict';

  function createLead(data = {}) {
    return {
      id: data.id || window.absIds.uid('lead'),
      name: data.name || '',
      phone: data.phone || '',
      source: data.source || '',
      page: data.page || '',
      createdAt: data.createdAt || new Date().toISOString()
    };
  }

  window.websiteModel = { createLead };
})();
