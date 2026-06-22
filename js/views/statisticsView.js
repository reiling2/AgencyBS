(function () {
  'use strict';

  const formatters = window.absFormatters;
  let currentRoot = null;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function readFilters() {
    const fallbackRange = window.statisticsService.getPeriodRange('last30');
    const fallback = {
      projectId: 'all',
      period: 'last30',
      customFrom: fallbackRange.dateFrom,
      customTo: fallbackRange.dateTo,
      chartMetric: 'leads'
    };

    return { ...fallback, ...(window.statisticsApi.getFilters?.() || {}) };
  }

  function saveFilters(filters) {
    window.statisticsApi.saveFilters?.(filters);
  }

  function getVisibleMetrics() {
    return window.statisticsApi.getMetricSettings().selectedMetrics;
  }

  function isMetricVisible(selectedMetrics, key) {
    return selectedMetrics.includes(key);
  }

  function getMetricMeta(key) {
    return window.statisticsApi.getAvailableMetrics().find(metric => metric.key === key) || { key, label: key, type: 'number' };
  }

  function formatMetricValue(key, value) {
    if (value === null || value === undefined || Number.isNaN(value)) return formatters.EMPTY;
    if (['spent', 'wallet', 'advance', 'cpl', 'cpc'].includes(key)) return formatters.money(value);
    if (key === 'conversion') return formatters.percent(value, 1);
    return formatters.number(value);
  }

  function deltaClass(value, inverse = false) {
    if (value === null || value === undefined) return 'is-flat';
    if (Math.abs(value) < 0.1) return 'is-flat';
    const positive = inverse ? value < 0 : value > 0;
    return positive ? 'is-good' : 'is-bad';
  }

  function formatDelta(value) {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    const sign = value > 0 ? '+' : '';
    return `${sign}${formatters.decimal(value, 1)}%`;
  }

  function metricValueFromSummary(summary, key) {
    switch (key) {
      case 'spent': return summary.totals.spent;
      case 'wallet': return summary.finance.walletBalance;
      case 'advance': return summary.finance.clientAdvance;
      case 'leads': return summary.totals.leads;
      case 'cpl': return summary.totals.cpl;
      case 'views': return summary.totals.views;
      case 'conversion': return summary.totals.conversion;
      case 'chats': return summary.totals.chats;
      case 'calls': return summary.totals.calls;
      case 'favorites': return summary.totals.favorites;
      case 'cpc': return summary.totals.cpc;
      case 'adsCount': return summary.totals.adsCount;
      default: return null;
    }
  }

  function getKpiCards(summary, deltas) {
    return [
      { key: 'spent', label: 'Расход', value: summary.totals.spent, helper: 'за выбранный период', delta: deltas.spent, icon: '₽', inverse: true },
      { key: 'wallet', label: 'Баланс', value: summary.finance.walletBalance, helper: summary.finance.forecastLabel, delta: deltas.wallet, icon: '◌' },
      { key: 'advance', label: 'Аванс', value: summary.finance.clientAdvance, helper: `Остаток: ${formatters.money(summary.finance.advanceRemainder)}`, delta: deltas.advance, icon: 'A' },
      { key: 'leads', label: 'Лиды', value: summary.totals.leads, helper: `${formatters.number(summary.totals.chats)} чатов · ${formatters.number(summary.totals.calls)} звонков`, delta: deltas.leads, icon: '↳' },
      { key: 'cpl', label: 'CPL', value: summary.totals.cpl, helper: 'расход / лиды', delta: deltas.cpl, icon: 'L', inverse: true },
      { key: 'views', label: 'Просмотры', value: summary.totals.views, helper: 'по объявлениям Авито', delta: deltas.views, icon: 'V' },
      { key: 'conversion', label: 'Конверсия', value: summary.totals.conversion, helper: 'просмотр → лид', delta: deltas.conversion, icon: '%' },
      { key: 'chats', label: 'Чаты', value: summary.totals.chats, helper: 'сообщения из Авито', delta: deltas.chats, icon: 'C' },
      { key: 'calls', label: 'Звонки', value: summary.totals.calls, helper: 'звонки из Авито', delta: deltas.calls, icon: 'T' },
      { key: 'favorites', label: 'Избранное', value: summary.totals.favorites, helper: 'добавления в избранное', delta: deltas.favorites, icon: 'F' },
      { key: 'cpc', label: 'CPC', value: summary.totals.cpc, helper: 'расход / просмотры', delta: deltas.cpc, icon: 'P', inverse: true },
      { key: 'adsCount', label: 'Объявления', value: summary.totals.adsCount, helper: 'активные объявления', delta: deltas.adsCount, icon: 'N' }
    ];
  }

  function buildHero(summary, selectedMetrics, deltas) {
    const bestProject = window.statisticsService.getBestProject(summary.projects);
    const advancePercent = Math.max(0, Math.min(100, Number(summary.finance.advanceSpentPercent || 0)));
    const moneyPrimaryKey = isMetricVisible(selectedMetrics, 'wallet')
      ? 'wallet'
      : (isMetricVisible(selectedMetrics, 'advance') ? 'advance' : (isMetricVisible(selectedMetrics, 'spent') ? 'spent' : null));
    const resultPrimaryKey = isMetricVisible(selectedMetrics, 'leads')
      ? 'leads'
      : (isMetricVisible(selectedMetrics, 'views') ? 'views' : (isMetricVisible(selectedMetrics, 'conversion') ? 'conversion' : null));

    const moneyTags = [
      isMetricVisible(selectedMetrics, 'advance') ? `<span class="stats-v6-tag is-good">Аванс: ${formatters.money(summary.finance.clientAdvance)}</span>` : '',
      isMetricVisible(selectedMetrics, 'spent') ? `<span class="stats-v6-tag is-blue">Расход: ${formatters.money(summary.totals.spent)}</span>` : '',
      isMetricVisible(selectedMetrics, 'wallet') ? `<span class="stats-v6-tag is-violet">${escapeHtml(summary.finance.forecastLabel)}</span>` : ''
    ].join('');

    const resultTags = [
      isMetricVisible(selectedMetrics, 'cpl') ? `<span class="stats-v6-tag is-good">CPL: ${formatMetricValue('cpl', summary.totals.cpl)}</span>` : '',
      isMetricVisible(selectedMetrics, 'cpc') ? `<span class="stats-v6-tag is-blue">CPC: ${formatMetricValue('cpc', summary.totals.cpc)}</span>` : '',
      isMetricVisible(selectedMetrics, 'conversion') ? `<span class="stats-v6-tag is-violet">CR: ${formatMetricValue('conversion', summary.totals.conversion)}</span>` : ''
    ].join('');

    return `
      <section class="stats-v6-hero-grid">
        <article class="stats-v6-card stats-v6-hero-card">
          <div class="stats-v6-card-head">
            <div>
              <h2>Деньги клиента</h2>
              <p>Баланс, аванс и расход за период</p>
            </div>
            <span class="stats-v6-delta ${deltaClass(deltas.wallet)}">${formatDelta(deltas.wallet)}</span>
          </div>
          <div class="stats-v6-big-number">${moneyPrimaryKey ? formatMetricValue(moneyPrimaryKey, metricValueFromSummary(summary, moneyPrimaryKey)) : '—'}</div>
          <div class="stats-v6-mini-row">${moneyTags || '<span class="stats-v6-muted">Показатели скрыты</span>'}</div>
          <div class="stats-v6-progress">
            <span style="width:${advancePercent}%"></span>
          </div>
          <div class="stats-v6-split">
            <span>Использовано аванса</span>
            <strong>${formatters.percent(advancePercent, 1)}</strong>
          </div>
        </article>

        <article class="stats-v6-card stats-v6-hero-card">
          <div class="stats-v6-card-head">
            <div>
              <h2>Ключевой результат</h2>
              <p>Лиды, стоимость и конверсия</p>
            </div>
            <span class="stats-v6-delta ${deltaClass(deltas.leads)}">${formatDelta(deltas.leads)}</span>
          </div>
          <div class="stats-v6-big-number">${resultPrimaryKey ? formatMetricValue(resultPrimaryKey, metricValueFromSummary(summary, resultPrimaryKey)) : '—'}</div>
          <div class="stats-v6-mini-row">${resultTags || '<span class="stats-v6-muted">Показатели скрыты</span>'}</div>
          <div class="stats-v6-result-line">
            <span>Лучший проект</span>
            <strong>${bestProject ? escapeHtml(bestProject.name) : '—'}</strong>
          </div>
        </article>
      </section>
    `;
  }

  function buildKpis(summary, selectedMetrics, deltas) {
    const cards = getKpiCards(summary, deltas)
      .filter(card => isMetricVisible(selectedMetrics, card.key))
      .map(card => `
        <article class="stats-v6-kpi stats-v6-card" data-metric="${escapeHtml(card.key)}">
          <div class="stats-v6-kpi-top">
            <span>${escapeHtml(card.label)}</span>
            <i>${escapeHtml(card.icon)}</i>
          </div>
          <strong>${formatMetricValue(card.key, card.value)}</strong>
          <div class="stats-v6-kpi-bottom">
            <small>${escapeHtml(card.helper)}</small>
            <b class="${deltaClass(card.delta, card.inverse)}">${formatDelta(card.delta)}</b>
          </div>
        </article>
      `)
      .join('');

    return cards
      ? `<section class="stats-v6-kpi-grid">${cards}</section>`
      : '<section class="stats-v6-empty stats-v6-card">Нет выбранных показателей</section>';
  }

  function buildChartSvg(series, metric) {
    if (!series.length) {
      return '<div class="stats-v6-empty">Нет данных за выбранный период</div>';
    }

    const width = 920;
    const height = 240;
    const padX = 34;
    const padY = 24;
    const values = series.map(point => Number(point.value || 0));
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1;
    const points = series.map((point, index) => {
      const x = series.length === 1 ? width / 2 : padX + index / (series.length - 1) * (width - padX * 2);
      const y = height - padY - ((Number(point.value || 0) - minValue) / range) * (height - padY * 2);
      return { x, y, point };
    });
    const line = points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
    const area = `M${points[0].x.toFixed(2)} ${height - padY} ${points.map(point => `L${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ')} L${points[points.length - 1].x.toFixed(2)} ${height - padY} Z`;
    const grid = [0.25, 0.5, 0.75].map(step => {
      const y = padY + step * (height - padY * 2);
      return `<line x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}" />`;
    }).join('');
    const labelIndexes = [...new Set([0, Math.floor((series.length - 1) / 2), series.length - 1])];
    const labels = labelIndexes.map(index => {
      const point = points[index];
      return `<text x="${point.x}" y="${height - 4}" text-anchor="middle">${escapeHtml(formatters.dateShort(point.point.date))}</text>`;
    }).join('');
    const last = points[points.length - 1];

    return `
      <svg class="stats-v6-chart" viewBox="0 0 ${width} ${height}" aria-label="График динамики">
        <defs>
          <linearGradient id="statsV6Area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#3b6df6" stop-opacity=".24"/>
            <stop offset="100%" stop-color="#3b6df6" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <g class="stats-v6-grid">${grid}</g>
        <path class="stats-v6-chart-area" d="${area}"></path>
        <path class="stats-v6-chart-line" d="${line}"></path>
        <circle class="stats-v6-chart-dot" cx="${last.x}" cy="${last.y}" r="5"></circle>
        <g class="stats-v6-chart-labels">${labels}</g>
      </svg>
    `;
  }

  function buildChart(summary, rawProjects, filters) {
    const series = window.statisticsService.buildChartSeries(rawProjects, filters.chartMetric);
    const chartLabels = {
      leads: 'Лиды',
      spent: 'Расход',
      cpl: 'CPL'
    };
    const buttons = ['leads', 'spent', 'cpl'].map(key => `
      <button class="${filters.chartMetric === key ? 'active' : ''}" type="button" data-chart-metric="${key}">
        ${escapeHtml(chartLabels[key])}
      </button>
    `).join('');
    const lastPoint = series[series.length - 1];
    const lastValue = lastPoint ? formatMetricValue(filters.chartMetric, lastPoint.value) : '—';

    return `
      <article class="stats-v6-card stats-v6-chart-card">
        <div class="stats-v6-card-head">
          <div>
            <h2>Динамика</h2>
            <p>${escapeHtml(chartLabels[filters.chartMetric])} по дням</p>
          </div>
          <div class="stats-v6-segmented">${buttons}</div>
        </div>
        ${buildChartSvg(series, filters.chartMetric)}
        <div class="stats-v6-chart-foot">
          <span>Последняя точка</span>
          <strong>${lastValue}</strong>
        </div>
      </article>
    `;
  }

  function buildLeadSources(summary, selectedMetrics) {
    const sources = window.statisticsService.getLeadSourceStructure(summary)
      .filter(source => isMetricVisible(selectedMetrics, source.key))
      .map(source => `
        <div class="stats-v6-channel" data-metric="${escapeHtml(source.key)}">
          <div class="stats-v6-channel-icon">${source.key === 'chats' ? 'C' : source.key === 'calls' ? 'T' : 'F'}</div>
          <div>
            <strong>${escapeHtml(source.label)}</strong>
            <span>${formatters.number(source.value)} · ${formatters.percent(source.percent, 1)}</span>
          </div>
          <div class="stats-v6-channel-bar"><span style="width:${Math.max(0, Math.min(100, Number(source.percent || 0)))}%"></span></div>
        </div>
      `).join('');

    return `
      <article class="stats-v6-card stats-v6-source-card">
        <div class="stats-v6-card-head">
          <div>
            <h2>Структура обращений</h2>
            <p>Распределение источников лидов</p>
          </div>
        </div>
        <div class="stats-v6-channel-list">
          ${sources || '<div class="stats-v6-empty compact">Показатели скрыты</div>'}
        </div>
      </article>
    `;
  }

  function buildProjects(summary, previousSummary) {
    const previousById = new Map((previousSummary.projects || []).map(project => [project.id, project]));
    const cards = summary.projects.map(project => {
      const previous = previousById.get(project.id);
      const leadDelta = previous ? (project.totals.leads - previous.totals.leads) / Math.max(previous.totals.leads, 1) * 100 : null;

      return `
        <article class="stats-v6-project" role="button" tabindex="0" data-project-id="${escapeHtml(project.id)}">
          <div class="stats-v6-project-top">
            <div>
              <strong>${escapeHtml(project.name)}</strong>
              <span>${escapeHtml(project.status)} · ${escapeHtml(project.niche || 'Авито')}</span>
            </div>
            <b class="${deltaClass(leadDelta)}">${formatDelta(leadDelta)}</b>
          </div>
          <div class="stats-v6-project-metrics">
            <span><b>${formatters.number(project.totals.leads)}</b> лидов</span>
            <span><b>${formatMetricValue('cpl', project.totals.cpl)}</b> CPL</span>
            <span><b>${formatters.money(project.totals.spent)}</b> расход</span>
            <span><b>${formatMetricValue('conversion', project.totals.conversion)}</b> CR</span>
          </div>
          <div class="stats-v6-project-foot">
            <span>${formatters.money(project.finance.walletBalance)}</span>
            <span>${escapeHtml(project.finance.forecastLabel)}</span>
          </div>
        </article>
      `;
    }).join('');

    return `
      <article class="stats-v6-card stats-v6-projects-card">
        <div class="stats-v6-card-head">
          <div>
            <h2>Проекты</h2>
            <p>Показатели по проектам за период</p>
          </div>
          <span class="stats-v6-count">${summary.projects.length}</span>
        </div>
        <div class="stats-v6-project-grid">${cards || '<div class="stats-v6-empty compact">Нет данных за выбранный период</div>'}</div>
      </article>
    `;
  }

  function buildBalance(summary) {
    const rows = summary.projects.map(project => `
      <div class="stats-v6-balance-row">
        <div>
          <strong>${escapeHtml(project.name)}</strong>
          <span>${escapeHtml(project.finance.forecastLabel)}</span>
        </div>
        <div>
          <b>${formatters.money(project.finance.walletBalance)}</b>
          <span>${project.finance.averageDailySpend === null ? '—' : `${formatters.money(project.finance.averageDailySpend)} / день`}</span>
        </div>
      </div>
    `).join('');

    return `
      <article class="stats-v6-card stats-v6-balance-card">
        <div class="stats-v6-card-head">
          <div>
            <h2>Баланс по проектам</h2>
            <p>Прогноз по последним активным дням</p>
          </div>
        </div>
        <div class="stats-v6-balance-list">${rows || '<div class="stats-v6-empty compact">Нет данных за выбранный период</div>'}</div>
      </article>
    `;
  }

  function buildMetricPicker(metrics, selectedMetrics) {
    const toggles = metrics.map(metric => `
      <label class="stats-v6-toggle">
        <input type="checkbox" data-stats-metric="${escapeHtml(metric.key)}" ${selectedMetrics.includes(metric.key) ? 'checked' : ''}>
        <span>${escapeHtml(metric.label)}</span>
      </label>
    `).join('');

    return `
      <article class="stats-v6-card stats-v6-metric-picker" id="statsV6MetricPicker">
        <div class="stats-v6-card-head">
          <div>
            <h2>Показатели</h2>
            <p>Набор метрик</p>
          </div>
          <span class="stats-v6-count">${selectedMetrics.length}</span>
        </div>
        <div class="stats-v6-toggle-grid">${toggles}</div>
      </article>
    `;
  }

  function buildTopbar(projects, filters, range, selectedMetrics) {
    const projectOptions = [
      '<option value="all">Все проекты</option>',
      ...projects.map(project => `<option value="${escapeHtml(project.id)}" ${project.id === filters.projectId ? 'selected' : ''}>${escapeHtml(project.name)}</option>`)
    ].join('');
    const isCustom = filters.period === 'custom';

    return `
      <section class="stats-v6-topbar">
        <div class="stats-v6-title-wrap">
          <div class="stats-v6-eyebrow"><span></span> Обновлено сегодня</div>
          <h1>Статистика Авито</h1>
          <p>Финансы, обращения и динамика по проектам</p>
        </div>
        <div class="stats-v6-toolbar">
          <label class="stats-v6-field">
            <span>Проект</span>
            <select id="statsV6Project">${projectOptions}</select>
          </label>
          <label class="stats-v6-field">
            <span>Период</span>
            <select id="statsV6Period">
              <option value="last7" ${filters.period === 'last7' ? 'selected' : ''}>7 дней</option>
              <option value="last30" ${filters.period === 'last30' ? 'selected' : ''}>30 дней</option>
              <option value="month" ${filters.period === 'month' ? 'selected' : ''}>Текущий месяц</option>
              <option value="custom" ${filters.period === 'custom' ? 'selected' : ''}>Свой период</option>
            </select>
          </label>
          <label class="stats-v6-field stats-v6-custom ${isCustom ? '' : 'is-hidden'}">
            <span>От</span>
            <input id="statsV6From" type="date" value="${escapeHtml(filters.customFrom || range.dateFrom)}">
          </label>
          <label class="stats-v6-field stats-v6-custom ${isCustom ? '' : 'is-hidden'}">
            <span>До</span>
            <input id="statsV6To" type="date" value="${escapeHtml(filters.customTo || range.dateTo)}">
          </label>
          <button class="stats-v6-btn" type="button" id="statsV6MetricScroll">Метрики · ${selectedMetrics.length}</button>
          <button class="stats-v6-btn primary" type="button" id="statsV6Export">Excel</button>
        </div>
      </section>
    `;
  }

  function buildDashboard(summary, previousSummary, rawProjects, filters, selectedMetrics, deltas, metrics) {
    if (!summary.avitoConnected) {
      return '<div class="stats-v6-empty stats-v6-card">Авито не подключено</div>';
    }

    if (!summary.dailyStats.length) {
      return '<div class="stats-v6-empty stats-v6-card">Нет данных за выбранный период</div>';
    }

    return `
      <section class="stats-v6-dashboard">
        <div class="stats-v6-stack">
          ${buildHero(summary, selectedMetrics, deltas)}
          ${buildKpis(summary, selectedMetrics, deltas)}
          <section class="stats-v6-mid-grid">
            ${buildChart(summary, rawProjects, filters)}
            ${buildLeadSources(summary, selectedMetrics)}
          </section>
          ${buildProjects(summary, previousSummary)}
        </div>
        <aside class="stats-v6-right-stack">
          ${buildBalance(summary)}
          ${buildMetricPicker(metrics, selectedMetrics)}
        </aside>
      </section>
    `;
  }

  function render(options = {}) {
    const root = options.root || currentRoot || document.getElementById('view-stats');
    currentRoot = root;
    if (!root) return;

    if (!window.statisticsApi || !window.statisticsService || !window.absFormatters) {
      root.innerHTML = '<div class="stats-v6-empty stats-v6-card">Раздел статистики не загружен</div>';
      return;
    }

    try {
      const filters = readFilters();
      const range = window.statisticsService.getPeriodRange(filters.period, filters.customFrom, filters.customTo);
      const previousRange = window.statisticsService.getPreviousRange(range);
      const projects = window.statisticsApi.getProjects();
      const metrics = window.statisticsApi.getAvailableMetrics();
      const selectedMetrics = getVisibleMetrics();
      const payload = window.statisticsApi.getStats({
        projectId: filters.projectId,
        dateFrom: range.dateFrom,
        dateTo: range.dateTo
      });
      const previousPayload = previousRange ? window.statisticsApi.getStats({
        projectId: filters.projectId,
        dateFrom: previousRange.dateFrom,
        dateTo: previousRange.dateTo
      }) : { projects: [] };
      const summary = window.statisticsService.summarize(payload);
      const previousSummary = window.statisticsService.summarize(previousPayload);
      const deltas = window.statisticsService.compareSummaries(summary, previousSummary);

      root.innerHTML = `
        <div class="stats-v6">
          ${buildTopbar(projects, filters, range, selectedMetrics)}
          ${buildDashboard(summary, previousSummary, payload.projects, filters, selectedMetrics, deltas, metrics)}
        </div>
      `;

      bindEvents(root, filters, range, metrics, selectedMetrics, payload.projects);
    } catch (err) {
      console.error(err);
      root.innerHTML = '<div class="stats-v6-empty stats-v6-card">Не удалось загрузить статистику</div>';
    }
  }

  function updateFilters(next) {
    const filters = { ...readFilters(), ...next };
    saveFilters(filters);
    render();
  }

  function bindEvents(root, filters, range, metrics, selectedMetrics, rawProjects) {
    root.querySelector('#statsV6Project')?.addEventListener('change', event => {
      updateFilters({ projectId: event.currentTarget.value });
    });

    root.querySelector('#statsV6Period')?.addEventListener('change', event => {
      const period = event.currentTarget.value;
      const currentRange = window.statisticsService.getPeriodRange(period, filters.customFrom || range.dateFrom, filters.customTo || range.dateTo);
      updateFilters({
        period,
        customFrom: period === 'custom' ? (filters.customFrom || currentRange.dateFrom) : filters.customFrom,
        customTo: period === 'custom' ? (filters.customTo || currentRange.dateTo) : filters.customTo
      });
    });

    root.querySelector('#statsV6From')?.addEventListener('change', event => {
      updateFilters({ customFrom: event.currentTarget.value, period: 'custom' });
    });

    root.querySelector('#statsV6To')?.addEventListener('change', event => {
      updateFilters({ customTo: event.currentTarget.value, period: 'custom' });
    });

    root.querySelectorAll('[data-chart-metric]').forEach(button => {
      button.addEventListener('click', () => updateFilters({ chartMetric: button.dataset.chartMetric }));
    });

    root.querySelector('#statsV6MetricScroll')?.addEventListener('click', () => {
      root.querySelector('#statsV6MetricPicker')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    root.querySelector('#statsV6Export')?.addEventListener('click', () => {
      exportCurrentStats(rawProjects, metrics, selectedMetrics);
    });

    root.querySelectorAll('[data-project-id]').forEach(card => {
      const selectProject = () => updateFilters({ projectId: card.dataset.projectId });
      card.addEventListener('click', selectProject);
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectProject();
        }
      });
    });

    root.querySelectorAll('[data-stats-metric]').forEach(input => {
      input.addEventListener('change', () => {
        const nextSelected = [...root.querySelectorAll('[data-stats-metric]:checked')].map(item => item.dataset.statsMetric);
        window.statisticsApi.saveMetricSettings({ selectedMetrics: nextSelected });
        render();
      });
    });
  }

  function exportCurrentStats(rawProjects, metrics, selectedMetrics) {
    const rows = window.statisticsService.buildExportRows(rawProjects, selectedMetrics);
    const headers = ['Дата', 'Проект', ...selectedMetrics.map(key => getMetricMeta(key).label)];
    const body = rows.map(row => [
      row.date,
      row.projectName,
      ...selectedMetrics.map(key => formatMetricValue(key, row.values[key]))
    ]);
    const fileDate = formatters.todayIso();

    if (window.XLSX) {
      const worksheet = window.XLSX.utils.aoa_to_sheet([headers, ...body]);
      const workbook = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Статистика Авито');
      window.XLSX.writeFile(workbook, `avito-statistics-${fileDate}.xlsx`);
      return;
    }

    downloadCsv(`avito-statistics-${fileDate}.csv`, [headers, ...body]);
  }

  function downloadCsv(filename, rows) {
    const csv = rows
      .map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  window.statisticsView = {
    render
  };
})();
