(function () {
  'use strict';

  const EMPTY = '—';
  const moneyFormatter = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0
  });
  const numberFormatter = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0
  });
  const decimalFormatter = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });

  function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  function asNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function money(value) {
    const number = asNumber(value);
    if (number === null) return EMPTY;
    return `${moneyFormatter.format(Math.round(number))} ₽`;
  }

  function number(value) {
    const parsed = asNumber(value);
    if (parsed === null) return EMPTY;
    return numberFormatter.format(Math.round(parsed));
  }

  function decimal(value, digits = 1) {
    const parsed = asNumber(value);
    if (parsed === null) return EMPTY;
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(parsed);
  }

  function percent(value, digits = 1) {
    const parsed = asNumber(value);
    if (parsed === null) return EMPTY;
    const formatter = digits === 1 ? decimalFormatter : new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
    return `${formatter.format(parsed)}%`;
  }

  function dateToIso(date) {
    const normalized = new Date(date);
    if (Number.isNaN(normalized.getTime())) return '';
    const offsetDate = new Date(normalized.getTime() - normalized.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 10);
  }

  function todayIso() {
    return dateToIso(new Date());
  }

  function addDays(date, amount) {
    const normalized = new Date(date);
    normalized.setDate(normalized.getDate() + amount);
    return normalized;
  }

  function dateShort(value) {
    if (!value) return EMPTY;
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return EMPTY;
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }).replace('.', '');
  }

  function daysBetweenInclusive(dateFrom, dateTo) {
    if (!dateFrom || !dateTo) return 0;
    const start = new Date(`${dateFrom}T00:00:00`);
    const end = new Date(`${dateTo}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
    return Math.round((end - start) / 86400000) + 1;
  }

  function safeDivide(numerator, denominator) {
    const top = asNumber(numerator);
    const bottom = asNumber(denominator);
    if (top === null || bottom === null || bottom === 0) return null;
    return top / bottom;
  }

  window.absFormatters = {
    EMPTY,
    addDays,
    asNumber,
    dateShort,
    dateToIso,
    daysBetweenInclusive,
    decimal,
    isFiniteNumber,
    money,
    number,
    percent,
    safeDivide,
    todayIso
  };
})();
