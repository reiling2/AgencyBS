(function () {
  'use strict';

  const EMPTY = '—';
  const excelReportTheme = {
    headerFill: '#0B1220',
    headerFont: '#FFFFFF',
    kpiFill: '#F4F7FE',
    textColor: '#101828',
    mutedColor: '#667085',
    tableStyle: 'TableStyleMedium2'
  };

  const moneyFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
  const numberFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
  const percentFormatter = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const avitoFallbackMetrics = [
    { key: 'spent', label: 'Расход', type: 'money' },
    { key: 'wallet', label: 'Баланс', type: 'money' },
    { key: 'advance', label: 'Аванс', type: 'money' },
    { key: 'leads', label: 'Лиды', type: 'number' },
    { key: 'cpl', label: 'CPL', type: 'money' },
    { key: 'views', label: 'Просмотры', type: 'number' },
    { key: 'conversion', label: 'Конверсия', type: 'percent' },
    { key: 'chats', label: 'Чаты', type: 'number' },
    { key: 'calls', label: 'Звонки', type: 'number' },
    { key: 'favorites', label: 'Избранное', type: 'number' },
    { key: 'cpc', label: 'CPC', type: 'money' },
    { key: 'adsCount', label: 'Объявления', type: 'number' }
  ];

  const websiteExtraMetrics = [
    { key: 'clickPhone', label: 'Клики по телефону', type: 'number' },
    { key: 'clickTelegram', label: 'Клики Telegram', type: 'number' },
    { key: 'clickWhatsapp', label: 'Клики WhatsApp', type: 'number' },
    { key: 'formStarts', label: 'Старты формы', type: 'number' },
    { key: 'scrollToForm', label: 'Скролл до формы', type: 'number' },
    { key: 'scrollToFormPercent', label: 'Скролл до формы, %', type: 'percent' }
  ];

  function hasXlsx() {
    return Boolean(window.XLSX?.utils?.book_new && window.XLSX?.utils?.book_append_sheet);
  }

  function rgb(color) {
    return String(color || '').replace('#', '').toUpperCase();
  }

  function asNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function cleanExcelValue(value) {
    if (value === null || value === undefined) return EMPTY;
    if (typeof value === 'number' && !Number.isFinite(value)) return EMPTY;
    return value;
  }

  function formatMoney(value) {
    const number = asNumber(value);
    return number === null ? EMPTY : `${moneyFormatter.format(Math.round(number))} ₽`;
  }

  function formatPercent(value) {
    const number = asNumber(value);
    return number === null ? EMPTY : `${percentFormatter.format(number)}%`;
  }

  function formatDate(value) {
    if (!value) return EMPTY;
    const date = new Date(String(value).includes('T') ? value : `${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('ru-RU');
  }

  function formatDateTime(value) {
    if (!value) return EMPTY;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return EMPTY;
    return date.toLocaleString('ru-RU');
  }

  function formatNumber(value) {
    const number = asNumber(value);
    return number === null ? EMPTY : numberFormatter.format(Math.round(number));
  }

  function formatForDisplay(value, type) {
    if (type === 'money') return formatMoney(value);
    if (type === 'percent') return formatPercent(value);
    if (type === 'date') return formatDate(value);
    if (type === 'number') return formatNumber(value);
    const clean = cleanExcelValue(value);
    return clean === '' ? '' : clean;
  }

  function toCellValue(value, type) {
    if (type === 'date') {
      if (!value) return { v: EMPTY, t: 's' };
      const date = new Date(String(value).includes('T') ? value : `${value}T00:00:00`);
      if (Number.isNaN(date.getTime())) return { v: String(value), t: 's' };
      return { v: date, t: 'd', z: 'dd.mm.yyyy' };
    }

    const number = asNumber(value);
    if (['money', 'number'].includes(type) && number !== null) {
      return { v: number, t: 'n', z: type === 'money' ? '#,##0 "₽"' : '#,##0' };
    }

    if (type === 'percent' && number !== null) {
      return { v: number / 100, t: 'n', z: '0.00%' };
    }

    return { v: cleanExcelValue(value), t: 's' };
  }

  function createWorkbook() {
    return hasXlsx() ? window.XLSX.utils.book_new() : null;
  }

  function createSheet() {
    if (!hasXlsx()) return null;
    const sheet = window.XLSX.utils.aoa_to_sheet([]);
    sheet['!cols'] = [];
    sheet['!rows'] = [];
    return sheet;
  }

  function updateRange(sheet, rowIndex, colIndex) {
    const cell = { r: rowIndex - 1, c: colIndex - 1 };
    const range = sheet['!ref']
      ? window.XLSX.utils.decode_range(sheet['!ref'])
      : { s: { ...cell }, e: { ...cell } };

    range.s.r = Math.min(range.s.r, cell.r);
    range.s.c = Math.min(range.s.c, cell.c);
    range.e.r = Math.max(range.e.r, cell.r);
    range.e.c = Math.max(range.e.c, cell.c);
    sheet['!ref'] = window.XLSX.utils.encode_range(range);
  }

  function setCell(sheet, rowIndex, colIndex, value, style = {}, type = '') {
    const address = window.XLSX.utils.encode_cell({ r: rowIndex - 1, c: colIndex - 1 });
    const cell = toCellValue(value, type);
    sheet[address] = { ...cell, s: style };
    updateRange(sheet, rowIndex, colIndex);
  }

  function mergeCells(sheet, rangeAddress) {
    const range = window.XLSX.utils.decode_range(rangeAddress);
    sheet['!merges'] = sheet['!merges'] || [];
    sheet['!merges'].push(range);
  }

  function safeSheetName(name) {
    return String(name || 'Лист')
      .replace(/[\\/?*[\]:]/g, ' ')
      .slice(0, 31);
  }

  const styles = {
    title: {
      font: { bold: true, color: { rgb: rgb(excelReportTheme.headerFont) }, sz: 16 },
      fill: { fgColor: { rgb: rgb(excelReportTheme.headerFill) } },
      alignment: { vertical: 'center' }
    },
    metaLabel: {
      font: { bold: true, color: { rgb: rgb(excelReportTheme.mutedColor) } },
      fill: { fgColor: { rgb: 'F8FAFC' } },
      border: border('D8E0EC')
    },
    metaValue: {
      font: { color: { rgb: rgb(excelReportTheme.textColor) } },
      fill: { fgColor: { rgb: 'FFFFFF' } },
      border: border('D8E0EC')
    },
    kpiLabel: {
      font: { bold: true, color: { rgb: rgb(excelReportTheme.mutedColor) } },
      fill: { fgColor: { rgb: rgb(excelReportTheme.kpiFill) } },
      border: border('D8E0EC')
    },
    kpiValue: {
      font: { bold: true, color: { rgb: rgb(excelReportTheme.textColor) }, sz: 12 },
      fill: { fgColor: { rgb: rgb(excelReportTheme.kpiFill) } },
      border: border('D8E0EC')
    },
    tableHeader: {
      font: { bold: true, color: { rgb: rgb(excelReportTheme.headerFont) } },
      fill: { fgColor: { rgb: rgb(excelReportTheme.headerFill) } },
      alignment: { vertical: 'center' },
      border: border('243047')
    },
    tableCell: {
      font: { color: { rgb: rgb(excelReportTheme.textColor) } },
      border: border('E4EAF4'),
      alignment: { vertical: 'top', wrapText: true }
    }
  };

  function border(color) {
    const line = { style: 'thin', color: { rgb: rgb(color) } };
    return { top: line, right: line, bottom: line, left: line };
  }

  function addReportHeader(sheet, options = {}) {
    const period = options.period || '';
    const project = options.project || '';
    const generatedAt = options.generatedAt || new Date().toISOString();

    mergeCells(sheet, 'A1:H1');
    setCell(sheet, 1, 1, options.title || 'Отчёт', styles.title);
    sheet['!rows'][0] = { hpt: 28 };

    setCell(sheet, 2, 1, 'Период', styles.metaLabel);
    mergeCells(sheet, 'B2:H2');
    setCell(sheet, 2, 2, period || EMPTY, styles.metaValue);

    setCell(sheet, 3, 1, 'Срез', styles.metaLabel);
    mergeCells(sheet, 'B3:H3');
    setCell(sheet, 3, 2, project || EMPTY, styles.metaValue);

    setCell(sheet, 4, 1, 'Сформировано', styles.metaLabel);
    mergeCells(sheet, 'B4:H4');
    setCell(sheet, 4, 2, formatDateTime(generatedAt) || formatDateTime(new Date().toISOString()), styles.metaValue);
  }

  function addKpiGrid(sheet, kpis = [], startRow = 5) {
    const cleanKpis = (kpis || []).filter(Boolean);
    if (!cleanKpis.length) {
      mergeCells(sheet, `A${startRow}:H${startRow}`);
      setCell(sheet, startRow, 1, 'Нет выбранных показателей', styles.kpiLabel);
      return startRow + 2;
    }

    cleanKpis.forEach((kpi, index) => {
      const row = startRow + Math.floor(index / 4) * 3;
      const col = 1 + (index % 4) * 2;
      setCell(sheet, row, col, kpi.label, styles.kpiLabel);
      setCell(sheet, row, col + 1, kpi.value, styles.kpiValue, kpi.type);
      sheet['!rows'][row - 1] = { hpt: 22 };
    });

    return startRow + Math.ceil(cleanKpis.length / 4) * 3 + 1;
  }

  function applyColumnWidths(sheet, widths = []) {
    sheet['!cols'] = widths.map(width => ({ wch: width || 14 }));
  }

  function applyNumberFormats(sheet, tableStartRow, headers, rowCount) {
    headers.forEach((header, colIndex) => {
      if (!['money', 'percent', 'number', 'date'].includes(header.type)) return;
      for (let offset = 0; offset < rowCount; offset += 1) {
        const address = window.XLSX.utils.encode_cell({ r: tableStartRow + offset, c: colIndex });
        if (!sheet[address]) continue;
        if (header.type === 'money') sheet[address].z = '#,##0 "₽"';
        if (header.type === 'percent') sheet[address].z = '0.00%';
        if (header.type === 'number') sheet[address].z = '#,##0';
        if (header.type === 'date') sheet[address].z = 'dd.mm.yyyy';
      }
    });
  }

  function freezeHeaderRow(sheet, rowIndex = 1) {
    sheet['!freeze'] = {
      xSplit: 0,
      ySplit: Math.max(1, rowIndex),
      topLeftCell: `A${Math.max(2, rowIndex + 1)}`,
      activePane: 'bottomLeft',
      state: 'frozen'
    };
  }

  function addStyledTable(sheet, options = {}) {
    const headers = options.headers || [];
    const rows = options.rows || [];
    const startRow = options.startRow || 1;
    const title = options.title || '';

    let tableRow = startRow;
    if (title) {
      mergeCells(sheet, `A${tableRow}:${window.XLSX.utils.encode_col(Math.max(0, headers.length - 1))}${tableRow}`);
      setCell(sheet, tableRow, 1, title, styles.metaLabel);
      tableRow += 2;
    }

    headers.forEach((header, index) => {
      setCell(sheet, tableRow, index + 1, header.label, styles.tableHeader);
    });
    sheet['!rows'][tableRow - 1] = { hpt: 24 };

    rows.forEach((row, rowIndex) => {
      headers.forEach((header, colIndex) => {
        const value = Array.isArray(row) ? row[colIndex] : row[header.key];
        setCell(sheet, tableRow + rowIndex + 1, colIndex + 1, value, styles.tableCell, header.type);
      });
    });

    if (rows.length) {
      sheet['!autofilter'] = {
        ref: window.XLSX.utils.encode_range({
          s: { r: tableRow - 1, c: 0 },
          e: { r: tableRow + rows.length - 1, c: Math.max(0, headers.length - 1) }
        })
      };
      applyNumberFormats(sheet, tableRow, headers, rows.length);
    }

    applyColumnWidths(sheet, headers.map(header => header.width || 14));
    freezeHeaderRow(sheet, tableRow);
    return tableRow + rows.length + 2;
  }

  function downloadWorkbook(workbook, filename) {
    if (!hasXlsx() || !workbook) return false;
    if (window.XLSX.writeFile) {
      window.XLSX.writeFile(workbook, filename);
      return true;
    }

    const output = window.XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([output], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    downloadBlob(filename, blob);
    return true;
  }

  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function downloadCsv(filename, rows) {
    const csv = (rows || [])
      .map(row => row.map(value => `"${String(cleanExcelValue(value)).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    downloadBlob(filename, new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }));
  }

  function downloadExcelHtml(filename, html) {
    downloadBlob(filename, new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' }));
  }

  function normalizeSelection(selectedMetrics, available) {
    const keys = available.map(metric => metric.key);
    if (!Array.isArray(selectedMetrics)) return keys;
    return selectedMetrics.filter(key => keys.includes(key));
  }

  function getAvitoMetrics(selectedMetrics) {
    const available = window.statisticsApi?.getAvailableMetrics?.() || avitoFallbackMetrics;
    const selected = normalizeSelection(selectedMetrics, available);
    return available.filter(metric => selected.includes(metric.key));
  }

  function getWebsiteMetrics(selectedMetrics) {
    const base = [
      ...(window.websiteStatsService?.SELECTABLE_METRICS || []),
      ...websiteExtraMetrics
    ];
    const deduped = base.filter((metric, index, array) => array.findIndex(item => item.key === metric.key) === index);
    const selected = normalizeSelection(selectedMetrics, deduped);
    return deduped.filter(metric => selected.includes(metric.key));
  }

  function avitoSummaryValue(summary, key) {
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

  function avitoDailyValue(project, row, key) {
    const leads = Number(row.chats || 0) + Number(row.calls || 0);
    const views = Number(row.views || 0);
    const spent = Number(row.spent || 0);
    switch (key) {
      case 'spent': return spent;
      case 'wallet': return Number(project.finance?.walletBalance || 0);
      case 'advance': return Number(project.finance?.clientAdvance || 0);
      case 'leads': return leads;
      case 'cpl': return leads ? spent / leads : null;
      case 'views': return views;
      case 'conversion': return views ? leads / views * 100 : null;
      case 'chats': return Number(row.chats || 0);
      case 'calls': return Number(row.calls || 0);
      case 'favorites': return Number(row.favorites || 0);
      case 'cpc': return views ? spent / views : null;
      case 'adsCount': return Number(project.metrics?.adsCount || 0);
      default: return null;
    }
  }

  function buildAvitoProjectRows(summary) {
    return (summary.projects || []).map(project => ({
      projectName: project.name,
      spent: project.totals.spent,
      wallet: project.finance.walletBalance,
      advance: project.finance.clientAdvance,
      leads: project.totals.leads,
      cpl: project.totals.cpl,
      cpc: project.totals.cpc,
      views: project.totals.views,
      conversion: project.totals.conversion,
      chats: project.totals.chats,
      calls: project.totals.calls,
      favorites: project.totals.favorites,
      adsCount: project.totals.adsCount,
      forecastDays: project.finance.forecastDays ?? EMPTY
    }));
  }

  function buildAvitoDailyRows(projects, metrics) {
    const rows = [];
    (projects || []).forEach(project => {
      (project.dailyStats || []).forEach(day => {
        const row = {
          date: day.date,
          projectName: project.name
        };
        metrics.forEach(metric => {
          row[metric.key] = avitoDailyValue(project, day, metric.key);
        });
        rows.push(row);
      });
    });
    return rows.sort((left, right) => `${left.date}${left.projectName}`.localeCompare(`${right.date}${right.projectName}`));
  }

  function periodLabel(dateFrom, dateTo) {
    if (!dateFrom && !dateTo) return EMPTY;
    if (dateFrom === dateTo) return formatDate(dateFrom);
    return `${formatDate(dateFrom)} — ${formatDate(dateTo)}`;
  }

  function addNoData(sheet, row = 6) {
    mergeCells(sheet, `A${row}:H${row}`);
    setCell(sheet, row, 1, 'Нет данных за выбранный период', styles.kpiLabel);
    applyColumnWidths(sheet, [18, 18, 18, 18, 18, 18, 18, 18]);
  }

  function addSheet(workbook, name, sheet) {
    window.XLSX.utils.book_append_sheet(workbook, sheet, safeSheetName(name));
  }

  function exportAvitoStatistics({ projectId = 'all', dateFrom = '', dateTo = '', selectedMetrics = null } = {}) {
    const metrics = getAvitoMetrics(selectedMetrics);
    const payload = window.statisticsApi.getStats({ projectId, dateFrom, dateTo });
    const summary = window.statisticsService.summarize(payload);
    const isAllProjects = !projectId || projectId === 'all';
    const projectName = isAllProjects
      ? 'Все проекты'
      : (summary.projects[0]?.name || 'Выбранный проект');
    const dailyRows = buildAvitoDailyRows(payload.projects, metrics);
    const fileDate = window.absFormatters?.todayIso?.() || new Date().toISOString().slice(0, 10);

    if (!hasXlsx()) {
      return exportAvitoCsv({ projectName, dateFrom, dateTo, metrics, summary, dailyRows, filename: `avito-statistics-${fileDate}.csv` });
    }

    const workbook = createWorkbook();
    const overview = createSheet();
    addReportHeader(overview, {
      title: 'Статистика Авито',
      period: periodLabel(dateFrom, dateTo),
      project: projectName,
      generatedAt: payload.generatedAt
    });

    if (!dailyRows.length) {
      addNoData(overview);
      addSheet(workbook, 'Обзор', overview);
      downloadWorkbook(workbook, `avito-statistics-${fileDate}.xlsx`);
      return workbook;
    }

    const overviewKpis = metrics.map(metric => ({
      label: metric.label,
      value: avitoSummaryValue(summary, metric.key),
      type: metric.type
    }));
    let nextRow = addKpiGrid(overview, overviewKpis, 5);

    if (isAllProjects) {
      const projectHeaders = buildAvitoProjectHeaders(metrics);
      nextRow = addStyledTable(overview, {
        title: 'Сводка по проектам',
        startRow: nextRow,
        headers: projectHeaders,
        rows: buildAvitoProjectRows(summary)
      });
    }

    applyColumnWidths(overview, [24, 16, 18, 16, 18, 16, 18, 16]);
    addSheet(workbook, 'Обзор', overview);

    if (isAllProjects) {
      const projectSheet = createSheet();
      addStyledTable(projectSheet, {
        startRow: 1,
        headers: buildAvitoProjectHeaders(metrics),
        rows: buildAvitoProjectRows(summary)
      });
      addSheet(workbook, 'Проекты', projectSheet);
    }

    const dailySheet = createSheet();
    addStyledTable(dailySheet, {
      startRow: 1,
      headers: [
        { key: 'date', label: 'Дата', type: 'date', width: 14 },
        { key: 'projectName', label: 'Проект', width: 34 },
        ...metrics.map(metric => ({ ...metric, width: metric.type === 'money' ? 15 : 13 }))
      ],
      rows: dailyRows
    });
    addSheet(workbook, 'По дням', dailySheet);
    downloadWorkbook(workbook, `avito-statistics-${fileDate}.xlsx`);
    return workbook;
  }

  function buildAvitoProjectHeaders(metrics) {
    const headers = [{ key: 'projectName', label: 'Проект', width: 34 }];
    metrics.forEach(metric => {
      headers.push({ ...metric, width: metric.type === 'money' ? 15 : 13 });
    });
    if (metrics.some(metric => metric.key === 'wallet')) {
      headers.push({ key: 'forecastDays', label: 'Хватит на дней', type: 'number', width: 16 });
    }
    return headers;
  }

  function exportAvitoCsv({ projectName, dateFrom, dateTo, metrics, summary, dailyRows, filename }) {
    const rows = [
      ['Статистика Авито'],
      ['Период', periodLabel(dateFrom, dateTo)],
      ['Срез', projectName],
      [],
      ['Показатель', 'Значение'],
      ...metrics.map(metric => [metric.label, formatForDisplay(avitoSummaryValue(summary, metric.key), metric.type)]),
      [],
      ['Дата', 'Проект', ...metrics.map(metric => metric.label)],
      ...dailyRows.map(row => [
        formatDate(row.date),
        row.projectName,
        ...metrics.map(metric => formatForDisplay(row[metric.key], metric.type))
      ])
    ];
    downloadCsv(filename, rows);
  }

  function getWebsiteDataset() {
    if (window.websiteApi?.getStatistics) return window.websiteApi.getStatistics({});
    if (window.websiteApi?.getDataset) return window.websiteApi.getDataset();
    return {};
  }

  function inRange(row, range) {
    const date = String(row.createdAt || row.startedAt || row.firstSeenAt || '').slice(0, 10);
    return date && date >= range.dateFrom && date <= range.dateTo;
  }

  function filterByRange(rows, range) {
    return (rows || []).filter(row => inRange(row, range));
  }

  function buildWebsiteRange(dateFrom, dateTo) {
    const today = window.absFormatters?.todayIso?.() || new Date().toISOString().slice(0, 10);
    const start = dateFrom || today;
    const end = dateTo || start;
    return { dateFrom: start, dateTo: end, group: start === end ? 'hour' : 'day' };
  }

  function buildWebsiteDailyRows(dataset, range, metrics) {
    return window.websiteStatsService
      .buildExportRows(dataset, range, metrics.map(metric => metric.key))
      .map(row => {
        const cleanRow = { period: row.period };
        metrics.forEach(metric => {
          cleanRow[metric.key] = row[metric.key];
        });
        return cleanRow;
      });
  }

  function exportWebsiteStatistics({ dateFrom = '', dateTo = '', selectedMetrics = null } = {}) {
    const dataset = getWebsiteDataset();
    const range = buildWebsiteRange(dateFrom, dateTo);
    const metrics = getWebsiteMetrics(selectedMetrics);
    const summary = window.websiteStatsService.calcSummary(dataset, range);
    const dailyRows = buildWebsiteDailyRows(dataset, range, metrics);
    const fileDate = window.absFormatters?.todayIso?.() || new Date().toISOString().slice(0, 10);

    if (!hasXlsx()) {
      return exportWebsiteCsv({ range, metrics, summary, dailyRows, filename: `website-statistics-${fileDate}.csv` });
    }

    const workbook = createWorkbook();
    const overview = createSheet();
    addReportHeader(overview, {
      title: 'Статистика сайта',
      period: periodLabel(range.dateFrom, range.dateTo),
      project: 'Сайт',
      generatedAt: new Date().toISOString()
    });
    let nextRow = addKpiGrid(overview, metrics.map(metric => ({
      label: metric.label,
      value: summary[metric.key],
      type: metric.type
    })), 5);

    const pages = window.websiteStatsService.buildPages(dataset, range);
    if (pages.length) {
      nextRow = addStyledTable(overview, {
        title: 'Лучшие страницы',
        startRow: nextRow,
        headers: websitePageHeaders(),
        rows: pages.slice(0, 10)
      });
    }
    applyColumnWidths(overview, [24, 16, 18, 16, 18, 16, 18, 16]);
    addSheet(workbook, 'Обзор', overview);

    const dailySheet = createSheet();
    addStyledTable(dailySheet, {
      startRow: 1,
      headers: [
        { key: 'period', label: range.group === 'hour' ? 'Час' : 'Дата', width: 14 },
        ...metrics.map(metric => ({ ...metric, width: metric.type === 'percent' ? 16 : 14 }))
      ],
      rows: dailyRows
    });
    addSheet(workbook, 'По дням', dailySheet);

    const leads = filterByRange(dataset.websiteLeads, range);
    if (leads.length) {
      const sheet = createSheet();
      addStyledTable(sheet, { startRow: 1, headers: websiteLeadHeaders(), rows: leads.map(mapLeadRow) });
      addSheet(workbook, 'Заявки', sheet);
    }

    if (pages.length) {
      const sheet = createSheet();
      addStyledTable(sheet, { startRow: 1, headers: websitePageHeaders(), rows: pages });
      addSheet(workbook, 'Страницы', sheet);
    }

    const events = filterByRange(dataset.websiteEvents, range);
    if (events.length) {
      const sheet = createSheet();
      addStyledTable(sheet, { startRow: 1, headers: websiteEventHeaders(), rows: events.map(mapEventRow) });
      addSheet(workbook, 'Действия', sheet);
    }

    const techRows = buildTechnicalRows(dataset, range);
    if (techRows.length) {
      const sheet = createSheet();
      addStyledTable(sheet, { startRow: 1, headers: technicalHeaders(), rows: techRows });
      addSheet(workbook, 'Техническое', sheet);
    }

    downloadWorkbook(workbook, `website-statistics-${fileDate}.xlsx`);
    return workbook;
  }

  function exportWebsiteCsv({ range, metrics, summary, dailyRows, filename }) {
    const rows = [
      ['Статистика сайта'],
      ['Период', periodLabel(range.dateFrom, range.dateTo)],
      [],
      ['Показатель', 'Значение'],
      ...metrics.map(metric => [metric.label, formatForDisplay(summary[metric.key], metric.type)]),
      [],
      [range.group === 'hour' ? 'Час' : 'Дата', ...metrics.map(metric => metric.label)],
      ...dailyRows.map(row => [
        row.period,
        ...metrics.map(metric => formatForDisplay(row[metric.key], metric.type))
      ])
    ];
    downloadCsv(filename, rows);
  }

  function websiteLeadHeaders() {
    return [
      { key: 'createdAt', label: 'Дата и время', width: 20 },
      { key: 'name', label: 'Имя', width: 18 },
      { key: 'phone', label: 'Телефон', width: 20 },
      { key: 'email', label: 'Email', width: 24 },
      { key: 'page', label: 'Страница', width: 24 },
      { key: 'formName', label: 'Форма', width: 22 },
      { key: 'status', label: 'Статус', width: 14 },
      { key: 'message', label: 'Комментарий', width: 34 }
    ];
  }

  function mapLeadRow(lead) {
    return {
      createdAt: formatDateTime(lead.createdAt),
      name: lead.name || EMPTY,
      phone: lead.phone || EMPTY,
      email: lead.email || EMPTY,
      page: lead.pageTitle || lead.pageUrl || EMPTY,
      formName: lead.formName || EMPTY,
      status: lead.status || EMPTY,
      message: lead.message || EMPTY
    };
  }

  function websitePageHeaders() {
    return [
      { key: 'title', label: 'Страница', width: 28 },
      { key: 'url', label: 'URL', width: 22 },
      { key: 'pageviews', label: 'Просмотры', type: 'number', width: 14 },
      { key: 'visitors', label: 'Посетители', type: 'number', width: 14 },
      { key: 'leads', label: 'Заявки', type: 'number', width: 12 },
      { key: 'conversion', label: 'Конверсия', type: 'percent', width: 14 },
      { key: 'scroll', label: 'Скролл', type: 'percent', width: 12 }
    ];
  }

  function websiteEventHeaders() {
    return [
      { key: 'createdAt', label: 'Дата и время', width: 20 },
      { key: 'eventType', label: 'Тип', width: 20 },
      { key: 'eventName', label: 'Событие', width: 24 },
      { key: 'page', label: 'Страница', width: 26 },
      { key: 'formName', label: 'Форма', width: 20 },
      { key: 'value', label: 'Значение', width: 14 },
      { key: 'visitorId', label: 'Visitor ID', width: 18 }
    ];
  }

  function mapEventRow(event) {
    return {
      createdAt: formatDateTime(event.createdAt),
      eventType: event.eventType || EMPTY,
      eventName: event.eventName || EMPTY,
      page: event.pageTitle || event.pageUrl || EMPTY,
      formName: event.formName || EMPTY,
      value: event.value ?? EMPTY,
      visitorId: event.visitorId || EMPTY
    };
  }

  function technicalHeaders() {
    return [
      { key: 'createdAt', label: 'Дата и время', width: 20 },
      { key: 'type', label: 'Тип', width: 16 },
      { key: 'pageUrl', label: 'Страница', width: 24 },
      { key: 'message', label: 'Описание', width: 34 },
      { key: 'loadTimeMs', label: 'Load, ms', type: 'number', width: 14 },
      { key: 'domReadyMs', label: 'DOM, ms', type: 'number', width: 14 }
    ];
  }

  function buildTechnicalRows(dataset, range) {
    const errors = filterByRange(dataset.websiteErrors, range).map(error => ({
      createdAt: formatDateTime(error.createdAt),
      type: error.errorType || 'Ошибка',
      pageUrl: error.pageUrl || EMPTY,
      message: error.message || EMPTY,
      loadTimeMs: EMPTY,
      domReadyMs: EMPTY
    }));
    const performance = filterByRange(dataset.websitePagePerformance, range).map(row => ({
      createdAt: formatDateTime(row.createdAt),
      type: 'Скорость',
      pageUrl: row.pageUrl || EMPTY,
      message: Number(row.loadTimeMs || 0) > 3000 ? 'Медленная загрузка' : 'Норма',
      loadTimeMs: row.loadTimeMs,
      domReadyMs: row.domReadyMs
    }));
    return [...errors, ...performance].sort((left, right) => String(left.createdAt).localeCompare(String(right.createdAt)));
  }

  window.exportService = {
    addKpiGrid,
    addReportHeader,
    addStyledTable,
    applyColumnWidths,
    applyNumberFormats,
    createWorkbook,
    downloadCsv,
    downloadExcelHtml,
    downloadWorkbook,
    excelReportTheme,
    exportAvitoStatistics,
    exportWebsiteStatistics,
    formatDate,
    formatMoney,
    formatPercent,
    freezeHeaderRow
  };
})();
