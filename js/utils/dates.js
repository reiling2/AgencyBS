(function () {
  'use strict';

  function todayIso() {
    return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  function addMonthsIso(date, months) {
    const value = date ? new Date(date) : new Date();
    value.setMonth(value.getMonth() + months);
    return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  window.absDates = { addMonthsIso, todayIso };
})();
