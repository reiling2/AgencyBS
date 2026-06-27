(function () {
  'use strict';

  let started = false;

  function isBackendMode() {
    const config = window.absConfig || {};
    if (config.dataMode === 'mock') return false;
    return config.isBackendMode === true || config.dataMode === 'backend';
  }

  function getAuthRoot() {
    return document.getElementById('authRoot');
  }

  function getShellNodes() {
    return {
      authRoot: getAuthRoot(),
      appShell: document.querySelector('.app-shell'),
      mobileTopbar: document.querySelector('.mobile-topbar')
    };
  }

  function showApp() {
    const { authRoot, appShell, mobileTopbar } = getShellNodes();
    document.body.classList.remove('auth-locked');
    document.body.classList.add('auth-unlocked');
    authRoot?.setAttribute('hidden', '');
    appShell?.removeAttribute('hidden');
    mobileTopbar?.removeAttribute('hidden');
    document.body.classList.remove('menu-open');
    window.absApp?.updateWebsiteNewLeadBadge?.();
  }

  function showLogin() {
    const { authRoot, appShell, mobileTopbar } = getShellNodes();
    document.body.classList.add('auth-locked');
    document.body.classList.remove('auth-unlocked');
    authRoot?.removeAttribute('hidden');
    appShell?.setAttribute('hidden', '');
    mobileTopbar?.setAttribute('hidden', '');
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarBackdrop')?.classList.remove('active');
    document.body.classList.remove('menu-open');
    window.authView?.setLoading?.(false);
  }

  function handleAuthState(nextState) {
    if (nextState?.isAuthenticated) {
      showApp();
      return;
    }
    showLogin();
  }

  function submitLogin(credentials) {
    window.authView?.setError?.('');
    if (!credentials.email || !credentials.password) {
      window.authView?.setError?.('Введите email и пароль');
      return;
    }

    window.authView?.setLoading?.(true);
    window.authService.login(credentials)
      .then(user => {
        if (!user) throw new Error('Не удалось войти');
        showApp();
      })
      .catch(error => {
        window.authView?.setError?.(error?.message || 'Не удалось войти');
      })
      .finally(() => {
        if (!window.authService.isAuthenticated()) {
          window.authView?.setLoading?.(false);
        }
      });
  }

  function checkBackendSession() {
    if (!isBackendMode()) return Promise.resolve(null);
    window.authView?.setLoading?.(true, 'Проверяем...');
    return window.authApi.getCurrentUser()
      .then(user => {
        if (user) {
          window.authState?.setUser?.(user);
          return user;
        }
        window.authState?.clear?.();
        return null;
      })
      .catch(() => {
        window.authState?.clear?.();
        return null;
      })
      .finally(() => {
        if (!window.authService?.isAuthenticated?.()) {
          window.authView?.setLoading?.(false);
        }
      });
  }

  function setLogoutLoading(isLoading) {
    const logoutButton = document.getElementById('authLogoutBtn');
    if (!logoutButton) return;
    logoutButton.disabled = Boolean(isLoading);
    logoutButton.textContent = isLoading ? 'Выходим...' : 'Выйти';
  }

  function bindLogoutButton() {
    document.getElementById('authLogoutBtn')?.addEventListener('click', () => {
      setLogoutLoading(true);
      logout()
        .catch(() => {})
        .finally(() => setLogoutLoading(false));
    });
  }

  function start() {
    if (started) return;
    started = true;

    const defaultEmail = window.absConfig?.isMockMode ? 'owner@agencybs.local' : '';
    window.authView?.render?.({ email: defaultEmail });
    window.authView?.bindSubmit?.(submitLogin);
    bindLogoutButton();
    window.authState?.subscribe?.(handleAuthState);

    const authState = window.authState?.get?.();
    if (authState?.isAuthenticated) {
      showApp();
      return;
    }

    showLogin();
    checkBackendSession().then(() => {
      if (!window.authService?.isAuthenticated?.()) {
        window.authView?.focusEmail?.();
      }
    });
  }

  function logout() {
    return window.authService.logout();
  }

  window.authBootstrap = {
    logout,
    showApp,
    showLogin,
    start
  };

  start();
})();
