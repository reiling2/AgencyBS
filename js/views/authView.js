(function () {
  'use strict';

  const ROOT_ID = 'authRoot';

  function getRoot() {
    return document.getElementById(ROOT_ID);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function render(options = {}) {
    const root = getRoot();
    if (!root) return;
    const email = escapeHtml(options.email || '');
    root.innerHTML = `
      <div class="auth-shell">
        <form class="auth-card" id="authLoginForm" autocomplete="off" novalidate>
          <div class="auth-brand">
            <div class="auth-brand-mark">ABS</div>
            <div>
              <p>AgencyBS</p>
              <h1 id="authTitle">Вход</h1>
            </div>
          </div>

          <label class="auth-field">
            <span>Email</span>
            <input id="authEmail" name="email" type="email" autocomplete="username" value="${email}" required>
          </label>

          <label class="auth-field">
            <span>Пароль</span>
            <input id="authPassword" name="password" type="password" autocomplete="current-password" required>
          </label>

          <div class="auth-error" id="authLoginError" role="alert" hidden></div>

          <button class="auth-submit" id="authSubmit" type="submit">
            <span id="authSubmitText">Войти</span>
          </button>
        </form>
      </div>
    `;
  }

  function bindSubmit(handler) {
    const form = document.getElementById('authLoginForm');
    form?.addEventListener('submit', event => {
      event.preventDefault();
      const formData = new FormData(form);
      handler({
        email: String(formData.get('email') || '').trim(),
        password: String(formData.get('password') || '')
      });
    });
  }

  function setLoading(isLoading, text = 'Входим...') {
    const form = document.getElementById('authLoginForm');
    const submit = document.getElementById('authSubmit');
    const submitText = document.getElementById('authSubmitText');
    if (form) form.classList.toggle('is-loading', Boolean(isLoading));
    if (submit) submit.disabled = Boolean(isLoading);
    if (submitText) submitText.textContent = isLoading ? text : 'Войти';
  }

  function setError(message = '') {
    const error = document.getElementById('authLoginError');
    if (!error) return;
    error.textContent = message;
    error.hidden = !message;
  }

  function focusEmail() {
    document.getElementById('authEmail')?.focus();
  }

  window.authView = {
    bindSubmit,
    focusEmail,
    render,
    setError,
    setLoading
  };
})();
