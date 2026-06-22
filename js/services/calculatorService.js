(function () {
  'use strict';

  function calculate(input) {
    return window.absCalculations.calculateKpi(input || {});
  }

  function saveResult(projectId, result) {
    return window.calculatorApi.saveResult(projectId, window.calculatorModel.createResult({ ...result, projectId }));
  }

  function listResults(projectId) {
    return window.calculatorApi.listResults(projectId);
  }

  window.calculatorService = { calculate, listResults, saveResult };
})();
