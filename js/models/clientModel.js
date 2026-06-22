(function () {
  'use strict';

  function createClient(data = {}) {
    const now = new Date().toISOString();
    return {
      id: data.id || window.absIds.uid('client'),
      fullName: data.fullName || data.clientName || '',
      phone: data.phone || '',
      email: data.email || '',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    };
  }

  window.clientModel = { createClient };
})();
