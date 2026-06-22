(function () {
  'use strict';

  const DB_NAME = 'abs_v2_file_storage';
  const DB_VERSION = 1;
  const STORE_NAME = 'projectFiles';
  const pendingBlobs = new Map();

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB недоступен'));
        return;
      }
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'storageKey' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function putBlob(storageKey, blob) {
    return openDb().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({ storageKey, blob, updatedAt: new Date().toISOString() });
      tx.oncomplete = () => { db.close(); resolve(storageKey); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    }));
  }

  function getStoredBlob(storageKey) {
    return openDb().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(storageKey);
      request.onsuccess = () => resolve(request.result?.blob || null);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
      tx.onerror = () => { db.close(); reject(tx.error); };
    }));
  }

  function deleteStoredBlob(storageKey) {
    if (!storageKey) return Promise.resolve();
    return openDb().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(storageKey);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    })).catch(() => undefined);
  }

  function dataUrlToBlob(dataUrl) {
    if (!String(dataUrl || '').startsWith('data:')) return Promise.resolve(null);
    return fetch(dataUrl).then(response => response.blob()).catch(() => null);
  }

  function listFiles(projectId) {
    return window.filesApi.listByProject(projectId);
  }

  function addFile(projectId, fileData) {
    const id = fileData.id || window.absIds.uid('file');
    const storageKey = fileData.storageKey || `project-file:${projectId}:${id}`;
    const meta = window.fileModel.createFile({ ...fileData, id, projectId, storageKey });
    const file = window.filesApi.upload(projectId, meta);
    if (fileData.blob) {
      pendingBlobs.set(file.storageKey, fileData.blob);
      putBlob(file.storageKey, fileData.blob)
        .then(() => pendingBlobs.delete(file.storageKey))
        .catch(error => console.warn('Cannot save file blob', error));
    }
    return file;
  }

  async function removeFile(fileId) {
    const dbFile = Object.values(window.localStorageAdapter.getDatabase().projectFiles || {}).find(file => file.id === fileId);
    if (dbFile?.storageKey) pendingBlobs.delete(dbFile.storageKey);
    await deleteStoredBlob(dbFile?.storageKey);
    return window.filesApi.delete(fileId);
  }

  async function getFileBlob(file) {
    if (!file) return null;
    if (file.storageKey && pendingBlobs.has(file.storageKey)) return pendingBlobs.get(file.storageKey);
    if (file.storageKey) {
      try {
        const blob = await getStoredBlob(file.storageKey);
        if (blob) return blob;
      } catch (error) {
        console.warn('Cannot read file blob', error);
      }
    }
    return dataUrlToBlob(file.dataUrl);
  }

  window.fileService = { addFile, getFileBlob, listFiles, removeFile };
})();
