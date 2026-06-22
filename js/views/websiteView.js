(function () {
  'use strict';

  let currentRoot = null;
  let activeTab = 'statistics';
  let filters = null;
  const LEAD_STATUS_OPTIONS = [
    { value: 'new', label: 'новая', tone: 'blue' },
    { value: 'in_work', label: 'в работе', tone: 'blue' },
    { value: 'closed', label: 'закрыта', tone: 'good' },
    { value: 'spam', label: 'спам', tone: 'bad' }
  ];
  const LEGACY_LEAD_STATUSES = {
    новая: 'new',
    'в работе': 'in_work',
    закрыта: 'closed',
    спам: 'spam'
  };

  function esc(value) {
    return window.absSecurity?.escapeHtml?.(value) || String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  }

  function metricMeta(key) {
    return [...window.websiteStatsService.MAIN_METRICS, ...window.websiteStatsService.SELECTABLE_METRICS].find(metric => metric.key === key) || { key, label: key, type: 'number' };
  }

  function normalizeLeadStatus(status) {
    const value = String(status || '').trim();
    return LEAD_STATUS_OPTIONS.some(item => item.value === value) ? value : (LEGACY_LEAD_STATUSES[value] || 'new');
  }

  function leadStatusTone(status) {
    return LEAD_STATUS_OPTIONS.find(item => item.value === normalizeLeadStatus(status))?.tone || 'blue';
  }

  function renderLeadStatusSelect(lead) {
    const status = normalizeLeadStatus(lead.status);
    return `
      <select class="site-status-select ${leadStatusTone(status)}" data-lead-status="${esc(lead.id)}" aria-label="Статус заявки">
        ${LEAD_STATUS_OPTIONS.map(option => `<option value="${esc(option.value)}" ${option.value === status ? 'selected' : ''}>${esc(option.label)}</option>`).join('')}
      </select>
    `;
  }

  function valueFor(summary, key) {
    if (key === 'errors') return summary.formErrors;
    if (key === 'returns') return summary.returnVisits;
    return summary[key];
  }

  function formatMetric(summary, key) {
    return window.websiteStatsService.formatValue(key, valueFor(summary, key));
  }

  function periodLabel(period) {
    return window.websiteStatsService.PERIODS.find(item => item.key === period)?.label || 'Сегодня';
  }

  function renderHeroCard(id, metricKey, dashboard) {
    const summary = dashboard.summary;
    const meta = metricMeta(metricKey);
    const tags = [
      { cls: 'blue', text: `Посещения: ${formatMetric(summary, 'visits')}`, key: 'visits' },
      { cls: 'good', text: `Заявки: ${formatMetric(summary, 'leads')}`, key: 'leads' },
      { cls: 'violet', text: `Конверсия: ${formatMetric(summary, 'conversion')}`, key: 'conversion' }
    ];
    if (metricKey === 'visitors') {
      tags[0] = { cls: 'violet', text: `Повторные: ${formatMetric(summary, 'returnVisitors')}`, key: 'returnVisitors' };
      tags[1] = { cls: 'blue', text: `Повторные визиты: ${formatMetric(summary, 'returnVisits')}`, key: 'returnVisits' };
    }
    if (metricKey === 'formErrors') {
      tags[0] = { cls: 'bad', text: `Ошибки: ${formatMetric(summary, 'formErrors')}`, key: 'formErrors' };
      tags[1] = { cls: 'blue', text: `Открытия: ${formatMetric(summary, 'formOpens')}`, key: 'formOpens' };
    }
    return `
      <article class="site-card site-hero-card priority" id="${esc(id)}" data-metric="${esc(metricKey)}">
        <div class="site-card-head"><h2>${esc(meta.label)} ${dashboard.range.group === 'hour' ? 'сегодня' : ''}</h2></div>
        <div class="site-big-number">${formatMetric(summary, metricKey)}</div>
        <div class="site-mini-row">${tags.map(tag => `<span class="site-tag ${tag.cls}" data-metric="${esc(tag.key)}">${esc(tag.text)}</span>`).join('')}</div>
        <div class="site-summary-list">
          <div class="site-summary-item"><span>Просмотры</span><strong>${formatMetric(summary, 'pageviews')}</strong></div>
          <div class="site-summary-item"><span>Визитов на посетителя</span><strong>${window.websiteStatsService.formatValue('visitsPerVisitor', summary.visitsPerVisitor)}</strong></div>
        </div>
      </article>
    `;
  }

  function renderKpiCards(dashboard) {
    const items = [
      ['pageviews', 'Просмотры', '👁'],
      ['visitors', 'Посетители', '◎'],
      ['leads', 'Заявки', '↳'],
      ['conversion', 'Конверсия', '%'],
      ['returnVisitors', 'Повторные посетители', '↺'],
      ['returnVisits', 'Повторные визиты', '⟳'],
      ['visits', 'Посещения', '◌'],
      ['formErrors', 'Ошибки заявок', '!']
    ];
    return items.map(([key, label, icon]) => `
      <article class="site-kpi site-card" data-metric="${esc(key)}" ${dashboard.selectedMetrics.includes(key) ? '' : 'hidden'}>
        <div class="site-kpi-top"><div class="site-kpi-label">${esc(label)}</div><div class="site-kpi-icon">${esc(icon)}</div></div>
        <div class="site-kpi-value">${formatMetric(dashboard.summary, key)}</div>
        <div class="site-kpi-meta"><span class="site-delta flat">${esc(periodLabel(dashboard.filters.period))}</span></div>
      </article>
    `).join('');
  }

  function renderChart(dashboard) {
    const chartMeta = window.websiteStatsService.CHART_METRICS.find(metric => metric.key === dashboard.filters.chartMetric) || window.websiteStatsService.CHART_METRICS[0];
    return `
      <section class="site-card site-pad site-chart-card">
        <div class="site-card-head">
          <h2>График</h2>
          <div class="site-segmented" id="websiteChartTabs">
            ${window.websiteStatsService.CHART_METRICS.map(metric => `<button class="${metric.key === chartMeta.key ? 'active' : ''}" type="button" data-chart="${esc(metric.key)}">${esc(metric.label)}</button>`).join('')}
          </div>
        </div>
        <div class="site-chart-wrap">
          <svg class="site-chart" id="websiteChart" viewBox="0 0 920 240" aria-label="График сайта"></svg>
          <div class="site-chart-tooltip" id="websiteChartTooltip"></div>
        </div>
      </section>
    `;
  }

  function renderPages(dashboard) {
    return `
      <section class="site-card site-pad">
        <div class="site-card-head"><h2>Страницы</h2></div>
        <div class="site-page-grid">
          ${dashboard.pages.length ? dashboard.pages.map(page => `
            <article class="site-page-card">
              <div class="site-page-top">
                <div><div class="site-page-name">${esc(page.title)}</div><div class="site-page-url">${esc(page.url)}</div></div>
                <span class="site-badge ${Number(page.conversion || 0) >= 4 ? 'good' : 'warn'}">${window.websiteStatsService.formatValue('conversion', page.conversion)}</span>
              </div>
              <div class="site-stats-row">
                <div class="site-stat-mini"><span>Просмотры</span><strong>${window.absFormatters.number(page.pageviews)}</strong></div>
                <div class="site-stat-mini"><span>Посетители</span><strong>${window.absFormatters.number(page.visitors)}</strong></div>
                <div class="site-stat-mini"><span>Заявки</span><strong>${window.absFormatters.number(page.leads)}</strong></div>
                <div class="site-stat-mini"><span>Скролл</span><strong>${window.websiteStatsService.formatValue('scroll', page.scroll)}</strong></div>
              </div>
            </article>
          `).join('') : '<div class="site-empty">Нет данных за выбранный период</div>'}
        </div>
      </section>
    `;
  }

  function renderLeads(dashboard) {
    const newCount = dashboard.leads.filter(lead => normalizeLeadStatus(lead.status) === 'new').length;
    return `
      <article class="site-card site-pad site-leads-card">
        <div class="site-card-head"><h2>Заявки</h2>${newCount ? `<span class="site-badge blue">новых: ${window.absFormatters.number(newCount)}</span>` : ''}</div>
        <div class="site-lead-list">
          ${dashboard.leads.length ? dashboard.leads.map(lead => `
            <div class="site-lead">
              <div><strong>${esc(lead.name || 'Без имени')} · ${esc(lead.phone || '—')}</strong><span>${esc(lead.pageTitle || lead.pageUrl)} · ${esc(lead.formName || 'форма')}</span></div>
              <div><time>${esc(new Date(lead.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }))}</time>${renderLeadStatusSelect(lead)}</div>
            </div>
          `).join('') : '<div class="site-empty compact">Заявок пока нет</div>'}
        </div>
      </article>
    `;
  }

  function renderActions(dashboard) {
    const summary = dashboard.summary;
    const max = Math.max(1, summary.clickPhone, summary.clickTelegram, summary.clickWhatsapp, summary.scrollToForm);
    const rows = [
      ['☎', 'Клики по телефону', summary.clickPhone],
      ['TG', 'Клики Telegram', summary.clickTelegram],
      ['WA', 'Клики WhatsApp', summary.clickWhatsapp],
      ['↓', 'Дошли до формы', summary.scrollToFormPercent, 'percent']
    ];
    return `
      <article class="site-card site-pad">
        <div class="site-card-head"><h2>Действия</h2></div>
        <div class="site-list">
          ${rows.map(([icon, title, value, type]) => `
            <div class="site-row-card">
              <div class="site-row-icon">${esc(icon)}</div>
              <div>
                <div class="site-row-title">${esc(title)}</div>
                <div class="site-row-sub">${esc(periodLabel(dashboard.filters.period).toLowerCase())}</div>
                <div class="site-tiny-bar"><span style="width:${Math.min(100, Math.round((Number(value || 0) / max) * 100))}%"></span></div>
              </div>
              <div class="site-row-value">${type === 'percent' ? window.absFormatters.percent(value, 1) : window.absFormatters.number(value)}</div>
            </div>
          `).join('')}
        </div>
      </article>
    `;
  }

  function renderSettingsPanel(dashboard) {
    return `
      <section class="site-card site-pad">
        <div class="site-card-head"><h2>Показатели</h2></div>
        <div class="site-block-config">
          <label class="site-config-item"><span>Главный блок 1</span>${metricSelect('websiteHeroMetric1', dashboard.settings.heroMetric1 || 'pageviews')}</label>
          <label class="site-config-item"><span>Главный блок 2</span>${metricSelect('websiteHeroMetric2', dashboard.settings.heroMetric2 || 'visitors')}</label>
        </div>
        <div class="site-toggle-grid">
          ${window.websiteStatsService.SELECTABLE_METRICS.map(metric => `
            <label class="site-toggle"><input type="checkbox" data-site-metric="${esc(metric.key)}" ${dashboard.selectedMetrics.includes(metric.key) ? 'checked' : ''}><span>${esc(metric.label)}</span></label>
          `).join('')}
        </div>
      </section>
    `;
  }

  function metricSelect(id, value) {
    return `<select class="site-control compact" id="${esc(id)}">${window.websiteStatsService.MAIN_METRICS.map(metric => `<option value="${esc(metric.key)}" ${metric.key === value ? 'selected' : ''}>${esc(metric.label)}</option>`).join('')}</select>`;
  }

  function renderTech(dashboard) {
    const summary = dashboard.summary;
    const rows = [
      ['JS-ошибки', summary.jsErrors],
      ['404', summary.page404],
      ['Медленные страницы', summary.slowPages],
      ['Ошибки заявок', summary.formErrors]
    ];
    return `
      <section class="site-card site-pad">
        <div class="site-card-head"><h2>Техническое</h2></div>
        <div class="site-tech-grid">
          ${rows.map(([label, value]) => `<div class="site-tech"><span>${esc(label)}</span><strong>${window.absFormatters.number(value)}</strong><em>${esc(periodLabel(dashboard.filters.period).toLowerCase())}</em></div>`).join('')}
        </div>
      </section>
    `;
  }

  function renderStatistics(root, dashboard) {
    root.innerHTML = `
      <section class="site-topbar">
        <div><div class="site-eyebrow"><span></span>${esc(periodLabel(dashboard.filters.period))}</div><h1>Сайт</h1></div>
        <div class="site-toolbar">
          <select class="site-control" id="websitePeriod">${window.websiteStatsService.PERIODS.map(period => `<option value="${esc(period.key)}" ${period.key === dashboard.filters.period ? 'selected' : ''}>${esc(period.label)}</option>`).join('')}</select>
          <button class="site-btn primary" id="websiteExportBtn" type="button">↓ Excel</button>
        </div>
      </section>
      <div class="site-custom-period ${dashboard.filters.period === 'custom' ? '' : 'is-hidden'}" id="websiteCustomPeriod">
        <label><span>Дата начала</span><input class="site-control" id="websiteDateFrom" type="date" value="${esc(dashboard.filters.customFrom || dashboard.range.dateFrom)}"></label>
        <label><span>Дата окончания</span><input class="site-control" id="websiteDateTo" type="date" value="${esc(dashboard.filters.customTo || dashboard.range.dateTo)}"></label>
        <button class="site-btn primary" id="websiteApplyPeriod" type="button">Применить</button>
        <button class="site-btn" id="websiteResetPeriod" type="button">Сбросить</button>
      </div>
      <div class="site-tabs"><button class="site-tab active" data-site-tab="statistics">Статистика сайта</button><button class="site-tab" data-site-tab="admin">Админ-панель</button></div>
      <section class="site-dashboard">
        <div class="site-stack">
          <section class="site-hero-grid">
            ${renderHeroCard('siteHeroBlock1', dashboard.settings.heroMetric1 || 'pageviews', dashboard)}
            ${renderHeroCard('siteHeroBlock2', dashboard.settings.heroMetric2 || 'visitors', dashboard)}
          </section>
          <section class="site-kpi-grid">${renderKpiCards(dashboard)}</section>
          ${renderChart(dashboard)}
          ${renderPages(dashboard)}
          <section class="site-two-grid">${renderLeads(dashboard)}${renderActions(dashboard)}</section>
        </div>
        <aside class="site-right-stack">
          ${renderSettingsPanel(dashboard)}
          ${renderTech(dashboard)}
        </aside>
      </section>
    `;
  }

  function renderAdmin(root, dashboard) {
    root.innerHTML = `
      <section class="site-topbar">
        <div><div class="site-eyebrow"><span></span>Структура</div><h1>Сайт</h1></div>
      </section>
      <div class="site-tabs"><button class="site-tab" data-site-tab="statistics">Статистика сайта</button><button class="site-tab active" data-site-tab="admin">Админ-панель</button></div>
      <section class="site-admin-grid">
        ${dashboard.adminStructure.map(item => `
          <article class="site-card site-admin-card">
            <div class="site-row-icon">${esc(item.title.slice(0, 1))}</div>
            <div><h3>${esc(item.title)}</h3><p>${esc(item.hint)}</p></div>
            <strong>${window.absFormatters.number(item.count)}</strong>
          </article>
        `).join('')}
      </section>
      <section class="site-card site-pad">
        <div class="site-card-head"><h2>Стабильные ключи</h2></div>
        <div class="site-key-grid">
          <code>data-page-id</code><code>data-block-id</code><code>data-content-key</code><code>data-form-id</code><code>data-track-event</code>
        </div>
      </section>
    `;
  }

  function drawChart(dashboard) {
    const svg = currentRoot?.querySelector('#websiteChart');
    const tooltip = currentRoot?.querySelector('#websiteChartTooltip');
    if (!svg || !tooltip) return;
    const data = dashboard.chart;
    const meta = window.websiteStatsService.CHART_METRICS.find(metric => metric.key === dashboard.filters.chartMetric) || window.websiteStatsService.CHART_METRICS[0];
    const width = 920;
    const height = 240;
    const left = 42;
    const right = 30;
    const top = 28;
    const bottom = 42;
    const innerW = width - left - right;
    const innerH = height - top - bottom;
    const max = Math.max(1, ...data.map(point => Number(point.value || 0))) * 1.12;
    const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;
    const coords = data.map((point, index) => ({
      ...point,
      x: left + index * stepX,
      y: top + innerH - (Number(point.value || 0) / max) * innerH
    }));
    const path = coords.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
    const area = `${path} L${coords[coords.length - 1]?.x || left},${height - bottom} L${left},${height - bottom} Z`;
    const labels = coords.filter((_, index) => index === 0 || index === coords.length - 1 || index === Math.floor(coords.length / 2)).map(point => `<text x="${point.x}" y="${height - 12}" fill="var(--site-muted-2)" font-size="12" text-anchor="middle">${esc(point.label)}</text>`).join('');
    svg.innerHTML = `
      <defs><linearGradient id="siteAreaGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="var(--site-blue)" stop-opacity=".26"/><stop offset="100%" stop-color="var(--site-blue)" stop-opacity="0"/></linearGradient></defs>
      <g>${[0, 1, 2, 3].map(index => `<line x1="${left}" y1="${top + index * (innerH / 3)}" x2="${width - right}" y2="${top + index * (innerH / 3)}" stroke="var(--site-line)" stroke-width="1"/>`).join('')}</g>
      <path d="${area}" fill="url(#siteAreaGradient)"/><path d="${path}" fill="none" stroke="var(--site-blue)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <g>${coords.map(point => `<circle cx="${point.x}" cy="${point.y}" r="4.5" fill="var(--site-blue)"/>`).join('')}</g>
      <g>${labels}</g>
      <g id="siteHoverLayer" style="display:none"><line id="siteHoverLine" x1="0" y1="${top}" x2="0" y2="${height - bottom}" stroke="var(--site-muted)" stroke-width="1.5" stroke-dasharray="5 5"/><circle id="siteHoverDot" cx="0" cy="0" r="6" fill="var(--site-panel)" stroke="var(--site-blue)" stroke-width="3"/></g>
      <rect id="siteHoverCapture" x="${left}" y="${top}" width="${innerW}" height="${innerH}" fill="transparent"></rect>
    `;
    const layer = svg.querySelector('#siteHoverLayer');
    const line = svg.querySelector('#siteHoverLine');
    const dot = svg.querySelector('#siteHoverDot');
    const capture = svg.querySelector('#siteHoverCapture');
    const update = clientX => {
      const rect = svg.getBoundingClientRect();
      const localX = (clientX - rect.left) * (width / rect.width);
      const index = Math.max(0, Math.min(coords.length - 1, Math.round((localX - left) / stepX)));
      const point = coords[index];
      layer.style.display = 'block';
      line.setAttribute('x1', point.x);
      line.setAttribute('x2', point.x);
      dot.setAttribute('cx', point.x);
      dot.setAttribute('cy', point.y);
      tooltip.innerHTML = `<span class="site-chart-tip-label">${esc(meta.label)}</span><span class="site-chart-tip-value">${meta.type === 'percent' ? window.absFormatters.percent(point.value, 2) : window.absFormatters.number(point.value)}</span><span class="site-chart-tip-date">${esc(point.label)}</span>`;
      tooltip.style.left = `${(point.x / width) * rect.width}px`;
      tooltip.style.top = `${(point.y / height) * rect.height}px`;
      tooltip.style.opacity = '1';
    };
    capture.addEventListener('mousemove', event => update(event.clientX));
    capture.addEventListener('mouseenter', event => update(event.clientX));
    capture.addEventListener('mouseleave', () => {
      layer.style.display = 'none';
      tooltip.style.opacity = '0';
    });
  }

  function bindEvents(root, dashboard) {
    root.querySelectorAll('[data-site-tab]').forEach(button => {
      button.addEventListener('click', () => {
        activeTab = button.dataset.siteTab;
        render({ root });
      });
    });
    if (activeTab !== 'statistics') return;
    root.querySelector('#websitePeriod')?.addEventListener('change', event => {
      filters = { ...filters, period: event.currentTarget.value };
      window.websiteService.saveFilters(filters);
      render({ root });
    });
    root.querySelector('#websiteApplyPeriod')?.addEventListener('click', () => {
      filters = {
        ...filters,
        period: 'custom',
        customFrom: root.querySelector('#websiteDateFrom')?.value || '',
        customTo: root.querySelector('#websiteDateTo')?.value || ''
      };
      window.websiteService.saveFilters(filters);
      render({ root });
    });
    root.querySelector('#websiteResetPeriod')?.addEventListener('click', () => {
      filters = { ...filters, period: 'today', customFrom: '', customTo: '' };
      window.websiteService.saveFilters(filters);
      render({ root });
    });
    root.querySelector('#websiteExportBtn')?.addEventListener('click', () => window.websiteService.exportCsv(dashboard));
    root.querySelectorAll('[data-chart]').forEach(button => {
      button.addEventListener('click', () => {
        filters = { ...filters, chartMetric: button.dataset.chart };
        window.websiteService.saveFilters(filters);
        render({ root });
      });
    });
    ['websiteHeroMetric1', 'websiteHeroMetric2'].forEach((id, index) => {
      root.querySelector(`#${id}`)?.addEventListener('change', event => {
        window.websiteService.saveSettings({ [index === 0 ? 'heroMetric1' : 'heroMetric2']: event.currentTarget.value });
        render({ root });
      });
    });
    root.querySelectorAll('[data-site-metric]').forEach(input => {
      input.addEventListener('change', () => {
        const selectedMetrics = [...root.querySelectorAll('[data-site-metric]:checked')].map(item => item.dataset.siteMetric);
        window.websiteService.saveSettings({ selectedMetrics });
        render({ root });
      });
    });
    root.querySelectorAll('[data-lead-status]').forEach(select => {
      select.addEventListener('change', event => {
        const updated = window.websiteService.updateLeadStatus(event.currentTarget.dataset.leadStatus, event.currentTarget.value);
        if (!updated) return;
        window.absApp?.updateWebsiteNewLeadBadge?.();
        render({ root });
      });
    });
  }

  function render(options = {}) {
    const root = options.root || currentRoot || document.getElementById('view-site');
    currentRoot = root;
    if (!root) return;
    filters = filters || window.websiteService.getDefaultFilters();
    const dashboard = window.websiteService.getDashboard(filters);
    root.classList.add('site-view');
    if (activeTab === 'admin') renderAdmin(root, dashboard);
    else renderStatistics(root, dashboard);
    bindEvents(root, dashboard);
    if (activeTab === 'statistics') drawChart(dashboard);
  }

  window.websiteView = { render };
})();
