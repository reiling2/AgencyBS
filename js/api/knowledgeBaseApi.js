(function () {
  'use strict';
  function list(filters = {}) {
    const query = String(filters.query || '').toLowerCase();
    return window.localStorageAdapter.list('knowledgeBaseItems').filter(item => !query || [item.title, item.type, item.category, item.content].join(' ').toLowerCase().includes(query));
  }
  function create(data) {
    const db = window.localStorageAdapter.getDatabase();
    const row = { id: data.id || window.absIds.uid('knowledge'), title: data.title || '', type: data.type || 'Заметка', category: data.category || '', url: data.url || '', content: data.content || '', createdAt: data.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
    db.knowledgeBaseItems.unshift(row);
    window.localStorageAdapter.saveDatabase(db);
    return row;
  }
  window.knowledgeBaseApi = { create, list };
  window.absApi.knowledgeBase = window.knowledgeBaseApi;
})();
