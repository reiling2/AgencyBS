(function () {
  'use strict';

  const LEAD_STATUSES = ['new', 'in_work', 'closed', 'spam'];
  const LEAD_STATUS_LABELS = {
    new: 'новая',
    in_work: 'в работе',
    closed: 'закрыта',
    spam: 'спам'
  };

  function normalizeLeadStatus(status) {
    const value = String(status || '').trim();
    const legacy = {
      новая: 'new',
      'в работе': 'in_work',
      закрыта: 'closed',
      спам: 'spam'
    };
    return LEAD_STATUSES.includes(value) ? value : (legacy[value] || 'new');
  }

  function createLead(data = {}) {
    const now = new Date().toISOString();
    return {
      id: data.id || window.absIds.uid('lead'),
      visitorId: data.visitorId || '',
      sessionId: data.sessionId || '',
      name: data.name || '',
      phone: data.phone || '',
      email: data.email || '',
      message: data.message || '',
      pageUrl: data.pageUrl || data.page || '',
      pageTitle: data.pageTitle || '',
      formId: data.formId || '',
      formName: data.formName || '',
      status: normalizeLeadStatus(data.status),
      source: data.source || '',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    };
  }

  window.websiteModel = { LEAD_STATUSES, LEAD_STATUS_LABELS, createLead, normalizeLeadStatus };
})();
