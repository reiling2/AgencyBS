(function () {
  'use strict';

  const formatters = window.absFormatters;

  function getPeriodRange(period = 'today', customFrom = '', customTo = '') {
    const today = formatters.todayIso();
    const todayDate = new Date(`${today}T00:00:00`);

    if (period === 'today') {
      return {
        dateFrom: today,
        dateTo: today,
        label: 'Сегодня'
      };
    }

    if (period === 'custom' && customFrom && customTo && customFrom <= customTo) {
      return { dateFrom: customFrom, dateTo: customTo, label: `${customFrom} — ${customTo}` };
    }

    if (period === 'last7') {
      return {
        dateFrom: formatters.dateToIso(formatters.addDays(todayDate, -6)),
        dateTo: today,
        label: 'Последние 7 дней'
      };
    }

    if (period === 'month') {
      const start = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
      return {
        dateFrom: formatters.dateToIso(start),
        dateTo: today,
        label: 'Текущий месяц'
      };
    }

    return {
      dateFrom: formatters.dateToIso(formatters.addDays(todayDate, -29)),
      dateTo: today,
      label: 'Последние 30 дней'
    };
  }

  function getPreviousRange(range) {
    const days = formatters.daysBetweenInclusive(range.dateFrom, range.dateTo);
    if (!days) return null;
    const start = new Date(`${range.dateFrom}T00:00:00`);
    return {
      dateFrom: formatters.dateToIso(formatters.addDays(start, -days)),
      dateTo: formatters.dateToIso(formatters.addDays(start, -1))
    };
  }

  function sumDailyStats(dailyStats) {
    return dailyStats.reduce((acc, row) => {
      acc.spent += Number(row.spent || 0);
      acc.views += Number(row.views || 0);
      acc.chats += Number(row.chats || 0);
      acc.calls += Number(row.calls || 0);
      acc.favorites += Number(row.favorites || 0);
      return acc;
    }, { spent: 0, views: 0, chats: 0, calls: 0, favorites: 0 });
  }

  function enrichTotals(totals, adsCount = 0) {
    const leads = totals.chats + totals.calls;

    return {
      ...totals,
      leads,
      adsCount,
      cpl: formatters.safeDivide(totals.spent, leads),
      cpc: formatters.safeDivide(totals.spent, totals.views),
      conversion: formatters.safeDivide(leads, totals.views) === null
        ? null
        : formatters.safeDivide(leads, totals.views) * 100
    };
  }

  function average(values) {
    const clean = values.filter(value => Number.isFinite(value) && value > 0);
    if (!clean.length) return null;
    return clean.reduce((sum, value) => sum + value, 0) / clean.length;
  }

  function getBalanceForecastData(walletBalance, dailySpendStats) {
    const wallet = Number(walletBalance || 0);
    const activeRows = (dailySpendStats || [])
      .filter(row => Number(row.spent || 0) > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (wallet <= 0 || !activeRows.length) {
      return { label: 'Недостаточно данных', days: null, range: null, averageDailySpend: null };
    }

    const last7 = activeRows.slice(-7);
    const last3 = activeRows.slice(-3);
    const avg7 = average(last7.map(row => Number(row.spent || 0)));
    const avg3 = average(last3.map(row => Number(row.spent || 0)));

    if (!avg7) {
      return { label: 'Недостаточно данных', days: null, range: null, averageDailySpend: null };
    }

    const forecast7 = wallet / avg7;
    const forecast3 = avg3 ? wallet / avg3 : forecast7;
    const low = Math.max(1, Math.floor(Math.min(forecast3, forecast7)));
    const high = Math.max(low, Math.ceil(Math.max(forecast3, forecast7)));

    if (!Number.isFinite(low) || !Number.isFinite(high)) {
      return { label: 'Недостаточно данных', days: null, range: null, averageDailySpend: avg7 };
    }

    if (high - low > 1) {
      return {
        label: `Хватит на ${low}–${high} дней`,
        days: Math.round(forecast7),
        range: [low, high],
        averageDailySpend: avg7
      };
    }

    const rounded = Math.max(1, Math.round(forecast7));
    return {
      label: `Хватит на ${rounded} дней`,
      days: rounded,
      range: null,
      averageDailySpend: avg7
    };
  }

  function getBalanceForecastLabel(walletBalance, dailySpendStats) {
    return getBalanceForecastData(walletBalance, dailySpendStats).label;
  }

  function calculateAverageDailySpend(dailyStats) {
    const activeRows = dailyStats.filter(row => Number(row.spent || 0) > 0);
    if (!activeRows.length) return null;
    return activeRows.reduce((sum, row) => sum + Number(row.spent || 0), 0) / activeRows.length;
  }

  function summarizeProject(project) {
    const rawTotals = sumDailyStats(project.dailyStats || []);
    const totals = enrichTotals(rawTotals, Number(project.metrics?.adsCount || 0));
    const walletBalance = Number(project.finance?.walletBalance || 0);
    const clientAdvance = Number(project.finance?.clientAdvance || 0);
    const advanceRemainder = clientAdvance - totals.spent;
    const advanceSpentPercent = formatters.safeDivide(totals.spent, clientAdvance);
    const forecast = getBalanceForecastData(walletBalance, project.dailyStats || []);
    const averageDailySpend = calculateAverageDailySpend(project.dailyStats || []);

    return {
      id: project.id,
      name: project.name,
      title: project.title || project.name,
      niche: project.niche,
      status: project.status,
      account: project.account,
      dailyStats: project.dailyStats || [],
      totals,
      finance: {
        walletBalance,
        clientAdvance,
        advanceRemainder,
        advanceSpentPercent: advanceSpentPercent === null ? null : advanceSpentPercent * 100,
        averageDailySpend,
        forecastLabel: forecast.label,
        forecastDays: forecast.days,
        forecastRange: forecast.range
      }
    };
  }

  function aggregateDailyStats(projects) {
    const byDate = new Map();

    projects.forEach(project => {
      (project.dailyStats || []).forEach(row => {
        const current = byDate.get(row.date) || {
          date: row.date,
          spent: 0,
          views: 0,
          chats: 0,
          calls: 0,
          favorites: 0
        };
        current.spent += Number(row.spent || 0);
        current.views += Number(row.views || 0);
        current.chats += Number(row.chats || 0);
        current.calls += Number(row.calls || 0);
        current.favorites += Number(row.favorites || 0);
        byDate.set(row.date, current);
      });
    });

    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  }

  function summarize(statsPayload) {
    const projects = Array.isArray(statsPayload?.projects) ? statsPayload.projects : [];
    const projectSummaries = projects.map(summarizeProject);
    const dailyStats = aggregateDailyStats(projects);
    const rawTotals = sumDailyStats(dailyStats);
    const totals = enrichTotals(
      rawTotals,
      projectSummaries.reduce((sum, project) => sum + Number(project.totals.adsCount || 0), 0)
    );
    const walletBalance = projectSummaries.reduce((sum, project) => sum + project.finance.walletBalance, 0);
    const clientAdvance = projectSummaries.reduce((sum, project) => sum + project.finance.clientAdvance, 0);
    const advanceRemainder = clientAdvance - totals.spent;
    const advanceSpentPercent = formatters.safeDivide(totals.spent, clientAdvance);
    const forecast = getBalanceForecastData(walletBalance, dailyStats);

    return {
      projects: projectSummaries,
      dailyStats,
      totals,
      finance: {
        walletBalance,
        clientAdvance,
        advanceRemainder,
        advanceSpentPercent: advanceSpentPercent === null ? null : advanceSpentPercent * 100,
        averageDailySpend: calculateAverageDailySpend(dailyStats),
        forecastLabel: forecast.label,
        forecastDays: forecast.days,
        forecastRange: forecast.range
      },
      generatedAt: statsPayload?.generatedAt || new Date().toISOString(),
      avitoConnected: statsPayload?.avitoConnected !== false
    };
  }

  function deltaPercent(current, previous) {
    const value = Number(current || 0);
    const baseline = Number(previous || 0);
    if (!baseline) return null;
    return (value - baseline) / baseline * 100;
  }

  function compareSummaries(current, previous) {
    return {
      spent: deltaPercent(current.totals.spent, previous.totals.spent),
      wallet: deltaPercent(current.finance.walletBalance, previous.finance.walletBalance),
      advance: deltaPercent(current.finance.clientAdvance, previous.finance.clientAdvance),
      leads: deltaPercent(current.totals.leads, previous.totals.leads),
      cpl: deltaPercent(current.totals.cpl, previous.totals.cpl),
      views: deltaPercent(current.totals.views, previous.totals.views),
      conversion: deltaPercent(current.totals.conversion, previous.totals.conversion),
      chats: deltaPercent(current.totals.chats, previous.totals.chats),
      calls: deltaPercent(current.totals.calls, previous.totals.calls),
      favorites: deltaPercent(current.totals.favorites, previous.totals.favorites),
      cpc: deltaPercent(current.totals.cpc, previous.totals.cpc),
      adsCount: deltaPercent(current.totals.adsCount, previous.totals.adsCount)
    };
  }

  function getMetricValueFromDaily(row, key, project) {
    const leads = Number(row.chats || 0) + Number(row.calls || 0);

    switch (key) {
      case 'spent': return Number(row.spent || 0);
      case 'wallet': return Number(project.finance?.walletBalance || 0);
      case 'advance': return Number(project.finance?.clientAdvance || 0);
      case 'leads': return leads;
      case 'cpl': return formatters.safeDivide(Number(row.spent || 0), leads);
      case 'views': return Number(row.views || 0);
      case 'conversion': {
        const conversion = formatters.safeDivide(leads, Number(row.views || 0));
        return conversion === null ? null : conversion * 100;
      }
      case 'chats': return Number(row.chats || 0);
      case 'calls': return Number(row.calls || 0);
      case 'favorites': return Number(row.favorites || 0);
      case 'cpc': return formatters.safeDivide(Number(row.spent || 0), Number(row.views || 0));
      case 'adsCount': return Number(project.metrics?.adsCount || 0);
      default: return null;
    }
  }

  function buildChartSeries(projects, metric) {
    const dailyStats = aggregateDailyStats(projects || []);

    return dailyStats.map(row => {
      const leads = Number(row.chats || 0) + Number(row.calls || 0);
      let value = leads;

      if (metric === 'spent') value = Number(row.spent || 0);
      if (metric === 'cpl') value = formatters.safeDivide(Number(row.spent || 0), leads) || 0;

      return {
        date: row.date,
        value,
        spent: row.spent,
        leads,
        cpl: formatters.safeDivide(Number(row.spent || 0), leads)
      };
    });
  }

  function getLeadSourceStructure(summary) {
    const totals = summary.totals;
    const sourceTotal = totals.chats + totals.calls + totals.favorites;

    return [
      { key: 'chats', label: 'Чаты', value: totals.chats },
      { key: 'calls', label: 'Звонки', value: totals.calls },
      { key: 'favorites', label: 'Избранное', value: totals.favorites }
    ].map(source => ({
      ...source,
      percent: sourceTotal ? source.value / sourceTotal * 100 : null
    }));
  }

  function getBestProject(projects) {
    if (!projects.length) return null;
    return projects.reduce((best, project) => {
      if (!best) return project;
      if (project.totals.leads > best.totals.leads) return project;
      if (project.totals.leads === best.totals.leads && Number(project.totals.cpl || Infinity) < Number(best.totals.cpl || Infinity)) return project;
      return best;
    }, null);
  }

  function buildExportRows(projects, selectedMetricKeys) {
    const metricKeys = Array.isArray(selectedMetricKeys) ? selectedMetricKeys : [];
    const rows = [];

    (projects || []).forEach(project => {
      (project.dailyStats || []).forEach(row => {
        const values = {};
        metricKeys.forEach(key => {
          values[key] = getMetricValueFromDaily(row, key, project);
        });
        rows.push({
          date: row.date,
          projectId: project.id,
          projectName: project.name,
          values
        });
      });
    });

    return rows;
  }

  window.statisticsService = {
    buildChartSeries,
    buildExportRows,
    compareSummaries,
    getBalanceForecastLabel,
    getBestProject,
    getLeadSourceStructure,
    getPeriodRange,
    getPreviousRange,
    summarize
  };
})();
