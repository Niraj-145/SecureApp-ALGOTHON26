const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.detail || `Request failed (${res.status})`;
    const error = new Error(msg);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

// ── Auth ──────────────────────────────────────────────────
export const authApi = {
  register: (body) => request('POST', '/auth/register', body),
  login: (body) => request('POST', '/auth/login', body),
  logout: () => request('POST', '/auth/logout'),
};

// ── Users ─────────────────────────────────────────────────
export const userApi = {
  profile: () => request('GET', '/users/profile'),
  list: () => request('GET', '/users'),
  dashboard: () => request('GET', '/users/dashboard'),
  deleteUser: (id) => request('DELETE', `/users/${id}`),
};

// ── Records ───────────────────────────────────────────────
export const recordApi = {
  list: (search = '') => request('GET', `/records?search=${encodeURIComponent(search)}`),
  get: (id) => request('GET', `/records/${id}`),
  create: (body) => request('POST', '/records', body),
  update: (id, body) => request('PUT', `/records/${id}`, body),
  delete: (id) => request('DELETE', `/records/${id}`),
};

// ── Comments ──────────────────────────────────────────────
export const commentApi = {
  list: (recordId) => request('GET', `/records/${recordId}/comments`),
  create: (recordId, body) => request('POST', `/records/${recordId}/comments`, body),
};

// ── Security (Admin Only) ─────────────────────────────────
export const securityApi = {
  vulnerabilities: () => request('GET', '/security/vulnerabilities'),
  vulnerability: (id) => request('GET', `/security/vulnerabilities/${id}`),
  demo: (id) => request('POST', `/security/demo/${id}`),
  fix: (id) => request('POST', `/security/fix/${id}`),
  retest: (id) => request('POST', `/security/retest/${id}`),
  score: () => request('GET', '/security/score'),
  report: () => request('GET', '/security/report'),
  activity: () => request('GET', '/security/activity'),
  dashboardStats: () => request('GET', '/security/dashboard-stats'),
  reset: () => request('POST', '/security/reset'),
};
