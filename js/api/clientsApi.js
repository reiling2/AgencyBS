(function () {
  'use strict';
  function list() { return window.localStorageAdapter.list('clients'); }
  function getById(id) { return list().find(client => client.id === id) || null; }
  function create(data) {
    const db = window.localStorageAdapter.getDatabase();
    const client = { id: data.id || window.absIds.uid('client'), fullName: data.fullName || '', phone: data.phone || '', email: data.email || '', createdAt: data.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
    db.clients.unshift(client);
    window.localStorageAdapter.saveDatabase(db);
    return client;
  }
  function update(id, data) {
    const db = window.localStorageAdapter.getDatabase();
    db.clients = db.clients.map(client => client.id === id ? { ...client, ...data, updatedAt: new Date().toISOString() } : client);
    window.localStorageAdapter.saveDatabase(db);
    return db.clients.find(client => client.id === id) || null;
  }
  window.clientsApi = { create, getById, list, update };
  window.absApi.clients = window.clientsApi;
})();
