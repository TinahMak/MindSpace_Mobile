import { API_URL } from './config';

let authToken = null;
let onUnauthorized = null;

export function setAuthToken(token) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export class ApiError extends Error {
  constructor(message, status, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields; // { fieldName: 'first error message' }
  }
}

// DRF errors come back as {"detail": "..."} or {"field": ["msg", ...]}.
function parseError(status, body) {
  if (!body || typeof body !== 'object') {
    return new ApiError(status >= 500 ? 'Something went wrong on the server. Try again shortly.' : 'Request failed.', status);
  }
  if (typeof body.detail === 'string') return new ApiError(body.detail, status);
  const fields = {};
  for (const [key, val] of Object.entries(body)) {
    fields[key] = Array.isArray(val) ? String(val[0]) : String(val);
  }
  const first = Object.values(fields)[0] || 'Please check the form and try again.';
  return new ApiError(first, status, fields);
}

export async function api(path, { method = 'GET', body, form, auth = true, timeout = 25000 } = {}) {
  const headers = { Accept: 'application/json' };
  if (auth && authToken) headers.Authorization = `Token ${authToken}`;

  let payload;
  if (form) {
    payload = form; // FormData: let fetch set the multipart boundary
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  // Never leave a spinner running forever: give up after `timeout` ms.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: payload, signal: controller.signal });
  } catch (err) {
    clearTimeout(timer);
    if (err?.name === 'AbortError') {
      throw new ApiError(
        'MindSpace is taking too long to respond. Check that Django is still running, then try again.',
        0,
      );
    }
    throw new ApiError(
      "Can't reach MindSpace. Check that your phone and computer are on the same Wi-Fi and Django is running.",
      0,
    );
  }

  clearTimeout(timer);
  if (res.status === 204) return null;

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && auth && authToken && onUnauthorized) onUnauthorized();
    throw parseError(res.status, data);
  }
  return data;
}
