(function () {
  'use strict';

  function createConnection(data = {}) {
    return {
      id: data.id || window.absIds.uid('avito'),
      projectId: data.projectId || '',
      clientId: data.clientId || '',
      profileId: data.profileId || '',
      clientIdApi: data.clientIdApi || '',
      tokenMasked: data.tokenMasked || '',
      status: data.status || 'draft',
      updatedAt: data.updatedAt || new Date().toISOString()
    };
  }

  window.avitoModel = { createConnection };
})();
