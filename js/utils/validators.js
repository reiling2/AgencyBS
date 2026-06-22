(function () {
  'use strict';

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[+()0-9\s-]{7,}$/;

  function required(value) {
    return String(value ?? '').trim().length > 0;
  }

  function email(value) {
    return required(value) && emailPattern.test(String(value).trim());
  }

  function phone(value) {
    return required(value) && phonePattern.test(String(value).trim());
  }

  function positiveNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0;
  }

  function isoDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
  }

  window.absValidators = {
    email,
    isoDate,
    phone,
    positiveNumber,
    required
  };
})();
