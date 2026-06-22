(function () {
  'use strict';

  function syncConditionalRefusal(project) {
    if (!project?.id) return null;
    const db = window.localStorageAdapter.getDatabase();
    const existing = db.reminders.find(reminder => reminder.projectId === project.id && reminder.type === 'conditional-refusal-call');
    const isActive = project.status === 'Условный отказник';
    const dueDate = project.reminder?.nextCallDate || (() => {
      const next = new Date();
      next.setMonth(next.getMonth() + 1);
      return next.toISOString().slice(0, 10);
    })();

    if (existing) {
      existing.active = isActive;
      existing.dueDate = dueDate;
      existing.updatedAt = new Date().toISOString();
    } else if (isActive) {
      db.reminders.push(window.reminderModel.createReminder({
        projectId: project.id,
        dueDate,
        title: 'Позвонить клиенту через месяц',
        repeatRule: 'monthly'
      }));
    }

    window.localStorageAdapter.saveDatabase(db);
    return db.reminders.find(reminder => reminder.projectId === project.id && reminder.type === 'conditional-refusal-call') || null;
  }

  window.reminderService = { syncConditionalRefusal };
})();
