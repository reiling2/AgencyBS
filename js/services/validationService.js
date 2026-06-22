(function () {
  'use strict';

  function clearErrors(form) {
    form.querySelectorAll('.field-error').forEach(error => error.remove());
    form.querySelectorAll('.is-invalid').forEach(field => field.classList.remove('is-invalid'));
  }

  function showError(input, message) {
    input.classList.add('is-invalid');
    const error = document.createElement('span');
    error.className = 'field-error';
    error.textContent = message;
    input.closest('.field')?.appendChild(error);
  }

  function validateProjectCreateForm(form) {
    clearErrors(form);
    const required = [
      ['title', 'Укажи название проекта'],
      ['clientName', 'Укажи клиента'],
      ['niche', 'Укажи нишу']
    ];
    const errors = [];
    required.forEach(([name, message]) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (input && !String(input.value || '').trim()) {
        errors.push({ input, message });
        showError(input, message);
      }
    });
    if (errors.length) errors[0].input.focus();
    return { errors, valid: errors.length === 0 };
  }

  window.validationService = { validateProjectCreateForm };
})();
