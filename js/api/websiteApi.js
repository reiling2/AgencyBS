(function () {
  'use strict';

  const DAY = 86400000;
  const WEBSITE_DATA_COLLECTIONS = [
    'websitePageViews',
    'websiteVisitors',
    'websiteSessions',
    'websiteEvents',
    'websiteErrors',
    'websitePages',
    'websitePagePerformance'
  ];
  const LEAD_STATUSES = ['new', 'in_work', 'closed', 'spam'];
  const LEGACY_LEAD_STATUSES = {
    новая: 'new',
    'в работе': 'in_work',
    закрыта: 'closed',
    спам: 'spam'
  };
  const DEFAULT_WEBSITE_SETTINGS = Object.freeze({
    source: 'demo',
    isDemo: true,
    heroMetric1: 'pageviews',
    heroMetric2: 'visitors',
    selectedMetrics: ['leads', 'conversion', 'visitors', 'returnVisitors', 'returnVisits', 'visits', 'pageviews', 'formOpens', 'formErrors', 'scroll']
  });

  function normalizeLeadStatus(status) {
    const value = String(status || '').trim();
    return LEAD_STATUSES.includes(value) ? value : (LEGACY_LEAD_STATUSES[value] || 'new');
  }

  function normalizeLead(lead = {}) {
    return { ...lead, status: normalizeLeadStatus(lead.status) };
  }

  function isBackendMode() {
    const config = window.absConfig || {};
    if (config.dataMode === 'mock') return false;
    return config.isBackendMode === true || config.dataMode === 'backend';
  }

  function getApiClient() {
    if (!window.absApiClient) {
      throw new Error('absApiClient is not available');
    }
    return window.absApiClient;
  }

  function buildWebsiteQuery(filters = {}) {
    const query = {
      from: filters.from ?? filters.dateFrom ?? filters.customFrom ?? undefined,
      to: filters.to ?? filters.dateTo ?? filters.customTo ?? undefined,
      source: filters.source ?? undefined,
      status: filters.status ?? undefined,
      page: filters.page ?? undefined,
      limit: filters.limit ?? undefined,
      offset: filters.offset ?? undefined
    };
    return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== ''));
  }

  function resolveProjectId(input = {}) {
    const state = window.absState?.get?.() || {};
    const projectId = input.projectId || state.selectedProjectId;
    if (!projectId) {
      throw new Error('projectId is required for backend websiteApi requests');
    }
    return String(projectId);
  }

  function sitePath(projectId, endpoint) {
    return `/projects/${encodeURIComponent(projectId)}/site/${endpoint}`;
  }

  async function unwrapBackendResponse(response, fallback = null) {
    if (response?.ok) return response.data ?? fallback;
    throw response?.error || { message: 'Website API request failed' };
  }

  function extractList(payload, key) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];
    if (Array.isArray(payload[key])) return payload[key];
    if (Array.isArray(payload.data)) return payload.data;
    if (payload.data && typeof payload.data === 'object' && Array.isArray(payload.data[key])) return payload.data[key];
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.rows)) return payload.rows;
    return [];
  }

  function withBackendSource(row = {}) {
    return { ...row, source: row.source || 'backend' };
  }

  function normalizeBackendPage(page = {}) {
    const slug = page.slug || page.url || page.path || '/';
    return withBackendSource({
      ...page,
      id: page.id || page.pageId || slug,
      slug,
      title: page.title || page.name || slug,
      status: page.status || 'published'
    });
  }

  function normalizeBackendPageView(row = {}) {
    return withBackendSource({
      ...row,
      id: row.id || row.pageViewId || row.eventId || '',
      visitorId: row.visitorId || row.visitor?.id || '',
      sessionId: row.sessionId || row.session?.id || '',
      pageUrl: row.pageUrl || row.url || row.path || row.page?.slug || '/',
      pageTitle: row.pageTitle || row.title || row.page?.title || '',
      createdAt: row.createdAt || row.viewedAt || row.timestamp || new Date().toISOString()
    });
  }

  function normalizeBackendEvent(row = {}) {
    return withBackendSource({
      ...row,
      id: row.id || row.eventId || '',
      visitorId: row.visitorId || row.visitor?.id || '',
      sessionId: row.sessionId || row.session?.id || '',
      eventType: row.eventType || row.type || '',
      eventName: row.eventName || row.name || row.eventType || row.type || '',
      pageUrl: row.pageUrl || row.url || row.path || '/',
      pageTitle: row.pageTitle || row.title || '',
      createdAt: row.createdAt || row.timestamp || new Date().toISOString()
    });
  }

  function normalizeBackendVisitor(row = {}) {
    return withBackendSource({
      ...row,
      id: row.id || row.visitorId || '',
      visitorId: row.visitorId || row.id || '',
      firstSeenAt: row.firstSeenAt || row.createdAt || row.startedAt || null,
      lastSeenAt: row.lastSeenAt || row.updatedAt || row.endedAt || null,
      visitsCount: Number(row.visitsCount ?? row.visits ?? 0)
    });
  }

  function normalizeBackendSession(row = {}) {
    return withBackendSource({
      ...row,
      id: row.id || row.sessionId || '',
      sessionId: row.sessionId || row.id || '',
      visitorId: row.visitorId || row.visitor?.id || '',
      startedAt: row.startedAt || row.createdAt || null,
      endedAt: row.endedAt || null,
      durationSeconds: Number(row.durationSeconds ?? row.duration ?? 0),
      pageViewsCount: Number(row.pageViewsCount ?? row.pageviews ?? row.pageViews ?? 0)
    });
  }

  function normalizeBackendError(row = {}) {
    return withBackendSource({
      ...row,
      id: row.id || row.errorId || '',
      errorType: row.errorType || row.type || '',
      message: row.message || row.errorMessage || '',
      pageUrl: row.pageUrl || row.url || row.path || '/',
      createdAt: row.createdAt || row.timestamp || new Date().toISOString()
    });
  }

  function normalizeBackendPerformance(row = {}) {
    return withBackendSource({
      ...row,
      id: row.id || row.performanceId || '',
      pageUrl: row.pageUrl || row.url || row.path || '/',
      loadTimeMs: Number(row.loadTimeMs ?? row.loadTime ?? 0),
      domReadyMs: Number(row.domReadyMs ?? row.domReady ?? 0),
      createdAt: row.createdAt || row.timestamp || new Date().toISOString()
    });
  }

  function normalizeBackendDataset(parts = {}, filters = {}) {
    const summary = parts.summary || {};
    const pagesPayload = parts.pages || {};
    return {
      filters,
      websitePageViews: extractList(summary, 'websitePageViews').concat(extractList(summary, 'pageViews')).map(normalizeBackendPageView),
      websiteVisitors: extractList(parts.visitors, 'visitors').map(normalizeBackendVisitor),
      websiteSessions: extractList(parts.sessions, 'sessions').map(normalizeBackendSession),
      websiteEvents: extractList(parts.events, 'events').map(normalizeBackendEvent),
      websiteErrors: extractList(parts.errors, 'errors').map(normalizeBackendError),
      websitePages: extractList(pagesPayload, 'pages').map(normalizeBackendPage),
      websitePagePerformance: extractList(pagesPayload, 'performance').concat(extractList(summary, 'websitePagePerformance')).map(normalizeBackendPerformance),
      websiteLeads: extractList(parts.leads, 'leads').map(normalizeLead),
      websiteSources: extractList(parts.sources, 'sources').map(withBackendSource),
      websiteContentBlocks: extractList(summary, 'websiteContentBlocks').map(withBackendSource),
      websiteForms: extractList(summary, 'websiteForms').map(withBackendSource),
      websiteMedia: extractList(summary, 'websiteMedia').map(withBackendSource),
      websiteSeoSettings: summary.websiteSeoSettings || {},
      websiteSiteSettings: summary.websiteSiteSettings || {},
      websiteSettings: getSettings(),
      websiteSummary: summary,
      source: 'backend',
      isDemo: false
    };
  }

  function hasStoredWebsiteData(db) {
    return WEBSITE_DATA_COLLECTIONS.some(collection => Array.isArray(db[collection]) && db[collection].length);
  }

  function isoDate(date) {
    return window.absFormatters?.dateToIso?.(date) || new Date(date).toISOString().slice(0, 10);
  }

  function at(dateIso, hour = 12, minute = 0) {
    return `${dateIso}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  }

  function createMockData() {
    const today = new Date();
    const websitePages = [
      { id: 'page-home', slug: '/', title: 'Главная', seoTitle: 'AgencyBS', seoDescription: 'Главная страница', status: 'published', createdAt: at(isoDate(today), 8), updatedAt: at(isoDate(today), 8), source: 'demo' },
      { id: 'page-services', slug: '/services', title: 'Услуги', seoTitle: 'Услуги AgencyBS', seoDescription: 'Услуги агентства', status: 'published', createdAt: at(isoDate(today), 8), updatedAt: at(isoDate(today), 8), source: 'demo' },
      { id: 'page-cases', slug: '/cases', title: 'Кейсы', seoTitle: 'Кейсы AgencyBS', seoDescription: 'Кейсы и результаты', status: 'published', createdAt: at(isoDate(today), 8), updatedAt: at(isoDate(today), 8), source: 'demo' },
      { id: 'page-contacts', slug: '/contacts', title: 'Контакты', seoTitle: 'Контакты', seoDescription: 'Контакты и формы', status: 'published', createdAt: at(isoDate(today), 8), updatedAt: at(isoDate(today), 8), source: 'demo' }
    ];
    const pageWeights = [0.47, 0.28, 0.15, 0.10];
    const websiteVisitors = [];
    const websiteSessions = [];
    const websitePageViews = [];
    const websiteEvents = [];
    const websiteLeads = [];
    const websiteErrors = [];
    const websitePagePerformance = [];
    let sessionIndex = 1;
    let viewIndex = 1;
    let eventIndex = 1;
    let leadIndex = 1;
    let errorIndex = 1;
    let performanceIndex = 1;
    const visitorIds = Array.from({ length: 70 }, (_, index) => `visitor-${index + 1}`);

    visitorIds.forEach((visitorId, index) => {
      const firstDate = isoDate(new Date(today.getTime() - (index % 28) * DAY));
      websiteVisitors.push({
        id: `wv-${index + 1}`,
        visitorId,
        firstSeenAt: at(firstDate, 9 + (index % 8), index % 55),
        lastSeenAt: at(isoDate(today), 10 + (index % 10), (index * 7) % 55),
        visitsCount: 1 + (index % 4 === 0 ? 2 : index % 3 === 0 ? 1 : 0),
        createdAt: at(firstDate, 9),
        updatedAt: at(isoDate(today), 19),
        source: 'demo'
      });
    });

    for (let dayOffset = 34; dayOffset >= 0; dayOffset -= 1) {
      const date = isoDate(new Date(today.getTime() - dayOffset * DAY));
      const isToday = dayOffset === 0;
      const hours = isToday ? [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] : [10, 13, 16, 19];
      hours.forEach((hour, hourIndex) => {
        const sessionCount = isToday
          ? Math.max(3, Math.round((hourIndex + 3) * 1.15 + (hour % 3)))
          : 5 + ((35 - dayOffset + hourIndex) % 8);
        for (let count = 0; count < sessionCount; count += 1) {
          const visitorId = visitorIds[(sessionIndex * 7 + count + dayOffset) % visitorIds.length];
          const sessionId = `session-${sessionIndex}`;
          const createdAt = at(date, hour, (count * 7 + dayOffset) % 58);
          const pageViewsCount = 1 + ((sessionIndex + dayOffset) % 3);
          websiteSessions.push({
            id: `ws-${sessionIndex}`,
            sessionId,
            visitorId,
            startedAt: createdAt,
            endedAt: at(date, Math.min(23, hour + 1), (count * 7 + 12) % 58),
            durationSeconds: 55 + ((sessionIndex * 23) % 310),
            pageViewsCount,
            deviceType: sessionIndex % 5 === 0 ? 'tablet' : sessionIndex % 3 === 0 ? 'desktop' : 'mobile',
            browser: sessionIndex % 2 === 0 ? 'Chrome' : 'Safari',
            createdAt,
            source: 'demo'
          });

          for (let view = 0; view < pageViewsCount; view += 1) {
            const pageIndex = (sessionIndex + count + view * 2 + dayOffset) % websitePages.length;
            const page = websitePages[pageIndex] || websitePages[0];
            const pageViewAt = at(date, hour, Math.min(59, ((count * 7 + view * 9 + dayOffset) % 58)));
            websitePageViews.push({
              id: `wpv-${viewIndex}`,
              visitorId,
              sessionId,
              pageUrl: page.slug,
              pageTitle: page.title,
              createdAt: pageViewAt,
              source: 'demo'
            });
            websiteEvents.push({
              id: `we-scroll-${eventIndex++}`,
              visitorId,
              sessionId,
              eventType: 'scroll_depth',
              eventName: 'Scroll depth',
              pageUrl: page.slug,
              pageTitle: page.title,
              value: Math.min(96, 38 + ((viewIndex + sessionIndex + dayOffset) % 58)),
              createdAt: pageViewAt,
              source: 'demo'
            });
            viewIndex += 1;
          }

          if (sessionIndex % 4 === 0) {
            websiteEvents.push({ id: `we-phone-${eventIndex++}`, visitorId, sessionId, eventType: 'click_phone', eventName: 'Phone click', pageUrl: '/contacts', pageTitle: 'Контакты', createdAt, source: 'demo' });
          }
          if (sessionIndex % 8 === 0) {
            websiteEvents.push({ id: `we-tg-${eventIndex++}`, visitorId, sessionId, eventType: 'click_telegram', eventName: 'Telegram click', pageUrl: '/contacts', pageTitle: 'Контакты', createdAt, source: 'demo' });
          }
          if (sessionIndex % 11 === 0) {
            websiteEvents.push({ id: `we-wa-${eventIndex++}`, visitorId, sessionId, eventType: 'click_whatsapp', eventName: 'WhatsApp click', pageUrl: '/contacts', pageTitle: 'Контакты', createdAt, source: 'demo' });
          }
          if (sessionIndex % 5 === 0) {
            websiteEvents.push({ id: `we-form-${eventIndex++}`, visitorId, sessionId, eventType: 'form_open', eventName: 'Form open', pageUrl: '/services', pageTitle: 'Услуги', formId: 'consultation', formName: 'Консультация', createdAt, source: 'demo' });
          }
          if (sessionIndex % 7 === 0) {
            websiteEvents.push({ id: `we-start-${eventIndex++}`, visitorId, sessionId, eventType: 'form_start', eventName: 'Form start', pageUrl: '/services', pageTitle: 'Услуги', formId: 'consultation', formName: 'Консультация', createdAt, source: 'demo' });
          }
          if (sessionIndex % 6 === 0) {
            websiteEvents.push({ id: `we-to-form-${eventIndex++}`, visitorId, sessionId, eventType: 'scroll_to_form', eventName: 'Scroll to form', pageUrl: '/services', pageTitle: 'Услуги', createdAt, source: 'demo' });
          }
          if (sessionIndex % 23 === 0) {
            websiteEvents.push({ id: `we-form-error-${eventIndex++}`, visitorId, sessionId, eventType: 'form_error', eventName: 'Form error', pageUrl: '/services', pageTitle: 'Услуги', formId: 'consultation', formName: 'Консультация', fieldName: 'phone', errorMessage: 'invalid_phone', createdAt, source: 'demo' });
          }
          if (sessionIndex % 19 === 0) {
            const page = websitePages[sessionIndex % websitePages.length];
            websiteLeads.push({
              id: `wl-${leadIndex++}`,
              visitorId,
              sessionId,
              name: ['Анна', 'Игорь', 'Мария', 'Сергей'][leadIndex % 4],
              phone: `+7 900 000-${String(leadIndex * 7).padStart(2, '0')}-${String(leadIndex * 11).padStart(2, '0')}`,
              email: '',
              message: '',
              pageUrl: page.slug,
              pageTitle: page.title,
              formId: 'consultation',
              formName: leadIndex % 2 ? 'Заявка' : 'Обратный звонок',
              status: ['new', 'in_work', 'closed', 'spam'][leadIndex % 4],
              createdAt: at(date, hour, Math.min(59, ((count * 7 + 4) % 58))),
              updatedAt: at(date, hour, Math.min(59, ((count * 7 + 9) % 58))),
              source: 'demo'
            });
          }
          if (sessionIndex % 37 === 0) {
            websiteErrors.push({ id: `wer-${errorIndex++}`, visitorId, sessionId, errorType: 'js_error', message: 'Unhandled form state', pageUrl: '/services', stack: '', createdAt, source: 'demo' });
          }
          if (sessionIndex % 41 === 0) {
            websiteErrors.push({ id: `wer-${errorIndex++}`, visitorId, sessionId, errorType: 'page_404', message: 'Page not found', pageUrl: '/old-page', stack: '', createdAt, source: 'demo' });
          }
          websitePagePerformance.push({
            id: `wpp-${performanceIndex++}`,
            visitorId,
            sessionId,
            pageUrl: websitePages[sessionIndex % websitePages.length].slug,
            loadTimeMs: 900 + ((sessionIndex * 97) % 3800),
            domReadyMs: 420 + ((sessionIndex * 61) % 1400),
            createdAt,
            source: 'demo'
          });
          sessionIndex += 1;
        }
      });
    }

    return {
      websitePageViews,
      websiteVisitors,
      websiteSessions,
      websiteEvents,
      websiteLeads,
      websiteErrors,
      websitePages,
      websitePagePerformance,
      websiteSettings: { ...DEFAULT_WEBSITE_SETTINGS },
      websiteContentBlocks: [
        { id: 'block-hero', pageId: 'page-home', blockId: 'hero', blockType: 'hero', title: 'Hero', content: '', order: 1, isActive: true, createdAt: at(isoDate(today), 8), updatedAt: at(isoDate(today), 8), source: 'demo' },
        { id: 'block-services', pageId: 'page-home', blockId: 'services', blockType: 'services', title: 'Services', content: '', order: 2, isActive: true, createdAt: at(isoDate(today), 8), updatedAt: at(isoDate(today), 8), source: 'demo' },
        { id: 'block-cases', pageId: 'page-home', blockId: 'cases', blockType: 'cases', title: 'Cases', content: '', order: 3, isActive: true, createdAt: at(isoDate(today), 8), updatedAt: at(isoDate(today), 8), source: 'demo' },
        { id: 'block-faq', pageId: 'page-home', blockId: 'faq', blockType: 'faq', title: 'FAQ', content: '', order: 4, isActive: true, createdAt: at(isoDate(today), 8), updatedAt: at(isoDate(today), 8), source: 'demo' }
      ],
      websiteForms: [
        { id: 'form-consultation', formId: 'consultation', name: 'Консультация', pageId: 'page-services', fields: ['name', 'phone', 'message'], isActive: true, createdAt: at(isoDate(today), 8), updatedAt: at(isoDate(today), 8), source: 'demo' }
      ],
      websiteMedia: [],
      websiteSeoSettings: { source: 'demo', isDemo: true },
      websiteSiteSettings: { source: 'demo', isDemo: true }
    };
  }

  function getSettings() {
    const settings = window.settingsApi?.get?.() || {};
    return { ...DEFAULT_WEBSITE_SETTINGS, ...(settings.websiteSettings || {}) };
  }

  function updateSettings(patch = {}) {
    const settings = window.settingsApi?.get?.() || {};
    const websiteSettings = { ...getSettings(), ...patch };
    window.settingsApi?.update?.({ ...settings, websiteSettings });
    return websiteSettings;
  }

  function getMockDataset() {
    const db = window.localStorageAdapter?.getDatabase?.() || {};
    const mock = createMockData();
    const hasWebsiteData = hasStoredWebsiteData(db);
    return {
      websitePageViews: db.websitePageViews?.length ? db.websitePageViews : mock.websitePageViews,
      websiteVisitors: db.websiteVisitors?.length ? db.websiteVisitors : mock.websiteVisitors,
      websiteSessions: db.websiteSessions?.length ? db.websiteSessions : mock.websiteSessions,
      websiteEvents: db.websiteEvents?.length ? db.websiteEvents : mock.websiteEvents,
      websiteLeads: (db.websiteLeads?.length ? db.websiteLeads : hasWebsiteData ? [] : mock.websiteLeads).map(normalizeLead),
      websiteErrors: db.websiteErrors?.length ? db.websiteErrors : mock.websiteErrors,
      websitePages: db.websitePages?.length ? db.websitePages : mock.websitePages,
      websitePagePerformance: db.websitePagePerformance?.length ? db.websitePagePerformance : mock.websitePagePerformance,
      websiteContentBlocks: db.websiteContentBlocks?.length ? db.websiteContentBlocks : mock.websiteContentBlocks,
      websiteForms: db.websiteForms?.length ? db.websiteForms : mock.websiteForms,
      websiteMedia: db.websiteMedia?.length ? db.websiteMedia : mock.websiteMedia,
      websiteSeoSettings: db.websiteSeoSettings || mock.websiteSeoSettings,
      websiteSiteSettings: db.websiteSiteSettings || mock.websiteSiteSettings,
      websiteSettings: getSettings(),
      source: hasWebsiteData ? 'local' : 'demo',
      isDemo: !hasWebsiteData
    };
  }

  function getMockStatistics(filters = {}) {
    return { filters, ...getMockDataset() };
  }

  function createMockRow(collection, row) {
    const db = window.localStorageAdapter.getDatabase();
    db[collection] = Array.isArray(db[collection]) ? db[collection] : [];
    const nextRow = { ...row, source: row.source || 'local' };
    db[collection].push(nextRow);
    window.localStorageAdapter.saveDatabase(db);
    return nextRow;
  }

  function notifyLeadsChanged(detail = {}) {
    window.dispatchEvent?.(new CustomEvent('website:leads-changed', { detail }));
  }

  function getMockWritableWebsiteLeads(db) {
    if (!Array.isArray(db.websiteLeads)) db.websiteLeads = [];
    if (!db.websiteLeads.length && !hasStoredWebsiteData(db)) {
      db.websiteLeads = createMockData().websiteLeads.map(normalizeLead);
      return db.websiteLeads;
    }
    db.websiteLeads = db.websiteLeads.map(normalizeLead);
    return db.websiteLeads;
  }

  function postMockPageView(row) { return createMockRow('websitePageViews', row); }
  function postMockEvent(row) { return createMockRow('websiteEvents', row); }
  function postMockLead(row = {}) {
    const payload = { ...row, status: 'new' };
    const lead = window.websiteModel?.createLead
      ? window.websiteModel.createLead(payload)
      : {
          ...payload,
          id: payload.id || window.absIds.uid('lead'),
          status: 'new',
          createdAt: payload.createdAt || new Date().toISOString(),
          updatedAt: payload.updatedAt || new Date().toISOString()
    };
    lead.status = 'new';
    const db = window.localStorageAdapter.getDatabase();
    const leads = getMockWritableWebsiteLeads(db);
    const nextLead = { ...lead, source: lead.source || 'local' };
    leads.push(nextLead);
    db.websiteLeads = leads;
    window.localStorageAdapter.saveDatabase(db);
    notifyLeadsChanged({ action: 'created', lead: nextLead });
    return nextLead;
  }
  function postMockError(row) { return createMockRow('websiteErrors', row); }
  function postMockPerformance(row) { return createMockRow('websitePagePerformance', row); }

  function updateMockLeadStatus(leadId, status) {
    const id = String(leadId || '');
    if (!id) return null;
    const db = window.localStorageAdapter.getDatabase();
    const leads = getMockWritableWebsiteLeads(db);
    let updatedLead = null;
    db.websiteLeads = leads.map(lead => {
      if (String(lead.id) !== id) return normalizeLead(lead);
      updatedLead = {
        ...normalizeLead(lead),
        status: normalizeLeadStatus(status),
        updatedAt: new Date().toISOString(),
        source: lead.source || 'local'
      };
      return updatedLead;
    });
    window.localStorageAdapter.saveDatabase(db);
    if (updatedLead) notifyLeadsChanged({ action: 'status-updated', lead: updatedLead });
    return updatedLead;
  }

  function getMockNewLeadCount() {
    return getMockDataset().websiteLeads.filter(lead => normalizeLeadStatus(lead.status) === 'new').length;
  }

  function getNotificationSettings() {
    const settings = window.settingsApi?.get?.() || {};
    return { showNewLeadBadge: settings.website?.showNewLeadBadge !== false };
  }

  function updateNotificationSettings(patch = {}) {
    const settings = window.settingsApi?.get?.() || {};
    const website = { showNewLeadBadge: true, ...(settings.website || {}), ...patch };
    window.settingsApi?.update?.({ website });
    window.dispatchEvent?.(new CustomEvent('website:notification-settings-changed', { detail: website }));
    return website;
  }

  function getBackendResource(endpoint, filters = {}) {
    return getApiClient()
      .get(sitePath(resolveProjectId(filters), endpoint), { query: buildWebsiteQuery(filters) })
      .then(response => unwrapBackendResponse(response, {}));
  }

  function getBackendList(endpoint, key, filters = {}, normalize = withBackendSource) {
    return getBackendResource(endpoint, filters)
      .then(payload => extractList(payload, key).map(normalize));
  }

  async function getBackendDataset(filters = {}) {
    const [summary, leads, events, sources, visitors, sessions, pages, errors] = await Promise.all([
      getBackendResource('summary', filters),
      getBackendResource('leads', filters),
      getBackendResource('events', filters),
      getBackendResource('sources', filters),
      getBackendResource('visitors', filters),
      getBackendResource('sessions', filters),
      getBackendResource('pages', filters),
      getBackendResource('errors', filters)
    ]);
    return normalizeBackendDataset({ summary, leads, events, sources, visitors, sessions, pages, errors }, filters);
  }

  function getBackendStatistics(filters = {}) {
    return getBackendDataset(filters);
  }

  function getBackendNewLeadCount(filters = {}) {
    return getBackendResource('leads', { ...filters, status: 'new' }).then(payload => {
      const leads = extractList(payload, 'leads').map(normalizeLead);
      return Number(payload?.total ?? payload?.count ?? leads.length);
    });
  }

  function postBackendLead(row = {}) {
    const projectId = resolveProjectId(row);
    const payload = { ...row, status: 'new' };
    return getApiClient()
      .post(sitePath(projectId, 'leads'), payload)
      .then(response => unwrapBackendResponse(response, null))
      .then(data => {
        const lead = normalizeLead(data?.lead || data || payload);
        notifyLeadsChanged({ action: 'created', lead });
        return lead;
      });
  }

  function updateBackendLeadStatus(leadId, status, options = {}) {
    const id = String(leadId || '');
    if (!id) return Promise.resolve(null);
    const projectId = resolveProjectId(options);
    return getApiClient()
      .patch(`${sitePath(projectId, 'leads')}/${encodeURIComponent(id)}`, { status: normalizeLeadStatus(status) })
      .then(response => unwrapBackendResponse(response, null))
      .then(data => {
        const lead = data ? normalizeLead(data.lead || data) : null;
        if (lead) notifyLeadsChanged({ action: 'status-updated', lead });
        return lead;
      });
  }

  function passBackendIngestionRow(row = {}) {
    return Promise.resolve(withBackendSource(row));
  }

  const mockWebsiteApi = {
    createMockData,
    getAnalytics: getMockStatistics,
    getDataset: getMockDataset,
    getLeads: () => getMockDataset().websiteLeads,
    getNewLeadCount: getMockNewLeadCount,
    getPages: () => getMockDataset().websitePages,
    getStatistics: getMockStatistics,
    postError: postMockError,
    postEvent: postMockEvent,
    postLead: postMockLead,
    postPageView: postMockPageView,
    postPerformance: postMockPerformance,
    updateLeadStatus: updateMockLeadStatus
  };

  const backendWebsiteApi = {
    createMockData,
    getAnalytics: getBackendStatistics,
    getDataset: getBackendDataset,
    getLeads: filters => getBackendList('leads', 'leads', filters, normalizeLead),
    getNewLeadCount: getBackendNewLeadCount,
    getPages: filters => getBackendList('pages', 'pages', filters, normalizeBackendPage),
    getStatistics: getBackendStatistics,
    postError: passBackendIngestionRow,
    postEvent: passBackendIngestionRow,
    postLead: postBackendLead,
    postPageView: passBackendIngestionRow,
    postPerformance: passBackendIngestionRow,
    updateLeadStatus: updateBackendLeadStatus
  };

  function getActiveApi() {
    return isBackendMode() ? backendWebsiteApi : mockWebsiteApi;
  }

  function getDataset(filters = {}) {
    return getActiveApi().getDataset(filters);
  }

  function getStatistics(filters = {}) {
    return getActiveApi().getStatistics(filters);
  }

  function getLeads(filters = {}) {
    return getActiveApi().getLeads(filters);
  }

  function getPages(filters = {}) {
    return getActiveApi().getPages(filters);
  }

  function getNewLeadCount(filters = {}) {
    return getActiveApi().getNewLeadCount(filters);
  }

  function postPageView(row) {
    return getActiveApi().postPageView(row);
  }

  function postEvent(row) {
    return getActiveApi().postEvent(row);
  }

  function postLead(row) {
    return getActiveApi().postLead(row);
  }

  function postError(row) {
    return getActiveApi().postError(row);
  }

  function postPerformance(row) {
    return getActiveApi().postPerformance(row);
  }

  function updateLeadStatus(leadId, status, options = {}) {
    return getActiveApi().updateLeadStatus(leadId, status, options);
  }

  window.absApi = window.absApi || {};
  window.websiteApi = {
    createMockData,
    getAnalytics: getStatistics,
    getDataset,
    getLeads,
    getNewLeadCount,
    getNotificationSettings,
    getPages,
    getSettings,
    getStatistics,
    normalizeLeadStatus,
    postError,
    postEvent,
    postLead,
    postPageView,
    postPerformance,
    updateLeadStatus,
    updateNotificationSettings,
    updateSettings
  };
  window.absApi.website = window.websiteApi;
})();
