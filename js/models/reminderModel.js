(function () {
  'use strict';

  function createReminder(data = {}) {
    return {
      id: data.id || window.absIds.uid('reminder'),
      projectId: data.projectId || '',
      type: data.type || 'conditional-refusal-call',
      title: data.title || 'Позвонить клиенту',
      dueDate: data.dueDate || '',
      repeatRule: data.repeatRule || 'monthly',
      active: data.active !== false,
      createdAt: data.createdAt || new Date().toISOString()
    };
  }

  window.reminderModel = { createReminder };
})();
