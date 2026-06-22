(function () {
  'use strict';

  function createProject(data = {}) {
    const now = new Date().toISOString();
    return {
      id: data.id || window.absIds.uid('project'),
      title: data.title || 'Новый проект',
      niche: data.niche || '',
      status: data.status || 'Подготовка к запуску',
      dealType: data.dealType || '',
      paymentType: data.paymentType || '',
      paymentDate: data.paymentDate || '',
      paymentAmount: Number(data.paymentAmount || 0),
      clientId: data.clientId || '',
      comment: data.comment || '',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    };
  }

  window.projectModel = { createProject };
})();
