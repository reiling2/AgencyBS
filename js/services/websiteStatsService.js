(function () {
  'use strict';

  const formatters = window.absFormatters;
  const DAY = 86400000;
  const PERIODS = [
    { key: 'today', label: 'Сегодня' },
    { key: 'yesterday', label: 'Вчера' },
    { key: 'last7', label: 'Последние 7 дней' },
    { key: 'last30', label: 'Последние 30 дней' },
    { key: 'month', label: 'Этот месяц' },
    { key: 'custom', label: 'Произвольный период' }
  ];
  const MAIN_METRICS = [
    { key: 'pageviews', label: 'Просмотры', type: 'number' },
    { key: 'visitors', label: 'Посетители', type: 'number' },
    { key: 'visits', label: 'Посещения', type: 'number' },
    { key: 'leads', label: 'Заявки', type: 'number' },
    { key: 'conversion', label: 'Конверсия', type: 'percent' },
    { key: 'returnVisitors', label: 'Повторные посетители', type: 'number' },
    { key: 'returnVisits', label: 'Повторные визиты', type: 'number' },
    { key: 'formErrors', label: 'Ошибки заявок', type: 'number' }
  ];
  const SELECTABLE_METRICS = [
    { key: 'leads', label: 'Заявки', type: 'number' },
    { key: 'conversion', label: 'Конверсия', type: 'percent' },
    { key: 'visitors', label: 'Посетители', type: 'number' },
    { key: 'returnVisitors', label: 'Повторные посетители', type: 'number' },
    { key: 'returnVisits', label: 'Повторные визиты', type: 'number' },
    { key: 'visits', label: 'Посещения', type: 'number' },
    { key: 'pageviews', label: 'Просмотры', type: 'number' },
    { key: 'formOpens', label: 'Открытия заявки', type: 'number' },
    { key: 'formErrors', label: 'Ошибки заявок', type: 'number' },
    { key: 'scroll', label: 'Скролл', type: 'percent' }
  ];
  const CHART_METRICS = [
    { key: 'leads', label: 'Заявки', type: 'number' },
    { key: 'visits', label: 'Посещения', type: 'number' },
    { key: 'returns', label: 'Повторы', type: 'number' },
    { key: 'conversion', label: 'Конверсия', type: 'percent' },
    { key: 'errors', label: 'Ошибки', type: 'number' }
  ];

  function parseDate(value) {
    return new Date(`${value}T00:00:00`);
  }

  function todayIso() {
    return formatters.todayIso();
  }

  function getPeriodRange(period = 'today', customFrom = '', customTo = '') {
    const today = todayIso();
    const todayDate = parseDate(today);
    if (period === 'yesterday') {
      const value = formatters.dateToIso(new Date(todayDate.getTime() - DAY));
      return { dateFrom: value, dateTo: value, group: 'hour' };
    }
    if (period === 'last7') {
      return { dateFrom: formatters.dateToIso(new Date(todayDate.getTime() - 6 * DAY)), dateTo: today, group: 'day' };
    }
    if (period === 'last30') {
      return { dateFrom: formatters.dateToIso(new Date(todayDate.getTime() - 29 * DAY)), dateTo: today, group: 'day' };
    }
    if (period === 'month') {
      const first = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
      return { dateFrom: formatters.dateToIso(first), dateTo: today, group: 'day' };
    }
    if (period === 'custom') {
      const dateFrom = customFrom || today;
      const dateTo = customTo || dateFrom;
      return { dateFrom, dateTo, group: dateFrom === dateTo ? 'hour' : 'day' };
    }
    return { dateFrom: today, dateTo: today, group: 'hour' };
  }

  function inRange(row, range) {
    const date = String(row.createdAt || row.startedAt || row.firstSeenAt || '').slice(0, 10);
    return date >= range.dateFrom && date <= range.dateTo;
  }

  function byRange(rows, range) {
    return (rows || []).filter(row => inRange(row, range));
  }

  function uniqueCount(rows, key) {
    return new Set((rows || []).map(row => row[key]).filter(Boolean)).size;
  }

  function eventCount(events, type) {
    return events.filter(event => event.eventType === type).length;
  }

  function getSessionCounts(sessions) {
    return sessions.reduce((acc, session) => {
      acc[session.visitorId] = (acc[session.visitorId] || 0) + 1;
      return acc;
    }, {});
  }

  function calcSummary(dataset, range) {
    const pageViews = byRange(dataset.websitePageViews, range);
    const sessions = byRange(dataset.websiteSessions, range);
    const events = byRange(dataset.websiteEvents, range);
    const leads = byRange(dataset.websiteLeads, range);
    const errors = byRange(dataset.websiteErrors, range);
    const performance = byRange(dataset.websitePagePerformance, range);
    const visitors = uniqueCount([...pageViews, ...sessions], 'visitorId');
    const visits = uniqueCount(sessions, 'sessionId');
    const sessionCounts = getSessionCounts(sessions);
    const returnVisitors = Object.values(sessionCounts).filter(count => count > 1).length;
    const returnVisits = Math.max(0, visits - visitors);
    const formOpens = eventCount(events, 'form_open');
    const formErrors = eventCount(events, 'form_error');
    const formStarts = eventCount(events, 'form_start');
    const scrollValues = events.filter(event => event.eventType === 'scroll_depth').map(event => Number(event.value)).filter(Number.isFinite);
    const scroll = scrollValues.length ? scrollValues.reduce((sum, value) => sum + value, 0) / scrollValues.length : null;
    const slowPages = performance.filter(row => Number(row.loadTimeMs || 0) > 3000).length;
    return {
      pageviews: pageViews.length,
      visitors,
      visits,
      leads: leads.length,
      conversion: visitors ? leads.length / visitors * 100 : null,
      visitConversion: visits ? leads.length / visits * 100 : null,
      returnVisitors,
      returnVisits,
      visitsPerVisitor: visitors ? visits / visitors : null,
      formOpens,
      formStarts,
      formErrors,
      scroll,
      clickPhone: eventCount(events, 'click_phone'),
      clickTelegram: eventCount(events, 'click_telegram'),
      clickWhatsapp: eventCount(events, 'click_whatsapp'),
      scrollToForm: eventCount(events, 'scroll_to_form'),
      scrollToFormPercent: visits ? eventCount(events, 'scroll_to_form') / visits * 100 : null,
      jsErrors: errors.filter(error => error.errorType === 'js_error').length,
      page404: errors.filter(error => error.errorType === 'page_404').length,
      slowPages,
      pageViews,
      sessions,
      events,
      leadsRows: leads,
      errors,
      performance
    };
  }

  function formatValue(metricKey, value) {
    const meta = [...MAIN_METRICS, ...SELECTABLE_METRICS, { key: 'visitsPerVisitor', type: 'decimal' }].find(metric => metric.key === metricKey) || {};
    if (value === null || value === undefined || Number.isNaN(value)) return formatters.EMPTY;
    if (meta.type === 'percent') return formatters.percent(value, metricKey === 'conversion' ? 2 : 1);
    if (meta.type === 'decimal') return formatters.decimal(value, 2);
    return formatters.number(value);
  }

  function bucketKey(dateTime, range) {
    if (range.group === 'hour') return String(new Date(dateTime).getHours()).padStart(2, '0');
    return String(dateTime).slice(0, 10);
  }

  function bucketLabel(key, range) {
    if (range.group === 'hour') return `${key}:00`;
    return formatters.dateShort(key);
  }

  function createBuckets(range) {
    if (range.group === 'hour') {
      return Array.from({ length: 24 }, (_, hour) => {
        const key = String(hour).padStart(2, '0');
        return { key, label: `${key}:00`, rows: [] };
      });
    }
    const days = formatters.daysBetweenInclusive(range.dateFrom, range.dateTo);
    return Array.from({ length: Math.max(1, days) }, (_, index) => {
      const key = formatters.dateToIso(new Date(parseDate(range.dateFrom).getTime() + index * DAY));
      return { key, label: formatters.dateShort(key), rows: [] };
    });
  }

  function buildChart(dataset, range, metricKey = 'leads') {
    const buckets = createBuckets(range);
    const bucketMap = Object.fromEntries(buckets.map(bucket => [bucket.key, bucket]));
    const summaryForBucket = bucket => {
      const bucketRange = range.group === 'hour'
        ? { dateFrom: range.dateFrom, dateTo: range.dateTo, group: 'hour', hour: bucket.key }
        : { dateFrom: bucket.key, dateTo: bucket.key, group: 'day' };
      const filterByBucket = rows => byRange(rows, bucketRange).filter(row => {
        if (range.group !== 'hour') return true;
        const dateTime = row.createdAt || row.startedAt || row.firstSeenAt || '';
        return bucketKey(dateTime, range) === bucket.key;
      });
      return calcSummary({
        ...dataset,
        websitePageViews: filterByBucket(dataset.websitePageViews),
        websiteSessions: filterByBucket(dataset.websiteSessions),
        websiteEvents: filterByBucket(dataset.websiteEvents),
        websiteLeads: filterByBucket(dataset.websiteLeads),
        websiteErrors: filterByBucket(dataset.websiteErrors),
        websitePagePerformance: filterByBucket(dataset.websitePagePerformance)
      }, bucketRange);
    };
    return buckets.map(bucket => {
      const summary = summaryForBucket(bucket);
      const value = metricKey === 'returns'
        ? summary.returnVisits
        : metricKey === 'errors'
          ? summary.formErrors
          : summary[metricKey];
      return { key: bucket.key, label: bucketLabel(bucket.key, range), value: value ?? 0 };
    });
  }

  function buildPages(dataset, range) {
    const pageViews = byRange(dataset.websitePageViews, range);
    const leads = byRange(dataset.websiteLeads, range);
    const events = byRange(dataset.websiteEvents, range);
    const pages = dataset.websitePages || [];
    return pages.map(page => {
      const views = pageViews.filter(row => row.pageUrl === page.slug);
      const pageLeads = leads.filter(row => row.pageUrl === page.slug);
      const visitors = uniqueCount(views, 'visitorId');
      const scrollValues = events.filter(event => event.eventType === 'scroll_depth' && event.pageUrl === page.slug).map(event => Number(event.value)).filter(Number.isFinite);
      const scroll = scrollValues.length ? scrollValues.reduce((sum, value) => sum + value, 0) / scrollValues.length : null;
      return {
        id: page.id,
        title: page.title,
        url: page.slug,
        pageviews: views.length,
        visitors,
        leads: pageLeads.length,
        conversion: visitors ? pageLeads.length / visitors * 100 : null,
        scroll
      };
    }).filter(page => page.pageviews || page.leads);
  }

  function buildExportRows(dataset, range, selectedMetrics) {
    return buildChart(dataset, range, 'leads').map(bucket => {
      const bucketRange = range.group === 'hour'
        ? { ...range, hour: bucket.key }
        : { dateFrom: bucket.key, dateTo: bucket.key, group: 'day' };
      const filterRows = rows => byRange(rows, bucketRange).filter(row => range.group !== 'hour' || bucketKey(row.createdAt || row.startedAt, range) === bucket.key);
      const summary = calcSummary({
        ...dataset,
        websitePageViews: filterRows(dataset.websitePageViews),
        websiteSessions: filterRows(dataset.websiteSessions),
        websiteEvents: filterRows(dataset.websiteEvents),
        websiteLeads: filterRows(dataset.websiteLeads),
        websiteErrors: filterRows(dataset.websiteErrors),
        websitePagePerformance: filterRows(dataset.websitePagePerformance)
      }, bucketRange);
      const row = { period: bucket.label };
      selectedMetrics.forEach(key => { row[key] = summary[key]; });
      return row;
    });
  }

  function getAdminStructure(dataset) {
    return [
      { key: 'pages', title: 'Страницы', count: dataset.websitePages.length, hint: 'WebsitePage' },
      { key: 'blocks', title: 'Блоки', count: dataset.websiteContentBlocks.length, hint: 'WebsiteContentBlock' },
      { key: 'forms', title: 'Формы', count: dataset.websiteForms.length, hint: 'WebsiteForm' },
      { key: 'services', title: 'Услуги', count: dataset.websiteContentBlocks.filter(block => block.blockId === 'services').length, hint: 'data-block-id="services"' },
      { key: 'seo', title: 'SEO', count: 1, hint: 'WebsiteSeoSettings' },
      { key: 'media', title: 'Медиа', count: dataset.websiteMedia.length, hint: 'WebsiteMedia' },
      { key: 'settings', title: 'Настройки сайта', count: 1, hint: 'WebsiteSiteSettings' }
    ];
  }

  window.websiteStatsService = {
    CHART_METRICS,
    MAIN_METRICS,
    PERIODS,
    SELECTABLE_METRICS,
    buildChart,
    buildExportRows,
    buildPages,
    calcSummary,
    formatValue,
    getAdminStructure,
    getPeriodRange
  };
})();
