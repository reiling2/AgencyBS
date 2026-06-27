(function () {
  'use strict';

  const JSON_CONTENT_TYPE = 'application/json';
  const EMPTY_RESPONSE_STATUSES = new Set([204, 205, 304]);
  const SENSITIVE_KEY_PATTERN = /(authorization|password|token|secret|clientSecret|accessToken|refreshToken)/i;

  function getConfig() {
    return window.absConfig || { apiBaseUrl: '/api', dataMode: 'mock' };
  }

  function isAbsoluteUrl(value) {
    return /^https?:\/\//i.test(String(value || ''));
  }

  function joinUrl(baseUrl, path) {
    const rawPath = String(path || '');
    if (isAbsoluteUrl(rawPath)) return rawPath;

    const base = String(baseUrl || '').replace(/\/+$/, '');
    const cleanPath = rawPath.replace(/^\/+/, '');
    if (!base) return `/${cleanPath}`;
    if (rawPath === base || rawPath.startsWith(`${base}/`)) return rawPath;
    return `${base}/${cleanPath}`;
  }

  function appendQuery(url, query) {
    if (!query || typeof query !== 'object') return url;
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) {
        value.forEach(item => params.append(key, item));
        return;
      }
      params.set(key, value);
    });
    const queryString = params.toString();
    if (!queryString) return url;
    return `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
  }

  function buildUrl(path, query) {
    return appendQuery(joinUrl(getConfig().apiBaseUrl, path), query);
  }

  function isJsonResponse(response) {
    return (response.headers.get('content-type') || '').toLowerCase().includes('json');
  }

  async function readBody(response) {
    if (EMPTY_RESPONSE_STATUSES.has(response.status)) return null;
    if (response.headers.get('content-length') === '0') return null;
    if (isJsonResponse(response)) {
      try {
        return await response.json();
      } catch (err) {
        return null;
      }
    }

    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (err) {
      return text;
    }
  }

  function sanitizeDetails(value) {
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(sanitizeDetails);
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? '[redacted]' : sanitizeDetails(item)
    ]));
  }

  function createError({ message, status = 0, statusText = '', details = null, url = '' }) {
    return {
      message,
      status,
      statusText,
      details: sanitizeDetails(details),
      url,
      isHttpError: status > 0,
      isNetworkError: status === 0
    };
  }

  function isJsonSerializableBody(body) {
    return body !== undefined
      && body !== null
      && typeof body === 'object'
      && !(body instanceof FormData)
      && !(body instanceof Blob)
      && !(body instanceof URLSearchParams);
  }

  function prepareBody(body, headers) {
    if (body === undefined) return undefined;
    if (isJsonSerializableBody(body)) {
      if (!headers.has('Content-Type')) headers.set('Content-Type', JSON_CONTENT_TYPE);
      return JSON.stringify(body);
    }
    return body;
  }

  async function request(method, path, options = {}) {
    const url = buildUrl(path, options.query);
    const headers = new Headers(options.headers || {});
    const hasBody = !['GET', 'HEAD'].includes(method) && options.body !== undefined;

    if (typeof fetch !== 'function') {
      return {
        ok: false,
        status: 0,
        statusText: '',
        data: null,
        error: createError({ message: 'Fetch API is not available', url })
      };
    }

    try {
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers,
        signal: options.signal,
        body: hasBody ? prepareBody(options.body, headers) : undefined
      });
      const data = await readBody(response);

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          statusText: response.statusText,
          data: null,
          error: createError({
            message: data?.message || response.statusText || 'Request failed',
            status: response.status,
            statusText: response.statusText,
            details: data,
            url
          })
        };
      }

      return {
        ok: true,
        status: response.status,
        statusText: response.statusText,
        data,
        error: null,
        headers: response.headers
      };
    } catch (err) {
      return {
        ok: false,
        status: 0,
        statusText: '',
        data: null,
        error: createError({
          message: err?.name === 'AbortError' ? 'Request aborted' : 'Network request failed',
          details: { name: err?.name || 'Error', message: err?.message || String(err) },
          url
        })
      };
    }
  }

  function get(path, options) {
    return request('GET', path, options);
  }

  function post(path, body, options = {}) {
    return request('POST', path, { ...options, body });
  }

  function patch(path, body, options = {}) {
    return request('PATCH', path, { ...options, body });
  }

  function remove(path, options) {
    return request('DELETE', path, options);
  }

  window.absApi = window.absApi || {};
  window.absApiClient = Object.freeze({
    buildUrl,
    delete: remove,
    get,
    patch,
    post,
    request
  });
  window.absApi.client = window.absApiClient;
})();
